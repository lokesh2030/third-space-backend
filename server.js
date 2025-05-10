// server.js
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Only load the working Knowledge Base route
const kbRoute = require('./routes/kb');
app.use('/api', kbRoute);

// ✅ Optional: Health check route
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
