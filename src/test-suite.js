import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { seedDatabase } from './seeders/seed.js';
import { Hospital } from './models/Hospital.js';
import { User } from './models/User.js';

const TEST_PORT = 10001;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

async function runTestSuite() {
  console.log(`${colors.bold}${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  PulseRelay Automated API Test Suite   ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}========================================${colors.reset}\n`);

  // 1. Connect to DB and seed
  console.log('[1/3] Connecting to MongoDB and seeding demo records...');
  await connectDB();
  await seedDatabase();

  // 2. Start HTTP server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, '127.0.0.1', resolve));
  console.log(`[2/3] Test server listening on ${BASE_URL}\n`);

  console.log('[3/3] Running end-to-end endpoint verification:\n');

  let passed = 0;
  let failed = 0;

  async function testEndpoint(name, method, path, body = null, token = null) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const options = {
        method,
        headers,
      };
      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${BASE_URL}${path}`, options);
      const data = await response.json();

      if (response.ok && data.success !== false) {
        console.log(`  ${colors.green}✔ PASS${colors.reset} [${response.status}] ${colors.bold}${method}${colors.reset} ${path} - ${name}`);
        passed++;
        return { ok: true, status: response.status, data };
      } else {
        console.log(`  ${colors.red}✖ FAIL${colors.reset} [${response.status}] ${colors.bold}${method}${colors.reset} ${path} - ${name}`);
        console.log(`         Error: ${data.message || JSON.stringify(data)}`);
        failed++;
        return { ok: false, status: response.status, data };
      }
    } catch (err) {
      console.log(`  ${colors.red}✖ ERROR${colors.reset} ${method} ${path} - ${err.message}`);
      failed++;
      return { ok: false, error: err.message };
    }
  }

  // --- TESTS ---

  // 1. Health check
  await testEndpoint('Health Check', 'GET', '/health');

  // 2. Demo users list
  await testEndpoint('Get Demo Users List', 'GET', '/api/v1/auth/demo-users');

  // 3. Login as Super Admin
  const adminLogin = await testEndpoint('Login as Super Admin', 'POST', '/api/v1/auth/login', {
    email: 'superadmin@pulserelay.org',
    password: 'Password@123',
  });
  const superAdminToken = adminLogin.data?.data?.token;

  // 4. Login as City Care Emergency Coordinator
  const coordLogin = await testEndpoint('Login as Hospital Coordinator', 'POST', '/api/v1/auth/login', {
    email: 'coordinator@citycare.org',
    password: 'Password@123',
  });
  const coordToken = coordLogin.data?.data?.token;

  // 5. Login as Apollo Blood Bank Officer
  const bboLogin = await testEndpoint('Login as Blood Bank Officer', 'POST', '/api/v1/auth/login', {
    email: 'bbo@apollo.org',
    password: 'Password@123',
  });
  const bboToken = bboLogin.data?.data?.token;

  // 6. Get Current User Profile
  await testEndpoint('Get Profile (/me)', 'GET', '/api/v1/auth/me', null, coordToken);

  // 7. Get All Hospitals
  const hospitalsRes = await testEndpoint('List All Hospitals', 'GET', '/api/v1/hospitals');
  const hospitals = hospitalsRes.data?.data || [];
  const cityCare = hospitals.find((h) => h.name.includes('City Care'));
  const apollo = hospitals.find((h) => h.name.includes('Apollo'));

  // 8. Nearby Hospitals for City Care
  if (cityCare) {
    await testEndpoint('Get Nearby Hospitals with Distance', 'GET', `/api/v1/hospitals/${cityCare._id}/nearby`);
  }

  // 9. Hospital Inventory & Summary
  if (apollo) {
    await testEndpoint('Get Hospital Inventory', 'GET', `/api/v1/inventory/hospital/${apollo._id}`);
    await testEndpoint('Get Inventory Summary (Metrics)', 'GET', `/api/v1/inventory/hospital/${apollo._id}/summary`);
  }

  // 10. Coordinator creates Emergency Request (3 units O- PRBC)
  let createdRequest = null;
  if (cityCare) {
    const reqRes = await testEndpoint(
      'Broadcast Emergency Request (3 units O- PRBC)',
      'POST',
      '/api/v1/requests',
      {
        bloodGroup: 'O-',
        component: 'PRBC',
        requiredUnits: 3,
        urgency: 'CRITICAL',
        additionalNotes: 'Urgent ICU trauma patient required within 1 hour',
      },
      coordToken
    );
    createdRequest = reqRes.data?.data?.request;
  }

  // 11. Get Matching Hospitals for Request
  if (createdRequest) {
    await testEndpoint(
      'Smart Rule-based Matching Hospitals',
      'GET',
      `/api/v1/requests/${createdRequest._id}/matching`
    );
  }

  // 12. Apollo BBO submits an offer of 3 units
  let createdOffer = null;
  if (createdRequest && apollo) {
    const offerRes = await testEndpoint(
      'Submit Offer from Apollo Demo Blood Centre',
      'POST',
      '/api/v1/offers',
      {
        requestId: createdRequest._id,
        offeredUnits: 3,
        notes: 'Cold-chain transport box ready for dispatch',
      },
      bboToken
    );
    createdOffer = offerRes.data?.data;
  }

  // 13. Get Offers for Request
  if (createdRequest) {
    await testEndpoint(
      'Get Offers for Emergency Request',
      'GET',
      `/api/v1/offers/request/${createdRequest._id}`
    );
  }

  // 14. Coordinator Accepts Offer (Triggers Reservation & Transfer generation with OTP)
  let transferRecord = null;
  if (createdOffer) {
    const acceptRes = await testEndpoint(
      'Accept Offer (Reserve Stock & Generate Transfer)',
      'PATCH',
      `/api/v1/offers/${createdOffer._id}/accept`,
      {},
      coordToken
    );
    transferRecord = acceptRes.data?.data?.transfer;
  }

  // 15. Apollo BBO Initiates Dispatch
  if (transferRecord) {
    await testEndpoint(
      'Initiate Dispatch with Driver info',
      'PATCH',
      `/api/v1/transfers/${transferRecord._id}/dispatch`,
      {
        driverContact: '+91 98260 55555',
        vehicleNumber: 'MP-09-EM-4821',
      },
      bboToken
    );
  }

  // 16. City Care Coordinator Verifies Handover OTP
  if (transferRecord) {
    await testEndpoint(
      `Verify Handover OTP (${transferRecord.otp})`,
      'PATCH',
      `/api/v1/transfers/${transferRecord._id}/verify-otp`,
      {
        otp: transferRecord.otp,
      },
      coordToken
    );
  }

  // 17. Notifications
  await testEndpoint('Get Notifications', 'GET', '/api/v1/notifications', null, coordToken);

  // 18. Audit Logs (Super Admin)
  await testEndpoint('Get Audit Logs (Admin)', 'GET', '/api/v1/audit-logs', null, superAdminToken);

  console.log(`\n${colors.bold}----------------------------------------${colors.reset}`);
  console.log(`Tests Completed: ${colors.green}${passed} Passed${colors.reset}, ${failed > 0 ? colors.red : colors.green}${failed} Failed${colors.reset}`);
  console.log(`${colors.bold}----------------------------------------${colors.reset}\n`);

  server.close();
  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite().catch((err) => {
  console.error('[Test Suite Error]:', err);
  process.exit(1);
});
