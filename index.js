import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { OpenAI } from "openai";

dotenv.config();

console.log("🚀 Starting Third Space backend...");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

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

// Test route
app.get("/", (req, res) => {
  res.send("✅ Third Space backend is running!");
});

// TRIAGE
app.post("/api/triage", async (req, res) => {
  try {
    console.log("📩 /api/triage request body:", req.body);
    const { alert } = req.body;
    if (!alert) throw new Error("Missing 'alert' in request body");

    const prompt = `You are a SOC analyst. Summarize this alert and suggest next steps:\n\n${alert}`;
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({ result: response.choices[0].message.content });
  } catch (err) {
    console.error("❌ /api/triage error:", err);
    res.status(500).json({ error: err.message || "Something went wrong." });
  }
});
