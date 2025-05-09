const express = require("express");
const router = express.Router();
const { generateRemediation } = require("../controllers/remediationController");

router.post("/", generateRemediation); // Use POST for generating remediation output

module.exports = router;
