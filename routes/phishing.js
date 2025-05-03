const express = require("express");
const router = express.Router();
const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/", async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ result: "Missing input text." });
  }

  const prompt = `
You are a cybersecurity assistant trained to detect phishing attempts.

Analyze the following email or message and respond in the following format:
- Is it suspicious? (Yes or No)
- Confidence (0.0 to 1.0)
- Reasoning: Explain briefly why

Content:
"${text}"
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const output = response.choices[0].message.content.trim();
    res.json({ result: output });
  } catch (err) {
    console.error("❌ OpenAI Phishing Detection Error:", err.message);
    res.status(500).json({ result: "Phishing detection failed. Please try again." });
  }
});

module.exports = router;
