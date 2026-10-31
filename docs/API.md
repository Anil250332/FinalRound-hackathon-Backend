# PulseRelay API Specification (v1.1)

Base URL: `/api/v1`  
Health Check: `GET /health`  
Format: JSON (`application/json`)

---

## 1. Response Formats

### Standard Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "errors": []
}
```

---

## 2. Authentication & Users (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/login` | Public | Login with email and password |
| GET | `/demo-users` | Public | List all demo users for quick hospital/role switching |
| GET | `/me` | Bearer | Get currently logged-in user profile |
| POST | `/staff` | Bearer (Admin) | Create blood bank officer or coordinator account |

### Demo Accounts Seeded:
- **Super Admin:** `superadmin@pulserelay.org` | `Password@123`
- **Hospital A Admin:** `admin@citycare.org` | `Password@123`
- **Hospital A Coordinator:** `coordinator@citycare.org` | `Password@123`
- **Hospital B Blood Bank (Apollo):** `bbo@apollo.org` | `Password@123`
- **Hospital C Blood Bank (Central):** `bbo@centralmedical.org` | `Password@123`
- **Hospital D Blood Bank (LifeLine):** `bbo@lifeline.org` | `Password@123`

---

## 3. Hospitals (`/api/v1/hospitals`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | List all registered hospitals |
| GET | `/:id` | Public | Get hospital details |
| GET | `/:id/nearby` | Public | Get nearby hospitals sorted by distance (km) |
| POST | `/` | Bearer (Super Admin) | Register a new hospital |
| PUT | `/:id` | Bearer (Admin) | Update hospital details |
| PATCH | `/:id/verify` | Bearer (Super Admin) | Update hospital verification status (`VERIFIED`, `PENDING`, `SUSPENDED`) |

---

## 4. Blood Inventory (`/api/v1/inventory`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/hospital/:hospitalId` | Public | List inventory for a hospital |
| GET | `/hospital/:hospitalId/summary` | Public | Get counts of total units, reserved units, low stock alerts |
| POST | `/` | Bearer (Officer/Admin) | Add or update inventory stock |
| PATCH | `/:id/units` | Bearer (Officer/Admin) | Adjust unit quantity with audit reason |
| DELETE | `/:id` | Bearer (Officer/Admin) | Delete inventory item (if 0 reserved units) |

---

## 5. Emergency Requests (`/api/v1/requests`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | List all emergency requests (filter by `status`, `hospitalId`) |
| GET | `/:id` | Public | Get request details by ID |
| GET | `/:id/matching` | Public | Get rule-based matching hospitals with distance and stock |
| POST | `/` | Bearer | Broadcast an emergency request (Generates `PR-REQ-XXXX`) |
| PATCH | `/:id/cancel` | Bearer | Cancel emergency request before dispatch |

---

## 6. Offers (`/api/v1/offers`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/request/:requestId` | Public | List all offers for a specific request |
| GET | `/hospital/:hospitalId` | Public | List all offers submitted by a hospital |
| POST | `/` | Bearer | Submit an offer (checks unreserved units) |
| PATCH | `/:id/accept` | Bearer | Accept offer (reserves units, updates request, creates transfer with OTP) |
| PATCH | `/:id/reject` | Bearer | Reject offer |

---

## 7. Transfers & OTP Verification (`/api/v1/transfers`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/:id` | Public | Get transfer tracking details |
| GET | `/hospital/:hospitalId` | Public | Get all incoming/outgoing transfers for a hospital |
| PATCH | `/:id/dispatch` | Bearer (Supplying) | Mark dispatch initiated (sets driver info) |
| PATCH | `/:id/verify-otp` | Bearer (Receiving) | Verify 6-digit OTP, deduct stock, complete transfer |

---

## 8. Notifications & Audits

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/notifications` | Bearer | List notifications for user/hospital |
| PATCH | `/api/v1/notifications/:id/read` | Bearer | Mark notification as read |
| PATCH | `/api/v1/notifications/read-all` | Bearer | Mark all notifications as read |
| GET | `/api/v1/audit-logs` | Bearer (Admin) | List audit log records |

---

## 9. Socket.IO Real-Time Events

- `hospital:join`: Send `hospitalId` to join private updates room.
- `emergency:broadcast`: Emitted to all clients when a new request is created.
- `offer:received`: Emitted to requesting hospital when an offer is submitted.
- `offer:accepted`: Emitted to offering hospital with generated OTP.
- `transfer:dispatched`: Emitted to receiving hospital when transit starts.
- `transfer:completed`: Emitted to both parties upon successful OTP handshake.
