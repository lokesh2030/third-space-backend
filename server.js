// server.js
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Route imports
const triageRoute = require('./routes/triage');
const threatIntelRoute = require('./routes/threat');
const kbRoute = require('./routes/kb');

// Mount routes at /api
app.use('/api', triageRoute);
app.use('/api', threatIntelRoute);
app.use('/api', kbRoute);

// Health check endpoint (optional)
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Server is alive' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
