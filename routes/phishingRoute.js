// /routes/phishingRoute.js

const express = require('express');
const router = express.Router();

// Utility: Extract URLs from text
function extractUrls(text) {
  const urlRegex = /https?:\/\/[^\s]+/g;
  return text.match(urlRegex) || [];
}

// Utility: Check if a URL is suspicious (simple version)
function isSuspicious(url) {
  const suspiciousKeywords = ['login', 'verify', 'update', 'secure', 'account', 'bank', 'free', 'bonus'];
  const uncommonTLDs = ['.xyz', '.top', '.tk', '.ml', '.ga', '.cf'];

  for (const keyword of suspiciousKeywords) {
    if (url.toLowerCase().includes(keyword)) {
      return true;
    }
  }

  for (const tld of uncommonTLDs) {
    if (url.toLowerCase().endsWith(tld)) {
      return true;
    }
  }

  return false;
}

// POST /api/phishing
router.post('/phishing', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Missing text input' });
    }

    const urls = extractUrls(text);
    const suspiciousUrls = urls.filter(url => isSuspicious(url));

    const result = {
      suspicious: suspiciousUrls.length > 0,
      urls: urls,
      suspiciousUrls: suspiciousUrls,
      reason: suspiciousUrls.length > 0 ? 'Suspicious keywords or TLD detected' : 'No suspicious URLs detected'
    };

    res.json(result);
  } catch (error) {
    console.error('Error in phishing detection:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
