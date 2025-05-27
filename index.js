const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB (optional)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ Load Routes
const phishingRoute = require("./routes/phishing");

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

async function scanIpWithVirusTotal(ip) {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  const vtUrl = `https://www.virustotal.com/api/v3/ip_addresses/${ip}`;

  try {
    const response = await axios.get(vtUrl, {
      headers: { "x-apikey": apiKey },
    });

    const data = response.data.data;
    const maliciousVotes = data.attributes.last_analysis_stats.malicious;

    return {
      ip,
      reputation: maliciousVotes > 5 ? "High Risk" : maliciousVotes > 0 ? "Suspicious" : "Clean",
      maliciousVotes,
    };
  } catch (err) {
    console.error(`❌ VirusTotal IP scan failed for ${ip}:`, err.message);
    return { ip, reputation: "Unknown", maliciousVotes: 0 };
  }
}

// === AI TRIAGE Helper ===
async function runAITriage(alertData) {
  const prompt = `
An alert has been received with the following details:

Description: ${alertData.description}
Source: ${alertData.source}
Severity: ${alertData.severity || 'unknown'}
Timestamp: ${alertData.timestamp || new Date().toISOString()}

Act as a senior security analyst. Analyze and summarize the alert, classify severity, recommend actions, and determine if it requires ticketing.

Respond in JSON with:
{
  "summary": "...",
  "severity": "...",
  "recommended_action": "...",
  "ticket_required": true/false
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3
  });

  const response = completion.choices?.[0]?.message?.content?.trim();
  const triageResult = JSON.parse(response);

  // 🔍 Extract IP addresses from alert description
  const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  const foundIps = alertData.description.match(ipRegex) || [];

  const enrichments = [];
  for (const ip of foundIps) {
    const vtResult = await scanIpWithVirusTotal(ip);
    enrichments.push(vtResult);
  }

  // Combine and return
  return {
    ...triageResult,
    enrichment: enrichments
  };
}

// === Routes ===

// ✅ PHISHING DETECTION
app.use("/api/phishing-detect", phishingRoute);

// ✅ HEALTH CHECK
app.get("/", (req, res) => {
  res.send("✅ Third Space backend is running");
});

// ✅ TRIAGE
app.post("/api/triage", async (req, res) => {
  const { alert } = req.body;
  if (!alert || alert.trim() === "") {
    return res.status(400).json({ result: "Alert is missing." });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: alert }],
      temperature: 0.3,
      max_tokens: 600,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(500).json({ result: "No response from AI." });
    }

    res.json({ result: reply });
  } catch (err) {
    console.error("❌ TRIAGE error:", err.message);
    res.status(500).json({ result: "AI failed to analyze the alert." });
  }
});

// ✅ KNOWLEDGE BASE
app.post("/api/kb", async (req, res) => {
  const { question } = req.body;

  if (!question || question.trim() === "") {
    return res.status(400).json({ result: "Please enter a valid question." });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: question }],
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(500).json({ result: "No response from AI." });
    }

    res.json({ result: reply });
  } catch (err) {
    console.error("❌ KB error:", err.message);
    res.status(500).json({ result: "AI failed to answer your question." });
  }
});

// ✅ THREAT INTEL
app.post("/api/threat-intel", async (req, res) => {
  const { keyword } = req.body;
  if (!keyword || keyword.trim() === "") {
    return res.status(400).json({ result: "Keyword is missing." });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: keyword }],
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(500).json({ result: "No response from AI." });
    }

    res.json({ result: reply });
  } catch (err) {
    console.error("❌ Threat Intel error:", err.message);
    res.status(500).json({ result: "AI failed to fetch threat intel." });
  }
});

// ✅ TICKETING
app.post("/api/ticket", async (req, res) => {
  const { incident } = req.body;

  if (!incident || incident.trim() === "") {
    return res.status(400).json({ result: "Incident description is missing." });
  }

  const prompt = `
You are a cybersecurity SOC assistant. Given the incident description below, generate a clean, enterprise-grade incident report in this format:

Subject: <Concise summary title>

Incident Summary:
<Brief, professional description of the incident, including what was detected, how it was detected, and the potential impact.>

Recommended Remediation Actions:
1. <Action 1>
2. <Action 2>
3. <Optional Action 3>

Routing: Security Operations Center (SOC)
Priority Level: High
Confidence Level: High

Incident:
${incident}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 600,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(500).json({ result: "No response from AI." });
    }

    res.json({ result: reply });
  } catch (err) {
    console.error("❌ Ticket error:", err.message);
    res.status(500).json({ result: "AI failed to generate ticket." });
  }
});

// ✅ ALERT INGESTION + AI TRIAGE
app.post("/api/alerts/ingest", async (req, res) => {
  try {
    const alertData = req.body;

    if (!alertData.alert_id || !alertData.description || !alertData.source) {
      return res.status(400).json({ error: "Missing required alert fields." });
    }

    const triageResult = await runAITriage(alertData);
    res.status(200).json({ success: true, triageResult });
  } catch (err) {
    console.error("❌ Alert ingestion error:", err.message);
    res.status(500).json({ error: "AI triage failed." });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Third Space backend running on port ${PORT}`);
});
