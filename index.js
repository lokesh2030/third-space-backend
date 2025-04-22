const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// Root health check route
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

// Threat Intel route
app.post("/api/threat-intel", (req, res) => {
  const { keyword } = req.body;
  res.json({
    result: `🧠 Threat Intel: No critical IOCs found related to "${keyword}".`,
  });
});

// Ticketing route (email-style output)
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


