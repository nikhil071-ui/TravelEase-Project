const express = require('express');
const router = express.Router();

// --- CORRECT: Import ALL necessary controllers ---
const adminController = require('../controllers/adminController');
const dataController = require('../controllers/dataController');
const flightController = require('../controllers/flightController'); 
const busController = require('../controllers/busController');       

const { verifyAdminToken } = require('../middleware/authMiddleware');

// --- Single, Efficient Endpoint for All Dashboard Data ---
router.get('/all-data', verifyAdminToken, dataController.getAllData);

// --- Authentication ---
router.post('/login', adminController.loginAdmin);

// --- Flight Management Routes (Now points to flightController) ---
router.post('/flights', verifyAdminToken, flightController.createFlight);
router.put('/flights/:id', verifyAdminToken, flightController.updateFlight);
router.delete('/flights/:id', verifyAdminToken, flightController.deleteFlight);


// --- Bus Management Routes (Now points to busController) ---
router.post('/buses', verifyAdminToken, busController.createBus);
router.put('/buses/:id', verifyAdminToken, busController.updateBus);
router.delete('/buses/:id', verifyAdminToken, busController.deleteBus);

// --- Detailed Data Fetching (Handled by adminController) ---
router.get('/bookings', verifyAdminToken, adminController.getBookings);
router.get('/users', verifyAdminToken, adminController.getUsers);
router.get('/coupons', verifyAdminToken, adminController.getCoupons);
router.get('/banners', verifyAdminToken, adminController.getBanners);

// --- Ticket Check-in ---
router.post('/checkin', verifyAdminToken, adminController.checkIn);

// --- Coupon Management ---
router.post('/coupons', verifyAdminToken, adminController.createCoupon);
router.put('/coupons/:id', verifyAdminToken, adminController.updateCoupon);
router.delete('/coupons/:id', verifyAdminToken, adminController.deleteCoupon);

// --- Banner Management ---
router.post('/banners', verifyAdminToken, adminController.createBanner);
router.put('/banners/:id', verifyAdminToken, adminController.updateBanner);
router.delete('/banners/:id', verifyAdminToken, adminController.deleteBanner);

// --- Other Deletion Routes ---
router.delete('/users/:id', verifyAdminToken, adminController.deleteUser);
router.delete('/bookings/:id', verifyAdminToken, adminController.deleteBooking);

module.exports = router;
