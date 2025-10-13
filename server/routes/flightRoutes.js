const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flightController');
const { verifyAdminToken } = require('../middleware/authMiddleware');

// --- PUBLIC ROUTES ---
// Users can search for flights without being logged in.
router.get('/search', flightController.searchFlights);
// The Deals page can fetch all flights without being logged in.
router.get('/', flightController.getFlights); 

// --- PROTECTED USER ROUTE ---
// A regular user must be logged in to book seats. 
// Note: You would add a user verification middleware here, e.g., verifyUserToken
router.post('/book-seats', flightController.bookFlightSeats);

// --- PROTECTED ADMIN ROUTES ---
// An admin must be logged in for these actions.
router.post('/', verifyAdminToken, flightController.createFlight);
router.put('/:id', verifyAdminToken, flightController.updateFlight);
router.delete('/:id', verifyAdminToken, flightController.deleteFlight); // Assuming you have a delete function

module.exports = router;
