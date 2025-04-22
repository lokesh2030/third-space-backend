const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 Setup OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Health Check
app.get("/", (req, res) => {
  res.send("✅ Third Space backend is running");
});

// 🔍 TRIAGE (GPT-4 powered)
app.post("/api/triage", async (req, res) => {
  const { alert } = req.body;
  console.log("🟢 TRIAGE received alert:", alert);

  if (!alert || alert.trim() === "") {
    return res.status(400).json({ result: "Alert is missing." });
  }

  const prompt = `
You are a senior SOC analyst. Analyze the following alert:

"${alert}"

Provide a short, clear analysis explaining:
1. What the alert likely means
2. How critical it is (Low, Medium, High)
3. What the SOC team should do first
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const reply = completion.choices[0].message.content.trim();
    console.log("✅ TRIAGE AI response complete.");
    res.json({ result: reply });
  } catch (err) {
    console.error("❌ TRIAGE AI error:", err.message);
    res.status(500).json({ result: "AI failed to analyze the alert." });
  }
});

// 🧠 THREAT INTEL (Static)
app.post("/api/threat-intel", (req, res) => {
  const { keyword } = req.body;
  console.log("🧠 Threat Intel (static) keyword:", keyword);

  const result = `🧠 Threat Intel: No critical IOCs found related to "${keyword}".`;
  res.json({ result });
});

// 📚 KNOWLEDGE BASE (Static)
app.post("/api/kb", (req, res) => {
  const { question } = req.body;
  console.log("📚 KB Question:", question);

  const result = `🧠 KB Answer: That's a great question about "${question}". More details coming soon.`;
  res.json({ result });
});

// 🎫 TICKET (Static)
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

// 🚀 Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Third Space backend running on port ${PORT}`);
});
