const express = require('express');
const axios = require('axios');
const router = express.Router();

// Database model (adjust path if needed)
const { Alert } = require('../models/Alert');

// Utility: Extract URLs from alert text
function extractUrls(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

// Utility: Scan URL using VirusTotal
async function scanUrlWithVirusTotal(url) {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  const encodedUrl = Buffer.from(url).toString('base64url');
  const vtUrl = `https://www.virustotal.com/api/v3/urls/${encodedUrl}`;

  const response = await axios.get(vtUrl, {
    headers: { 'x-apikey': apiKey }
  });

  const data = response.data.data;
  const maliciousVotes = data.attributes.last_analysis_stats.malicious;

  return {
    isPhishing: maliciousVotes > 0,
    threatLevel: maliciousVotes > 5 ? 'High' : 'Medium'
  };
}

// POST /api/alerts
router.post('/', async (req, res) => {
  try {
    const { text, source } = req.body;

    const urls = extractUrls(text);
    const phishingResults = [];

    for (const url of urls) {
      const result = await scanUrlWithVirusTotal(url);
      if (result.isPhishing) {
        phishingResults.push({
          url: url,
          score: result.threatLevel,
          source: 'VirusTotal'
        });
      }
    }

    const newAlert = new Alert({
      text,
      source,
      phishing_detected: phishingResults.length > 0,
      phishing_details: phishingResults
    });

    await newAlert.save();
    res.status(201).json(newAlert);

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
