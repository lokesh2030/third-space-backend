const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB (optional)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ Ticket Route (Previous Working Version)
app.post("/ticket", async (req, res) => {
  const { subject, body } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `
You are a cybersecurity copilot. Given a subject and a short incident description, return a structured output in this format:

🔍 Result:
Subject: <Concise restatement of the alert subject>
Body: <Clear, concise summary of the incident and why it's a concern>

🔧 Remediation Suggestion:
1. <Step 1>
2. <Step 2>
3. <Optional Step 3>

📍 Route to: <Relevant team (e.g., Security Team, IT Team, Legal)>
`
        },
        {
          role: "user",
          content: `Subject: ${subject}\n\nDescription: ${body}`,
        },
      ],
      temperature: 0.3,
    });

    const result = completion.choices[0].message.content;
    res.json({ result });

  } catch (error) {
    console.error("❌ Error generating ticket:", error);
    res.status(500).json({ error: "Failed to generate ticket" });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
