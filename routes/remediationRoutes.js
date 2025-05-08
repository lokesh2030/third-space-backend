const express = require('express');
const router = express.Router();
const { getRemediations } = require('../controllers/remediationController');

router.get('/', getRemediations);

module.exports = router;
