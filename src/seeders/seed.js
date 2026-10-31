import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import { Hospital } from '../models/Hospital.js';
import { User } from '../models/User.js';
import { BloodInventory } from '../models/BloodInventory.js';
import { EmergencyRequest } from '../models/EmergencyRequest.js';
import { Offer } from '../models/Offer.js';
import { Reservation } from '../models/Reservation.js';
import { Transfer } from '../models/Transfer.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { InventoryTransaction } from '../models/InventoryTransaction.js';

export const seedDatabase = async () => {
  console.log('[PulseRelay Seeder] Starting database seeding...');

  // Clear existing collections
  await Hospital.deleteMany({});
  await User.deleteMany({});
  await BloodInventory.deleteMany({});
  await EmergencyRequest.deleteMany({});
  await Offer.deleteMany({});
  await Reservation.deleteMany({});
  await Transfer.deleteMany({});
  await Notification.deleteMany({});
  await AuditLog.deleteMany({});
  await InventoryTransaction.deleteMany({});

  console.log('[PulseRelay Seeder] Cleared old collections.');

  // 1. Seed Fictional Hospitals in Indore
  const hospitals = await Hospital.insertMany([
    {
      name: 'City Care Hospital',
      hospitalCode: 'IND-CITY-01',
      address: '14/2 MG Road, South Tukoganj',
      city: 'Indore',
      coordinates: { lat: 22.7196, lng: 75.8577 },
      contact: {
        phone: '+91 731 254 1100',
        email: 'emergency@citycare.org',
        emergencyContact: '+91 98260 11111',
      },
      verificationStatus: 'VERIFIED',
      role: 'REQUESTING',
      isActive: true,
    },
    {
      name: 'Apollo Demo Blood Centre',
      hospitalCode: 'IND-APOLLO-02',
      address: 'Plot 4, Sector 7, Vijay Nagar',
      city: 'Indore',
      coordinates: { lat: 22.7533, lng: 75.8937 },
      contact: {
        phone: '+91 731 298 4400',
        email: 'bloodbank@apollodemo.org',
        emergencyContact: '+91 98260 22222',
      },
      verificationStatus: 'VERIFIED',
      role: 'PROVIDING',
      isActive: true,
    },
    {
      name: 'Central Medical Centre',
      hospitalCode: 'IND-CENTRAL-03',
      address: '22 Ring Road, Khajrana Square',
      city: 'Indore',
      coordinates: { lat: 22.7300, lng: 75.8800 },
      contact: {
        phone: '+91 731 270 3300',
        email: 'transfusion@centralmedical.org',
        emergencyContact: '+91 98260 33333',
      },
      verificationStatus: 'VERIFIED',
      role: 'PROVIDING',
      isActive: true,
    },
    {
      name: 'LifeLine Hospital',
      hospitalCode: 'IND-LIFELINE-04',
      address: '55 AB Road, Rajendra Nagar',
      city: 'Indore',
      coordinates: { lat: 22.6900, lng: 75.8300 },
      contact: {
        phone: '+91 731 285 5500',
        email: 'support@lifelineindore.org',
        emergencyContact: '+91 98260 44444',
      },
      verificationStatus: 'VERIFIED',
      role: 'PROVIDING',
      isActive: true,
    },
  ]);

  const [cityCare, apollo, centralMed, lifeLine] = hospitals;
  console.log('[PulseRelay Seeder] Seeded 4 fictional Indore hospitals.');

  // 2. Seed Users for 4 Roles
  const salt = await bcrypt.genSalt(10);
  const defaultPassword = await bcrypt.hash('Password@123', salt);

  const users = await User.insertMany([
    // Role 1: Super Admin
    {
      name: 'Dr. Rajesh Sharma (Super Admin)',
      email: 'superadmin@pulserelay.org',
      password: defaultPassword,
      role: 'SUPER_ADMIN',
      phone: '+91 98930 99999',
      isActive: true,
    },
    // Role 2: Hospital Admin (City Care)
    {
      name: 'Dr. Sunita Deshmukh',
      email: 'admin@citycare.org',
      password: defaultPassword,
      role: 'HOSPITAL_ADMIN',
      hospitalId: cityCare._id,
      phone: '+91 98260 11101',
      isActive: true,
    },
    // Role 4: Emergency Coordinator (City Care)
    {
      name: 'Vikram Joshi',
      email: 'coordinator@citycare.org',
      password: defaultPassword,
      role: 'EMERGENCY_COORDINATOR',
      hospitalId: cityCare._id,
      phone: '+91 98260 11102',
      isActive: true,
    },
    // Role 3: Blood Bank Officer (Apollo Demo Blood Centre)
    {
      name: 'Dr. Priya Nambiar',
      email: 'bbo@apollo.org',
      password: defaultPassword,
      role: 'BLOOD_BANK_OFFICER',
      hospitalId: apollo._id,
      phone: '+91 98260 22201',
      isActive: true,
    },
    // Role 3: Blood Bank Officer (Central Medical)
    {
      name: 'Amitabh Sen',
      email: 'bbo@centralmedical.org',
      password: defaultPassword,
      role: 'BLOOD_BANK_OFFICER',
      hospitalId: centralMed._id,
      phone: '+91 98260 33301',
      isActive: true,
    },
    // Role 3: Blood Bank Officer (LifeLine)
    {
      name: 'Kavita Verma',
      email: 'bbo@lifeline.org',
      password: defaultPassword,
      role: 'BLOOD_BANK_OFFICER',
      hospitalId: lifeLine._id,
      phone: '+91 98260 44401',
      isActive: true,
    },
  ]);

  console.log('[PulseRelay Seeder] Seeded users for all 4 roles.');

  // 3. Seed Realistic Inventory (Exact Hackathon Demo Scenario)
  // Scenario:
  // Hospital A requires 3 units of O-negative PRBC
  // Hospital B (Apollo) has 3 units available
  // Hospital C (Central Medical) has 1 unit available
  // Hospital D (LifeLine) has NO O- PRBC
  const expiry30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const expiry5Days = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

  await BloodInventory.insertMany([
    // City Care (Hospital A) - Has zero O- PRBC, but some other units
    {
      hospitalId: cityCare._id,
      bloodGroup: 'A+',
      component: 'PRBC',
      units: 4,
      reservedUnits: 0,
      expiryDate: expiry30Days,
      availabilityStatus: 'AVAILABLE',
      batchNumber: 'BT-CC-01',
    },
    {
      hospitalId: cityCare._id,
      bloodGroup: 'B+',
      component: 'Whole Blood',
      units: 2,
      reservedUnits: 0,
      expiryDate: expiry30Days,
      availabilityStatus: 'LOW_STOCK',
      batchNumber: 'BT-CC-02',
    },
    {
      hospitalId: cityCare._id,
      bloodGroup: 'O-',
      component: 'PRBC',
      units: 0,
      reservedUnits: 0,
      expiryDate: expiry30Days,
      availabilityStatus: 'UNAVAILABLE',
      batchNumber: 'BT-CC-03',
    },

    // Apollo Demo Blood Centre (Hospital B) - Has 3 units of O- PRBC!
    {
      hospitalId: apollo._id,
      bloodGroup: 'O-',
      component: 'PRBC',
      units: 3,
      reservedUnits: 0,
      expiryDate: expiry30Days,
      availabilityStatus: 'AVAILABLE',
      batchNumber: 'BT-AP-O-NEG',
    },
    {
      hospitalId: apollo._id,
      bloodGroup: 'O+',
      component: 'Whole Blood',
      units: 12,
      reservedUnits: 0,
      expiryDate: expiry30Days,
      availabilityStatus: 'AVAILABLE',
      batchNumber: 'BT-AP-O-POS',
    },
    {
      hospitalId: apollo._id,
      bloodGroup: 'AB-',
      component: 'FFP',
      units: 2,
      reservedUnits: 0,
      expiryDate: expiry5Days,
      availabilityStatus: 'LOW_STOCK',
      batchNumber: 'BT-AP-AB-NEG',
    },
    {
      hospitalId: apollo._id,
      bloodGroup: 'A-',
      component: 'Platelets',
      units: 5,
      reservedUnits: 0,
      expiryDate: expiry5Days,
      availabilityStatus: 'AVAILABLE',
      batchNumber: 'BT-AP-PLT-01',
    },

    // Central Medical Centre (Hospital C) - Has 1 unit of O- PRBC!
    {
      hospitalId: centralMed._id,
      bloodGroup: 'O-',
      component: 'PRBC',
      units: 1,
      reservedUnits: 0,
      expiryDate: expiry30Days,
      availabilityStatus: 'LOW_STOCK',
      batchNumber: 'BT-CM-O-NEG',
    },
    {
      hospitalId: centralMed._id,
      bloodGroup: 'B-',
      component: 'PRBC',
      units: 3,
      reservedUnits: 0,
      expiryDate: expiry30Days,
      availabilityStatus: 'AVAILABLE',
      batchNumber: 'BT-CM-B-NEG',
    },

    // LifeLine Hospital (Hospital D) - Has NO O- PRBC
    {
      hospitalId: lifeLine._id,
      bloodGroup: 'A+',
      component: 'PRBC',
      units: 8,
      reservedUnits: 0,
      expiryDate: expiry30Days,
      availabilityStatus: 'AVAILABLE',
      batchNumber: 'BT-LL-A-POS',
    },
    {
      hospitalId: lifeLine._id,
      bloodGroup: 'B+',
      component: 'Platelets',
      units: 4,
      reservedUnits: 0,
      expiryDate: expiry5Days,
      availabilityStatus: 'AVAILABLE',
      batchNumber: 'BT-LL-PLT-01',
    },
    {
      hospitalId: lifeLine._id,
      bloodGroup: 'AB+',
      component: 'Whole Blood',
      units: 3,
      reservedUnits: 0,
      expiryDate: expiry30Days,
      availabilityStatus: 'AVAILABLE',
      batchNumber: 'BT-LL-AB-POS',
    },
  ]);

  console.log('[PulseRelay Seeder] Seeded blood inventory for all 4 hospitals.');

  console.log('[PulseRelay Seeder] Database seeded successfully!');
  console.log('--- DEMO LOGIN CREDENTIALS ---');
  console.log('1. Super Admin: superadmin@pulserelay.org | Password@123');
  console.log('2. Hospital A Admin: admin@citycare.org | Password@123');
  console.log('3. Hospital A Coordinator: coordinator@citycare.org | Password@123');
  console.log('4. Hospital B Blood Bank: bbo@apollo.org | Password@123');
  console.log('5. Hospital C Blood Bank: bbo@centralmedical.org | Password@123');
  console.log('6. Hospital D Blood Bank: bbo@lifeline.org | Password@123');
};

// If run directly via command line
if (process.argv[1]?.endsWith('seed.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      process.exit(0);
    } catch (err) {
      console.error('[PulseRelay Seeder Error]', err);
      process.exit(1);
    }
  })();
}
