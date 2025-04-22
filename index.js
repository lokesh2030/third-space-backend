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

// 📚 KNOWLEDGE BASE (GPT-4 powered)
app.post("/api/kb", async (req, res) => {
  const { question } = req.body;
  console.log("📚 KB received question:", question);

  if (!question || question.trim() === "") {
    return res.status(400).json({ result: "Please enter a valid question." });
  }

  const prompt = `
You are a cybersecurity assistant helping SOC analysts. Provide a concise, clear answer to this question:

"${question}"

If the question is too vague, give a general overview and suggest more specific questions the user can ask.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const reply = completion.choices[0].message.content.trim();
    console.log("✅ KB AI response complete.");
    res.json({ result: reply });
  } catch (err) {
    console.error("❌ KB AI error:", err.message);
    res.status(500).json({ result: "AI failed to answer the question." });
  }
});

// 🧠 THREAT INTEL (Static - by request)
app.post("/api/threat-intel", (req, res) => {
  const { keyword } = req.body;
  console.log("🧠 Threat Intel (static) keyword:", keyword);

  const result = `🧠 Threat Intel: No critical IOCs found related to "${keyword}".`;
  res.json({ result });
});

// 🎫 TICKET (GPT-powered)
app.post("/api/ticket", async (req, res) => {
  const { incident } = req.body;
  console.log("🎫 Ticket request received:", incident);

  if (!incident || incident.trim() === "") {
    return res.status(400).json({ result: "Incident description is missing." });
  }

  const prompt = `
You are a SOC automation assistant. Convert the following incident into a professional ticket email for the SOC queue:

"${incident}"

Make it short, clear, and actionable. Include a subject line and message body.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const reply = completion.choices[0].message.content.trim();
    console.log("✅ Ticket created.");
    res.json({ result: reply });
  } catch (err) {
    console.error("❌ Ticket AI error:", err.message);
    res.status(500).json({ result: "AI failed to create a ticket." });
  }
});

// 🚀 Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Third Space backend running on port ${PORT}`);
});
