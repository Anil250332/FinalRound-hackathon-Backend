# PulseRelay Backend API
Emergency Inter-Hospital Blood Coordination Network

A production-ready Node.js, Express, and MongoDB Atlas backend with Socket.IO real-time coordination, strictly adhering to the **Routes ➔ Controller ➔ Service ➔ Repository ➔ Database** architecture.

---

## 🏗️ Architecture Flow

```
HTTP Request / Socket Event
         ↓
       Routes (Endpoints & Role Middleware)
         ↓
     Controller (HTTP Req/Res, Parameter Validation)
         ↓
      Service (Business Rules, Allocation Logic, Notifications)
         ↓
     Repository (Direct Mongoose Model Database Queries)
         ↓
  MongoDB Atlas (10 Collections)
```

---

## 📦 Tech Stack
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js (ES Modules)
- **Database:** MongoDB Atlas / Local MongoDB via Mongoose
- **Real-Time:** Socket.IO
- **Security:** bcryptjs, jsonwebtoken, CORS
- **Hosting:** Render Free Tier ready (binds `0.0.0.0`, port dynamic via `process.env.PORT`)

---

## 🚀 Quick Setup & Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```env
PORT=10000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/pulserelay
JWT_SECRET=pulserelay_super_secret_jwt_key_hackathon_2026_xyz123
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### 3. Seed Database (4 Fictional Indore Hospitals & Accounts)
```bash
npm run seed
```
*(Note: If the database is empty, the server auto-seeds on first boot!)*

### 4. Start Server
```bash
# Development mode with auto-reload:
npm run dev

# Production mode:
npm start
```

---

## 🩺 Health Check
```http
GET http://localhost:10000/health
```
Response:
```json
{
  "success": true,
  "status": "healthy",
  "service": "PulseRelay API"
}
```

---

## 🔑 Pre-Seeded Demo Login Credentials

| Role | Hospital | Email | Password |
|---|---|---|---|
| **Super Admin** | Platform Owner | `superadmin@pulserelay.org` | `Password@123` |
| **Hospital Admin** | City Care Hospital (Indore) | `admin@citycare.org` | `Password@123` |
| **Emergency Coordinator** | City Care Hospital (Indore) | `coordinator@citycare.org` | `Password@123` |
| **Blood Bank Officer** | Apollo Demo Blood Centre | `bbo@apollo.org` | `Password@123` |
| **Blood Bank Officer** | Central Medical Centre | `bbo@centralmedical.org` | `Password@123` |
| **Blood Bank Officer** | LifeLine Hospital | `bbo@lifeline.org` | `Password@123` |

---

## 📚 Complete API Documentation
See [API.md](../docs/API.md) and [DATABASE.md](../docs/DATABASE.md) for full schema and endpoint documentation.
