const express = require('express');
const router = express.Router();

router.post('/threat', async (req, res) => {
  const { keyword } = req.body;
  res.json({ result: `Mock threat intel for: "${keyword}"` });
});

module.exports = router;
