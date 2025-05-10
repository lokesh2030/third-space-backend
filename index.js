const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB (optional)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ OpenAI Setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ POST /ticket — Generate Professional Incident Ticket
app.post("/ticket", async (req, res) => {
  const { subject, body } = req.body;

  try {
    const prompt = `
You are a professional SOC analyst assistant. Given a subject and incident description, generate a clean, copy-pasteable incident ticket for use in Jira or ServiceNow.

Follow this format exactly:

Subject: <Subject line>

Incident Summary:
<Professional, concise summary of the incident. 3–5 lines max.>

Recommended Remediation Actions:
1. <Action 1>
2. <Action 2>
3. <Action 3>
4. <Optional Action 4>

Routing: Security Operations Center (SOC)
Priority Level: High
Confidence Level: High

Use clear, technical language suitable for a security analyst. Keep formatting consistent.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: `Subject: ${subject}\n\nDescription: ${body}`,
        },
      ],
      temperature: 0.3,
    });

    const formattedTicket = completion.choices[0].message.content;

    res.json({
      formattedTicket: formattedTicket  // No backticks for clean paste
    });

  } catch (error) {
    console.error("❌ Error generating ticket:", error);
    res.status(500).json({ error: "Failed to generate ticket" });
  }
});

// ✅ Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
