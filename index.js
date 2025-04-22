const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔁 Health check
app.get("/", (req, res) => {
  res.send("✅ Third Space backend is running");
});

// 🔍 TRIAGE (dummy)
app.post("/api/triage", (req, res) => {
  const { alert } = req.body;
  const result = `🔍 Triage Analysis: The alert "${alert}" has been reviewed. Risk level: Medium. Further investigation recommended.`;
  res.json({ result });
});

// 📚 KNOWLEDGE BASE (dummy)
app.post("/api/kb", (req, res) => {
  const { question } = req.body;
  const result = `🧠 KB Answer: That's a great question about "${question}". We'll add more detailed info in the future.`;
  res.json({ result });
});

// 🧠 THREAT INTEL (static)
app.post("/api/threat-intel", (req, res) => {
  const { keyword } = req.body;
  console.log("Static Threat Intel received:", keyword);
  const result = `🧠 Threat Intel: No critical IOCs found related to "${keyword}".`;
  res.json({ result });
});

// 🎫 TICKET (static)
app.post("/api/ticket", (req, res) => {
  const { incident } = req.body;

  const emailResponse = `
To: soc@thirdspace.ai
Subject: Incident Ticket - New Alert

Body:
A new incident has been reported: "${incident}".

This ticket has been logged and assigned to the SOC queue.
`;

  res.json({ result: emailResponse.trim() });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
