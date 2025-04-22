app.post("/api/triage", async (req, res) => {
  const { alert } = req.body;
  console.log("🟢 TRIAGE received alert:", alert);

  const prompt = `
You are a senior SOC analyst. Analyze the following alert:

"${alert}"

Provide a short, clear analysis explaining:
1. What the alert likely means
2. How critical it is (Low, Medium, High)
3. What the SOC team should do first
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const reply = completion.choices[0].message.content.trim();
    console.log("✅ TRIAGE AI responded.");
    res.json({ result: reply });
  } catch (err) {
    console.error("❌ TRIAGE AI error:", err.message);
    res.status(500).json({ result: "AI failed to analyze the alert." });
  }
});
