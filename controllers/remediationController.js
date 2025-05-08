const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.generateRemediation = async (req, res) => {
  const { alertText } = req.body;

  if (!alertText || alertText.trim() === "") {
    return res.status(400).json({ result: "Missing alert text." });
  }

  const prompt = `
You are a security operations co-pilot. Based on the following alert, generate a concise remediation plan.

Alert:
"${alertText}"

Respond in the following structured format:
🔧 Remediation Plan:
1. <Primary remediation action>
2. <Containment step>
3. <Additional verification or investigation>

📍 Route to: <IT Team | Security Team | Network Team>
🧭 SLA: <e.g. 15 minutes, 1 hour, etc.>

Keep it actionable and professional.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.2,
      max_tokens: 500,
    });

    const response = completion.choices[0].message.content.trim();
    res.json({ result: response });
  } catch (err) {
    console.error("❌ GPT error in remediation:", err.message);
    res.status(500).json({ result: "AI failed to generate remediation plan." });
  }
};
