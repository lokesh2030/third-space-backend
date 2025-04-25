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

// 🧠 Build Context Prompt function
function buildContextPrompt({ userInput, currentPage }) {
  let mission = '';

  if (currentPage === 'Triage') {
    mission = `Analyze a security alert. Determine its meaning, severity (Low/Medium/High/Critical), and recommend first SOC action.`;
  } else if (currentPage === 'KnowledgeBase') {
    mission = `Answer cybersecurity-related questions accurately, concisely, and clearly.`;
  } else if (currentPage === 'ThreatIntel') {
    mission = `Summarize threat actors or malware. Extract motivations, techniques, tools, and MITRE ATT&CK mappings. Present in structured format.`;
  } else if (currentPage === 'Ticketing') {
    mission = `Convert incident details into a clear, professional security ticket. Include subject and body.`;
  } else {
    mission = `Assist the user in cybersecurity operations based on their input.`;
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

// ✅ Health Check
app.get("/", (req, res) => {
  res.send("✅ Third Space backend is running");
});

// 🔍 TRIAGE (GPT-4 powered with Context)
app.post("/api/triage", async (req, res) => {
  const { alert } = req.body;
  console.log("🟢 TRIAGE received alert:", alert);

  if (!alert || alert.trim() === "") {
    return res.status(400).json({ result: "Alert is missing." });
  }

  const contextPrompt = buildContextPrompt({ userInput: alert, currentPage: 'Triage' });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: contextPrompt }],
    });

    const reply = completion.choices[0].message.content.trim();
    console.log("✅ TRIAGE AI response complete.");
    res.json({ result: reply });
  } catch (err) {
    console.error("❌ TRIAGE AI error:", err.message);
    res.status(500).json({ result: "AI failed to analyze the alert." });
  }
});

// 📚 KNOWLEDGE BASE (GPT-4 powered with Context)
app.post("/api/kb", async (req, res) => {
  const { question } = req.body;
  console.log("📚 KB received question:", question);

  if (!question || question.trim() === "") {
    return res.status(400).json({ result: "Please enter a valid question." });
  }

  const contextPrompt = buildContextPrompt({ userInput: question, currentPage: 'KnowledgeBase' });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: contextPrompt }],
    });

    const reply = completion.choices[0].message.content.trim();
    console.log("✅ KB AI response complete.");
    res.json({ result: reply });
  } catch (err) {
    console.error("❌ KB AI error:", err.message);
    res.status(500).json({ result: "AI failed to answer the question." });
  }
});

// 🧠 THREAT INTEL (GPT-4 powered with Context)
app.post("/api/threat-intel", async (req, res) => {
  const { keyword } = req.body;
  console.log("🧠 Threat Intel received keyword:", keyword);

  if (!keyword || keyword.trim() === "") {
    return res.status(400).json({ result: "Keyword is missing." });
  }

  const contextPrompt = buildContextPrompt({ userInput: keyword, currentPage: 'ThreatIntel' });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: contextPrompt }],
    });

    const reply = completion.choices[0].message.content.trim();
    console.log("✅ Threat Intel AI response complete.");
    res.json({ result: reply });
  } catch (err) {
    console.error("❌ Threat Intel AI error:", err.message);
    res.status(500).json({ result: "AI failed to fetch threat intel." });
  }
});

// 🎫 TICKET (GPT-3.5-Turbo powered with Context) ✅ UPDATED
app.post("/api/ticket", async (req, res) => {
  const { incident } = req.body;
  console.log("🎫 Ticket request received:", incident);

  if (!incident || incident.trim() === "") {
    return res.status(400).json({ result: "Incident description is missing." });
  }

  const contextPrompt = buildContextPrompt({ userInput: incident, currentPage: 'Ticketing' });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // ✅ moved to 3.5 turbo
      messages: [{ role: "system", content: contextPrompt }],
      temperature: 0.2, // ✅ lower temperature = faster and more deterministic
      max_tokens: 500, // ✅ smaller size = faster response
    });

    const reply = completion.choices[0].message.content.trim();
    console.log("✅ Ticket AI response complete.");
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
