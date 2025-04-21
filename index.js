const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { OpenAI } = require("openai");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/triage", async (req, res) => {
  const { alert } = req.body;
  const prompt = `You are a SOC analyst. Summarize this alert and suggest next steps:\n\n${alert}`;
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
  });
  res.json({ result: response.choices[0].message.content });
});

app.post("/api/threat-intel", async (req, res) => {
  const { keyword } = req.body;
  const prompt = `Give a concise threat intelligence summary about: ${keyword}`;
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
  });
  res.json({ result: response.choices[0].message.content });
});

app.post("/api/ticket", async (req, res) => {
  const { incident } = req.body;
  const prompt = `Generate a service ticket for this incident:\n\n${incident}`;
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
  });
  res.json({ result: response.choices[0].message.content });
});

app.post("/api/kb", async (req, res) => {
  const { question } = req.body;
  const prompt = `You are an internal knowledge base assistant. Answer this:\n\n${question}`;
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
  });
  res.json({ result: response.choices[0].message.content });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
