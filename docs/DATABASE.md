# PulseRelay Database Schema Specification (v1.1)

Database: **MongoDB Atlas**  
ODM: **Mongoose**  
Collections: **10**

---

### 1. `hospitals`
- `_id`: ObjectId
- `name`: String
- `hospitalCode`: String (unique, e.g. `IND-CITY-01`)
- `address`: String
- `city`: String (`Indore`)
- `coordinates`: `{ lat: Number, lng: Number }`
- `contact`: `{ phone: String, email: String, emergencyContact: String }`
- `verificationStatus`: `'VERIFIED' | 'PENDING' | 'SUSPENDED'`
- `role`: `'REQUESTING' | 'PROVIDING' | 'BOTH'`
- `isActive`: Boolean

### 2. `users`
- `_id`: ObjectId
- `name`: String
- `email`: String (unique)
- `password`: String (bcrypt hash)
- `role`: `'SUPER_ADMIN' | 'HOSPITAL_ADMIN' | 'BLOOD_BANK_OFFICER' | 'EMERGENCY_COORDINATOR'`
- `hospitalId`: ObjectId (ref: `Hospital`)
- `phone`: String
- `isActive`: Boolean

### 3. `bloodinventories`
- `_id`: ObjectId
- `hospitalId`: ObjectId (ref: `Hospital`)
- `bloodGroup`: `'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'`
- `component`: `'Whole Blood' | 'PRBC' | 'Platelets' | 'FFP' | 'Cryoprecipitate'`
- `units`: Number
- `reservedUnits`: Number
- `expiryDate`: Date
- `availabilityStatus`: `'AVAILABLE' | 'LOW_STOCK' | 'RESERVED' | 'EXPIRED' | 'UNAVAILABLE'`
- `batchNumber`: String
- `lastUpdated`: Date

### 4. `emergencyrequests`
- `_id`: ObjectId
- `requestId`: String (unique, e.g. `PR-REQ-1001`)
- `requestingHospitalId`: ObjectId (ref: `Hospital`)
- `bloodGroup`: String
- `component`: String
- `requiredUnits`: Number
- `allocatedUnits`: Number
- `urgency`: `'CRITICAL' | 'HIGH' | 'NORMAL'`
- `requiredBy`: Date
- `location`: `{ city: String, coordinates: { lat: Number, lng: Number } }`
- `status`: `'SEARCHING' | 'OFFERS_RECEIVED' | 'PARTIALLY_ALLOCATED' | 'FULLY_ALLOCATED' | 'DISPATCH_INITIATED' | 'HANDOVER_COMPLETED' | 'CANCELLED' | 'EXPIRED'`
- `createdBy`: ObjectId (ref: `User`)

### 5. `offers`
- `_id`: ObjectId
- `requestId`: ObjectId (ref: `EmergencyRequest`)
- `offeringHospitalId`: ObjectId (ref: `Hospital`)
- `offeredUnits`: Number
- `offeredBy`: ObjectId (ref: `User`)
- `status`: `'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED'`
- `notes`: String

### 6. `reservations`
- `_id`: ObjectId
- `requestId`: ObjectId (ref: `EmergencyRequest`)
- `offerId`: ObjectId (ref: `Offer`)
- `hospitalId`: ObjectId (ref: `Hospital`)
- `bloodInventoryId`: ObjectId (ref: `BloodInventory`)
- `reservedUnits`: Number
- `status`: `'ACTIVE' | 'CONFIRMED_DISPATCHED' | 'RELEASED' | 'EXPIRED'`
- `expiresAt`: Date

### 7. `transfers`
- `_id`: ObjectId
- `requestId`: ObjectId (ref: `EmergencyRequest`)
- `offerId`: ObjectId (ref: `Offer`)
- `requestingHospitalId`: ObjectId (ref: `Hospital`)
- `supplyingHospitalId`: ObjectId (ref: `Hospital`)
- `units`: Number
- `dispatchStatus`: `'PENDING' | 'DISPATCH_INITIATED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'`
- `handoverStatus`: `'PENDING' | 'VERIFIED' | 'FAILED'`
- `otp`: String (6 digits)
- `otpAttempts`: Number
- `driverContact`: String
- `vehicleNumber`: String
- `dispatchedAt`: Date
- `completedAt`: Date

### 8. `notifications`
- `_id`: ObjectId
- `recipientHospitalId`: ObjectId (ref: `Hospital`)
- `recipientUserId`: ObjectId (ref: `User`)
- `title`: String
- `message`: String
- `type`: `'EMERGENCY_REQUEST' | 'OFFER_RECEIVED' | 'OFFER_ACCEPTED' | 'DISPATCH_UPDATE' | 'TRANSFER_COMPLETED' | 'SYSTEM'`
- `referenceId`: String
- `isRead`: Boolean

### 9. `auditlogs`
- `_id`: ObjectId
- `userId`: ObjectId (ref: `User`)
- `hospitalId`: ObjectId (ref: `Hospital`)
- `action`: String
- `details`: Object
- `ipAddress`: String

### 10. `inventorytransactions`
- `_id`: ObjectId
- `hospitalId`: ObjectId (ref: `Hospital`)
- `bloodInventoryId`: ObjectId (ref: `BloodInventory`)
- `type`: `'ADD_STOCK' | 'DEDUCT_STOCK' | 'RESERVE' | 'RELEASE_RESERVATION' | 'DISPATCH_TRANSFER' | 'EXPIRED'`
- `units`: Number
- `previousUnits`: Number
- `newUnits`: Number
- `reason`: String
- `referenceId`: String
- `performedBy`: ObjectId (ref: `User`)
