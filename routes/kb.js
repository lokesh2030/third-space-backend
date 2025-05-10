// routes/kb.js
const express = require('express');
const router = express.Router();

// TEMP placeholder logic — replace with real AI logic later
const processQuestion = async (question) => {
  return `This is a placeholder answer for: "${question}"`;
};

router.post('/kb', async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required.' });
  }

  try {
    const result = await processQuestion(question);
    res.json({ result });
  } catch (error) {
    console.error('Error in /api/kb:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;
