const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

// Optional: MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// === Helper Functions ===
const extractUrls = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

async function scanUrlWithVirusTotal(url) {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  const encodedUrl = Buffer.from(url).toString("base64url");
  const vtUrl = `https://www.virustotal.com/api/v3/urls/${encodedUrl}`;

  const response = await axios.get(vtUrl, {
    headers: { "x-apikey": apiKey },
  });

  const data = response.data.data;
  const maliciousVotes = data.attributes.last_analysis_stats.malicious;

  return {
    isPhishing: maliciousVotes > 0,
    threatLevel: maliciousVotes > 5 ? "High" : "Medium",
  };
}

function buildContextPrompt({ userInput, currentPage }) {
  let mission = "";

  if (currentPage === "Triage") {
    mission = "Analyze a security alert. Determine its meaning, severity (Low/Medium/High/Critical), and recommend first SOC action.";
  } else if (currentPage === "KnowledgeBase") {
    mission = "Answer cybersecurity-related questions accurately, concisely, and clearly.";
  } else if (currentPage === "ThreatIntel") {
    mission = "Summarize threat actors or malware. Extract motivations, techniques, tools, and MITRE ATT&CK mappings.";
  } else if (currentPage === "Ticketing") {
    mission = "Convert incident details into a clear, professional security ticket. Include subject and body.";
  } else {
    mission = "Assist the user in cybersecurity operations based on their input.";
  }

  return `
Context:
- User Role: SOC Analyst
- Company: Third Space
- Current Page: ${currentPage}
- Mission: ${mission}

User Input:
"${userInput}"
`;
}

// === Routes ===
app.get("/", (req, res) => {
  res.send("✅ Third Space backend is running");
});

// TRIAGE
app.post("/api/triage", async (req, res) => {
  const { alert } = req.body;
  if (!alert || alert.trim() === "") {
    return res.status(400).json({ result: "Alert is missing." });
  }

  const contextPrompt = buildContextPrompt({ userInput: alert, currentPage: "Triage" });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: contextPrompt }],
      temperature: 0.3,
      max_tokens: 600,
    });

    const reply = completion.choices[0].message.content.trim();
    res.json({ result: reply });
  } catch (err) {
    console.error("❌ TRIAGE AI error:", err.message);
    res.status(500).json({ result: "AI failed to analyze the alert." });
  }
});

// KNOWLEDGE BASE (with debug logging)
app.post("/api/kb", async (req, res) => {
  const { question } = req.body;
  console.log("📚 KB received question:", question);

  if (!question || question.trim() === "") {
    return res.status(400).json({ result: "Please enter a valid question." });
  }

  const contextPrompt = buildContextPrompt({ userInput: question, currentPage: "KnowledgeBase" });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: contextPrompt }],
    });

    console.log("🔁 GPT KB Raw Response:", JSON.stringify(completion, null, 2));

    const reply = completion.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("No content in GPT response");

    res.json({ result: reply });
  } catch (err) {
    console.error("❌ KB AI error:", err.response?.data || err.message);
    res.status(500).json({
      result:
        "AI error: " +
        (err.response?.data?.error?.message || err.message || "Unknown error occurred."),
    });
  }
});

// THREAT INTEL
app.post("/api/threat-intel", async (req, res) => {
  const { keyword } = req.body;
  if (!keyword || keyword.trim() === "") {
    return res.status(400).json({ result: "Keyword is missing." });
  }

  const contextPrompt = buildContextPrompt({ userInput: keyword, currentPage: "ThreatIntel" });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: contextPrompt }],
    });

    const reply = completion.choices[0].message.content.trim();
    res.json({ result: reply });
  } catch (err) {
    console.error("❌ Threat Intel AI error:", err.message);
    res.status(500).json({ result: "AI failed to fetch threat intel." });
  }
});

// TICKETING
app.post("/api/ticket", async (req, res) => {
  const { incident } = req.body;
  if (!incident || incident.trim() === "") {
    return res.status(400).json({ result: "Incident description is missing." });
  }

  const contextPrompt = buildContextPrompt({ userInput: incident, currentPage: "Ticketing" });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: contextPrompt }],
      temperature: 0.2,
      max_tokens: 500,
    });

    const reply = completion.choices[0].message.content.trim();
    res.json({ result: reply });
  } catch (err) {
    console.error("❌ Ticket AI error:", err.message);
    res.status(500).json({ result: "AI failed to create a ticket." });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Third Space backend running on port ${PORT}`);
});
