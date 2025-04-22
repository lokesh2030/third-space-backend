const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Setup OpenAI client with your Render env key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Root
app.get("/", (req, res) => {
  res.send("✅ Third Space backend is running");
});

// 🔍 TRIAGE (with GPT-4)
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

    const reply = completion.choices[0].message.content;
    res.json({ result: reply });
  } catch (err) {
    console.error("Triage AI Error:", err.message);
    res.status(500).json({ result: "AI failed to respond." });
  }
});

// 📚 KNOWLEDGE BASE (with GPT-4)
app.post("/api/kb", async (req, res) => {
  const { question } = req.body;

  const prompt = `
You are a cybersecurity assistant. Answer the following security question clearly and concisely for a SOC analyst:

"${question}"
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const reply = completion.choices[0].message.content;
    res.json({ result: reply });
  } catch (err) {
    console.error("KB AI Error:", err.message);
    res.status(500).json({ result: "AI failed to respond." });
  }
});

// 🧠 THREAT INTEL (GPT-4 powered)
app.post("/api/threat-intel", async (req, res) => {
  const { query } = req.body;

  const prompt = `
You are a cyber threat intelligence analyst. Provide a concise threat intelligence summary for the keyword:

"${query}"

Include any known IOCs, threat actor associations, and tactics, techniques, or procedures (TTPs) if relevant.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const reply = completion.choices[0].message.content;
    res.json({ result: reply });
  } catch (err) {
    console.error("Threat Intel AI Error:", err.message);
    res.status(500).json({ result: "AI failed to respond." });
  }
});

// 🎫 TICKET (email-style)
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
  console.log(`✅ Third Space backend running on port ${PORT}`);
});
