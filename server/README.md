# NexusVPN Mock Server

This small Express server simulates a payment + provisioning backend for development and frontend integration.

Endpoints:

- POST /api/purchase  { email, plan } -> { purchaseId, status }
- POST /api/provision { purchaseId } -> { purchaseId, downloadUrl }
- GET  /api/download/:id -> returns WireGuard config as text file
- GET  /api/status/:id -> returns purchase status

Run locally:

```powershell
cd server
npm install
npm start
# Server runs on http://localhost:3000
```

Use only for development and testing. In production replace payment/provisioning with secure implementations (payment gateway, authenticated provisioning, key management, etc.).
