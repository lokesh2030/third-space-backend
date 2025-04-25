import express from 'express';
import { Configuration, OpenAIApi } from 'openai';

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

// Build dynamic context based on the current page
function buildContext(userInput, currentPage) {
  let mission = '';

  if (currentPage === 'Triage') {
    mission = `You are helping a SOC Analyst triage a security alert.
Prioritize:
- Identify if the alert indicates real threat
- Suggest severity level (Low/Medium/High/Critical)
- Recommend next steps briefly.`;
  } 
  else if (currentPage === 'ThreatIntel') {
    mission = `You are a Threat Intelligence Assistant. Your job is to:
- Identify threat actors, malware, or threat campaigns if mentioned
- Summarize motivations and techniques used
- List known tools or malware
- Reference MITRE ATT&CK techniques if known

Format your response like this:
---
Threat Actor: [Name]
Motivation: [Financial, espionage, etc.]
Primary Techniques: [List techniques]
Known Tools: [List malware/tools]
Relevant MITRE Techniques: [Txxxx]
---
Analyze the following input:
"${userInput}"
Respond clearly and professionally.`;
  } 
  else if (currentPage === 'Ticketing') {
    mission = `You are assisting in drafting a security incident ticket.
Summarize:
- What happened
- Severity
- Action recommended.`;
  } 
  else if (currentPage === 'KnowledgeBase') {
    mission = `You are answering cybersecurity-related questions clearly, accurately, and concisely. Provide reliable, factual answers.`;
  } 
  else {
    mission = `You are a cybersecurity assistant. Help the user based on their input.`;
  }

  return `
Context:
- User Role: SOC Analyst
- Company: Example Corp
- Current Page: ${currentPage}
- Mission: ${mission}
  
User Input:
${userInput}
`;
}

// API Endpoint
router.post('/ask-ai', async (req, res) => {
  const { userInput, currentPage } = req.body;

  if (!userInput || !currentPage) {
    return res.status(400).json({ error: 'Missing userInput or currentPage' });
  }

  try {
    const contextPrompt = buildContext(userInput, currentPage);

    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'system', content: contextPrompt }],
      temperature: 0.3,
      max_tokens: 500,
    });

    const aiResponse = completion.data.choices[0].message.content.trim();
    res.json({ response: aiResponse });

  } catch (error) {
    console.error('OpenAI Error:', error.message);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

export default router;
