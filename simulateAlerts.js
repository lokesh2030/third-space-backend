const axios = require("axios");

const BACKEND_URL = "https://third-space-backend.onrender.com/api/alerts/ingest";

const sampleAlerts = [
  {
    description: "Multiple failed SSH login attempts detected from IP 94.130.10.120 targeting production server.",
    source: "Syslog",
    severity: "High"
  },
  {
    description: "Unusual PowerShell execution detected on endpoint in HR department from IP 45.153.160.140.",
    source: "SentinelOne",
    severity: "High"
  },
  {
    description: "Malware signature match in downloaded file from IP 185.107.56.223.",
    source: "CrowdStrike",
    severity: "Medium"
  },
  {
    description: "Spike in outbound traffic from user workstation to IP 67.205.146.98.",
    source: "Firewall",
    severity: "Low"
  }
];

function sendRandomAlert() {
  const alert = sampleAlerts[Math.floor(Math.random() * sampleAlerts.length)];

  axios.post(BACKEND_URL, {
    alert_id: `ALERT-${Date.now()}`,
    ...alert
  }).then(res => {
    console.log(`✅ Sent alert: ${alert.description}`);
    console.log("📨 Response summary:", res.data.triageResult?.summary);
    console.log("🎫 Ticket:", res.data.ticket?.slice(0, 100) + "...\n");
  }).catch(err => {
    console.error("❌ Error sending alert:", err.message);
  });
}

// Send a new alert every 30 seconds
setInterval(sendRandomAlert, 30000);

console.log("🚀 Alert simulator started...");
