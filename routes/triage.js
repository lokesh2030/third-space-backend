const express = require('express');
const router = express.Router();

router.post('/triage', async (req, res) => {
  const { alert } = req.body;
  res.json({ result: `Mock triage result for: "${alert}"` });
});

module.exports = router;
