const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Import all 3 routes
const triageRoute = require('./routes/triage');
const threatRoute = require('./routes/threat');
const kbRoute = require('./routes/kb');

// ✅ Use all routes under /api
app.use('/api', triageRoute);
app.use('/api', threatRoute);
app.use('/api', kbRoute);

// ✅ Optional: test route
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
