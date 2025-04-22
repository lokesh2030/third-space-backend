const express = require('express');
const axios = require('axios');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const router = express.Router();

// Set up OpenAI API client
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// CVE Lookup Route
router.get('/api/cve-info', async (req, res) => {
  const { cve_id } = req.query;

  if (!cve_id) {
    return res.status(400).json({ error: 'Missing CVE ID in query string' });
  }

  try {
    // Fetch CVE data from CIRCL
    const cveRes = await axios.get(`https://cve.circl.lu/api/cve/${cve_id}`);
    const data = cveRes.data;

    // If CVE not found or empty
    if (!data || Object.keys(data).length === 0) {
      return res.status(404).json({ error: 'CVE not found in CIRCL database' });
    }

    const description = data.summary || 'No summary available';
    const cvss = data.cvss || 'N/A';
    const references = data.references || [];

    // Prepare prompt for OpenAI
    const prompt = `
CVE ID: ${cve_id}
Description: ${description}
CVSS Score: ${cvss}

Explain this CVE to a security analyst. Include:
- What it is
- How it can be exploited
- What systems are affected
- How to mitigate it
- Severity and risk level
`;

    // Ask OpenAI to summarize it
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    const ai_summary = completion.data.choices[0].message.content;

    return res.json({
      cve_id,
      cvss,
      description,
      references,
      summary: ai_summary,
    });
  } catch (err) {
    console.error('[CVE API ERROR]', err.message);

    if (err.response && err.response.status === 404) {
      return res.status(404).json({ error: 'CVE not found in CIRCL database' });
    }

    return res.status(500).json({
      error: 'Failed to fetch CVE info or generate summary',
      details: err.message,
    });
  }
});

module.exports = router;
