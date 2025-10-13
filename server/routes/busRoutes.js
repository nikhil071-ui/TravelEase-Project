const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');
const { verifyAdminToken } = require('../middleware/authMiddleware');

// --- PUBLIC ROUTES ---
// These routes can be accessed by anyone without logging in.

// Allows the public "Deals" page to fetch all bus routes.
router.get('/', busController.getBuses);

// Allows users to search for available buses.
router.get('/search', busController.searchBuses);


// --- PROTECTED USER ROUTE ---
// This route should require a regular user to be logged in.
// Note: You will need to add a user verification middleware here in the future.
router.post('/book-seats', busController.bookBusSeats);


// --- PROTECTED ADMIN ROUTES ---
// These routes can ONLY be accessed by a logged-in admin.

// Allows an admin to create a new bus route.
router.post('/', verifyAdminToken, busController.createBus);

// Allows an admin to update a bus route by its ID.
router.put('/:id', verifyAdminToken, busController.updateBus);

// Allows an admin to delete a bus route by its ID.
router.delete('/:id', verifyAdminToken, busController.deleteBus); 

module.exports = router;
