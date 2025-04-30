const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post('/detect', async (req, res) => {
  const { text } = req.body;

  if (!text) return res.status(400).json({ error: 'Missing text input.' });

  const prompt = `
Act as a phishing detection AI. Given a piece of email content or a URL, tell me:
- Is it suspicious? (yes/no)
- Confidence (0 to 1)
- Reason why

Content:
${text}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    const output = response.choices[0].message.content;
    res.json({ result: output });
  } catch (err) {
    console.error('OpenAI Error:', err);
    res.status(500).json({ error: 'Phishing detection failed.' });
  }
});

module.exports = router;
