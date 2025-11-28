const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Simple in-memory store (development only)
const purchases = {}; // purchaseId -> { email, plan, status, config }

function makeId(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

function generateWGConfig(email, id){
  // Mock WireGuard config - in real system generate keys and IPs
  const ipSuffix = Math.floor(Math.random()*250)+2;
  const clientIP = `10.8.0.${ipSuffix}/32`;
  const config = `[Interface]\nPrivateKey = <client-private-key-${id}>\nAddress = ${clientIP}\nDNS = 1.1.1.1\n\n[Peer]\nPublicKey = <server-public-key>\nEndpoint = vpn.example.com:51820\nAllowedIPs = 0.0.0.0/0\n`;
  return config;
}

// Purchase endpoint - accepts { email, plan }
app.post('/api/purchase', (req, res) => {
  const { email, plan } = req.body || {};
  if(!email || !plan){
    return res.status(400).json({ error: 'Missing email or plan' });
  }
  const id = makeId();
  // In a real app you'd call a payment gateway here. We'll simulate success.
  const status = 'paid';
  purchases[id] = { email, plan, status };
  return res.json({ purchaseId: id, status, email, plan });
});

// Provision endpoint - accepts { purchaseId }
app.post('/api/provision', (req, res) => {
  const { purchaseId } = req.body || {};
  if(!purchaseId || !purchases[purchaseId]){
    return res.status(404).json({ error: 'Purchase not found' });
  }
  // Generate a mock WireGuard config and save it
  const cfg = generateWGConfig(purchases[purchaseId].email, purchaseId);
  purchases[purchaseId].config = cfg;
  // Return a download endpoint
  const downloadUrl = `/api/download/${purchaseId}`;
  return res.json({ purchaseId, downloadUrl, message: 'Provisioned' });
});

// Download config
app.get('/api/download/:id', (req, res) => {
  const { id } = req.params;
  const p = purchases[id];
  if(!p || !p.config){
    return res.status(404).send('Not found');
  }
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="nexusvpn-${id}.conf"`);
  res.send(p.config);
});

// Simple status endpoint
app.get('/api/status/:id', (req, res) => {
  const { id } = req.params;
  const p = purchases[id];
  if(!p) return res.status(404).json({ error: 'Not found' });
  return res.json({ purchaseId: id, status: p.status });
});

app.listen(PORT, () => console.log(`Mock server listening on http://localhost:${PORT}`));
