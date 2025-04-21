console.log("🚀 Starting Third Space backend...");

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { OpenAI } = require("openai");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Initialize OpenAI
let openai;
try {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OpenAI API key");
  }
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} catch (err) {
  console.error("❌ Failed to initialize OpenAI:", err.message);
  process.exit(1);
}

// Test route for Render
app.get("/", (req, res) => {
  res.send("✅ Third Space backend is running!");
});

// Alert triage endpoint
app.post("/api/triage", async (req, res) => {
  try {
    const { alert } = req.body;
    const prompt = `You are a SOC analyst. Summarize this alert and suggest next steps:\n\n${alert}`;
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });
    res.json({ result: response.choices[0].message.content });
  } catch (err) {
    console.error("❌ /api/triage error:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Threat intelligence endpoint
app.post("/api/threat-intel", async (req, res) => {
  try {
    const { keyword } = req.body;
    const prompt = `Provide a threat intelligence summary about: ${keyword}`;
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });
    res.json({ result: response.choices[0].message.content });
  } catch (err) {
    console.error("❌ /api/threat-intel error:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Ticket generation endpoint
app.post("/api/ticket", async (req, res) => {
  try {
    const { incident } = req.body;
    const prompt = `Create a helpdesk ticket description based on this incident:\n\n${incident}`;
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });
    res.json({ result: response.choices[0].message.content });
  } catch (err) {
    console.error("❌ /api/ticket error:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Knowledge base Q&A endpoint
app.post("/api/kb", async (req, res) => {
  try {
    const { question } = req.body;
    const prompt = `You are an internal cybersecurity knowledge base assistant. Answer this question:\n\n${question}`;
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });
    res.json({ result: response.choices[0].message.content });
  } catch (err) {
    console.error("❌ /api/kb error:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});

