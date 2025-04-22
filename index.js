const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// Root route to confirm backend is running
app.get("/", (req, res) => {
  res.send("✅ Third Space backend is running");
});

// Triage route
app.post("/api/triage", (req, res) => {
  const { alert } = req.body;
  res.json({
    result: `🔍 Triage Analysis: The alert "${alert}" has been reviewed. Risk level: Medium.`,
  });
});

// Threat Intelligence route
app.post("/api/threat-intel", (req, res) => {
  const { keyword } = req.body;
  res.json({
    result: `🧠 Threat Intel: No critical IOCs found related to "${keyword}".`,
  });
});

// Ticketing route
app.post("/api/ticket", (req, res) => {
  const { incident } = req.body;
  res.json({
    result: `🎫 Ticketing: Incident "${incident}" has been submitted to the SOC queue.`,
  });
});

// Knowledge Base route
app.post("/api/kb", (req, res) => {
  const { question } = req.body;
  res.json({
    result: `📚 Knowledge Base: Here's a helpful article we found related to "${question}".`,
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Third Space backend running on port ${PORT}`);
});

