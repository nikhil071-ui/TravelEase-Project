const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

// This route will now correctly be exposed at GET /api/unique-locations
router.get('/unique-locations', dataController.getUniqueLocations);

module.exports = router;
