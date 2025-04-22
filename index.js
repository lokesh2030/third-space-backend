const express = require('express');
const cors = require('cors');
const cveRoutes = require('./routes/cve'); // ✅ add CVE route

require('dotenv').config(); // ✅ load env vars from .env

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(cveRoutes); // ✅ enable the CVE route

app.get('/', (req, res) => {
  res.send('Third Space backend is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
