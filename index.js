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

// === VirusTotal Helpers ===
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

// === AI TRIAGE Function ===
async function runAITriage(alertData) {
  const prompt = `An alert has been received with the following details:\nDescription: ${alertData.description}\nSource: ${alertData.source}\nSeverity: ${alertData.severity || 'unknown'}\nTimestamp: ${alertData.timestamp || new Date().toISOString()}\n\nAct as a senior security analyst. Analyze and summarize the alert, classify severity, recommend actions, and determine if it requires ticketing.\nRespond in JSON with:\n{\n  \"summary\": \"...\",\n  \"severity\": \"...\",\n  \"recommended_action\": \"...\",\n  \"ticket_required\": true/false\n}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const response = completion.choices?.[0]?.message?.content?.trim();
  if (!response) throw new Error("GPT-4 returned empty triage response");

  const triageResult = JSON.parse(response);

  const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  const foundIps = alertData.description.match(ipRegex) || [];
  const enrichments = [];

  if (process.env.USE_VT === "false") {
    for (const ip of foundIps) {
      enrichments.push({ ip, reputation: "Unknown", maliciousVotes: 0 });
    }
  } else {
    for (const ip of foundIps) {
      const vtResult = await scanIpWithVirusTotal(ip);
      enrichments.push(vtResult);
    }
  }

  return {
    ...triageResult,
    enrichment: enrichments,
  };
}

// ✅ Routes
app.use("/api/phishing-detect", phishingRoute);

app.get("/", (req, res) => {
  res.send("✅ Third Space backend is running");
});

app.post("/api/alerts/ingest", async (req, res) => {
  try {
    const alertData = req.body;

    if (!alertData.alert_id || !alertData.description || !alertData.source) {
      return res.status(400).json({ error: "Missing required alert fields." });
    }

    const triageResult = await runAITriage(alertData);

    if (!triageResult || !triageResult.summary || typeof triageResult.summary !== "string" || triageResult.summary.trim() === "") {
      throw new Error("AI triage returned empty or malformed summary");
    }

    let ticket = null;

    if (triageResult.ticket_required) {
      const ticketPrompt = `You are a cybersecurity SOC assistant. Based on the triage summary below, create an incident ticket:\nTriage Summary: ${triageResult.summary}\nRecommended Action: ${triageResult.recommended_action}\nSource: ${alertData.source}\nAlert ID: ${alertData.alert_id}\nSeverity: ${triageResult.severity}\nTimestamp: ${alertData.timestamp || new Date().toISOString()}`;

      const ticketCompletion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: ticketPrompt }],
        temperature: 0.3,
        max_tokens: 600,
      });

      ticket = ticketCompletion.choices?.[0]?.message?.content?.trim();
      if (!ticket || ticket === "") {
        throw new Error("AI failed to generate ticket content");
      }
    }

    res.status(200).json({ success: true, triageResult, ticket });
  } catch (err) {
    console.error("❌ Alert ingestion error:", err.message);
    res.status(500).json({ error: "AI triage or ticketing failed." });
  }
});

// Restore previously removed routes for triage, ticket, kb, and threat intel
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
    if (!reply) return res.status(500).json({ result: "No response from AI." });

    res.json({ result: reply });
  } catch (err) {
    console.error("❌ TRIAGE error:", err.message);
    res.status(500).json({ result: "AI failed to analyze the alert." });
  }
});

app.post("/api/kb", async (req, res) => {
  const { question } = req.body;
  if (!question || question.trim() === "") return res.status(400).json({ result: "Please enter a valid question." });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: question }],
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(500).json({ result: "No response from AI." });

    res.json({ result: reply });
  } catch (err) {
    console.error("❌ KB error:", err.message);
    res.status(500).json({ result: "AI failed to answer your question." });
  }
});

app.post("/api/threat-intel", async (req, res) => {
  const { keyword } = req.body;
  if (!keyword || keyword.trim() === "") return res.status(400).json({ result: "Keyword is missing." });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: keyword }],
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(500).json({ result: "No response from AI." });

    res.json({ result: reply });
  } catch (err) {
    console.error("❌ Threat Intel error:", err.message);
    res.status(500).json({ result: "AI failed to fetch threat intel." });
  }
});

app.post("/api/ticket", async (req, res) => {
  const { incident } = req.body;
  if (!incident || incident.trim() === "") return res.status(400).json({ result: "Incident description is missing." });

  const prompt = `You are a cybersecurity SOC assistant. Given the incident description below, generate a clean, enterprise-grade incident report.\nSubject: <Concise summary>\nIncident Summary: ...\nRecommended Remediation Actions:\n1. ...\n2. ...\nRouting: Security Operations Center (SOC)\nPriority Level: High\nConfidence Level: High\n\nIncident:\n${incident}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 600,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(500).json({ result: "No response from AI." });

    res.json({ result: reply });
  } catch (err) {
    console.error("❌ Ticket error:", err.message);
    res.status(500).json({ result: "AI failed to generate ticket." });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Third Space backend running on port ${PORT}`);
});
