const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  text: { type: String, required: true },
  source: { type: String },
  phishing_detected: { type: Boolean, default: false },
  phishing_details: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now }
});

const Alert = mongoose.model('Alert', AlertSchema);

module.exports = { Alert };
