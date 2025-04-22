const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json()); // THIS is critical to parse incoming JSON

// ✅ OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Health check
app.get("/", (req, res) => {
  res.send("✅ Third Space backend is live.");
});

// ✅ TEST endpoint — to confirm body parsing
app.post("/api/test-body", (req, res) => {
  console.log("🧪 TEST BODY RECEIVED:", req.body);
  res.json({ received: req.body });
});

// ✅ Triage
app.post("/api/triage", async (req, res) => {
  const { alert } = req.body;

  const prompt = `
You are a SOC analyst. Analyze the following alert:

"${alert}"

Respond with a brief analysis of what this alert might indicate, how critical it may be, and what the first investigative step should be.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({ response: completion.choices[0].message.content });
  } catch (err) {
    console.error("Triage error:", err);
    res.status(500).json({ response: "AI failed to respond." });
  }
});

// ✅ Knowledge Base
app.post("/api/kb", async (req, res) => {
  const { question } = req.body;

  const prompt = `
You are a cybersecurity assistant. Answer this question clearly and concisely for a SOC analyst:

"${question}"
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({ response: completion.choices[0].message.content });
  } catch (err) {
    console.error("KB error:", err);
    res.status(500).json({ response: "AI failed to respond." });
  }
});

// ✅ Threat Intel
app.post("/api/threat-intel", async (req, res) => {
  console.log("📥 Raw body received:", req.body); // ⬅️ Log what was received
  const { query } = req.body;
  console.log("🛠️ Extracted query:", query);

  const prompt = `
You are a cyber threat intelligence analyst. Provide a concise threat intelligence summary for:

"${query}"

Include known IOCs, threat actor associations, and TTPs if applicable.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({ response: completion.choices[0].message.content });
  } catch (err) {
    console.error("Threat Intel error:", err);
    res.status(500).json({ response: "AI failed to respond." });
  }
});

// ✅ Ticket
app.post("/api/ticket", (req, res) => {
  const { incident } = req.body;

  const email = `
To: soc@thirdspace.ai
Subject: Incident Ticket - New Alert

Body:
A new incident has been reported: "${incident}"

This ticket has been logged and assigned to the SOC queue.
  `.trim();

  res.json({ response: email });
});

// ✅ Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
