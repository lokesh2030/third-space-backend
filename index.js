const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🔷 /triage
app.post("/triage", async (req, res) => {
  const { alert } = req.body;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a cybersecurity analyst assistant. Analyze the alert and determine if it is suspicious. Respond with:\n\n🔍 Result:\n- Is it suspicious? Yes/No\n- Confidence: (0–1)\n- Reasoning: Brief explanation\n\n🔧 Remediation Suggestion:\n<Action steps>\n\n📍 Route to: <Team>"
        },
        { role: "user", content: alert },
      ],
      temperature: 0.3,
    });

    res.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error("❌ /triage error:", error);
    res.status(500).json({ error: "Triage failed" });
  }
});

// 🔷 /threat-intel
app.post("/threat-intel", async (req, res) => {
  const { input } = req.body;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a threat intelligence analyst. Given a threat group or IOC, return:\n\n🔍 Threat Summary:\n<TTP overview>\n\n🔧 Recommended Response:\n<Actionable steps>\n\n📍 Route to: <Team>"
        },
        { role: "user", content: input },
      ],
      temperature: 0.3,
    });

    res.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error("❌ /threat-intel error:", error);
    res.status(500).json({ error: "Threat intel failed" });
  }
});

// 🔷 /knowledgebase
app.post("/knowledgebase", async (req, res) => {
  const { question } = req.body;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a security knowledge base assistant. Given a question, respond with a brief technical answer."
        },
        { role: "user", content: question },
      ],
      temperature: 0.3,
    });

    res.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error("❌ /knowledgebase error:", error);
    res.status(500).json({ error: "Knowledge base failed" });
  }
});

// 🔷 /ticket
app.post("/ticket", async (req, res) => {
  const { subject, body } = req.body;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a cybersecurity assistant. Given a subject and description, return:\n\n🔍 Result:\nSubject: <...>\nBody: <summary>\n\n🔧 Remediation Suggestion:\n1. ...\n2. ...\n\n📍 Route to: <Team>"
        },
        { role: "user", content: `Subject: ${subject}\n\nDescription: ${body}` },
      ],
      temperature: 0.3,
    });

    res.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error("❌ /ticket error:", error);
    res.status(500).json({ error: "Ticketing failed" });
  }
});

// 🔷 /phishing
app.post("/phishing", async (req, res) => {
  const { email } = req.body;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an AI phishing detector. Analyze the email content and respond with:\n\n🔍 Result:\n- Is it suspicious? Yes/No\n- Confidence: (0–1)\n- Reasoning: <explanation>\n\n🔧 Remediation Suggestion:\n<Action>\n\n📍 Route to: IT Team"
        },
        { role: "user", content: email },
      ],
      temperature: 0.3,
    });

    res.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error("❌ /phishing error:", error);
    res.status(500).json({ error: "Phishing detection failed" });
  }
});

// ✅ Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
