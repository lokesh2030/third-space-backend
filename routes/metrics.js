const express = require("express");
const router = express.Router();
const { default: mongoose } = require("mongoose");

const phishingLogSchema = new mongoose.Schema({
  durationMs: Number,
  timestamp: String,
  source: String,
});

const PhishingLog = mongoose.model("PhishingLog", phishingLogSchema);

// POST /api/metrics/phishing-log
router.post("/phishing-log", async (req, res) => {
  try {
    const { durationMs, timestamp, source } = req.body;

    const entry = new PhishingLog({ durationMs, timestamp, source });
    await entry.save();

    res.status(200).json({ message: "Log saved successfully" });
  } catch (error) {
    console.error("Error saving phishing log:", error);
    res.status(500).json({ message: "Failed to save log" });
  }
});

module.exports = router;
