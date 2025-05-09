const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.generateRemediation = async (req, res) => {
  const { alertText } = req.body;

  if (!alertText || alertText.trim() === "") {
    return res.status(400).json({ result: "Missing alert text." });
  }

  const prompt = `
You are a security operations co-pilot. Based on the following alert, generate a concise and professional remediation plan.

Alert:
"${alertText}"

Respond in this structured format:
🔧 Remediation Plan:
1. Containment (e.g., quarantine message, block sender)
2. Technical action (e.g., investigate headers, reset credentials, update filters)
3. Awareness step (e.g., notify users, educate on phishing/social engineering)

📍 Route to: <IT Team | Security Team | Network Team>
🧭 SLA: <time window>

Tailor your response to spoofing, impersonation, phishing links, or malware as appropriate. Be concise and use bulletproof security judgment.
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
