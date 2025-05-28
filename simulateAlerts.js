const axios = require("axios");

const BACKEND_URL = "https://third-space-backend.onrender.com";

const alertTemplates = [
  "SentinelOne detected suspicious PowerShell execution from 45.153.160.140 targeting finance endpoints.",
  "CrowdStrike blocked repeated login attempts from 185.107.56.223 on admin panel.",
  "Microsoft Defender identified a malware-infected attachment in an email sent to accounting@company.com.",
  "Proofpoint flagged phishing attempt using spoofed domain login.microsoft-secure.com.",
  "AWS GuardDuty reported port scanning from 92.118.161.52 on EC2 instance hosting payroll app."
];

function getRandomAlert() {
  const index = Math.floor(Math.random() * alertTemplates.length);
  return {
    alert_id: `ALERT-${Date.now()}`,
    description: alertTemplates[index],
    source: "Simulator",
    severity: "Medium"
  };
}

async function sendRandomAlert() {
  const alert = getRandomAlert();
  try {
    const res = await axios.post(`${BACKEND_URL}/api/alerts/ingest`, alert);
    console.log(`✅ Sent alert: ${alert.description}`);
    console.log(`📋 Triage Result: ${res.data.triageResult?.summary}`);
    console.log("—".repeat(60));
  } catch (err) {
    console.error("❌ Failed to send alert:", err.message);
  }
}

setInterval(sendRandomAlert, 30000); // Every 30 seconds
console.log("🚀 Alert simulator started...");
