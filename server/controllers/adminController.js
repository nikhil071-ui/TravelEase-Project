const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const db = admin.firestore();

// --- Helper functions ---
const sendResponse = (res, status, data) => res.status(status).json(data);
const sendError = (res, message = "An internal server error occurred.") => res.status(500).json({ message });

// --- Core Admin Functions ---
exports.loginAdmin = (req, res) => {
    const { email, password } = req.body;
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        console.error("❌ FATAL ERROR: JWT_SECRET is not defined.");
        return res.status(500).json({ message: "Server configuration error." });
    }

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ role: 'admin' }, jwtSecret, { expiresIn: '8h' });
        sendResponse(res, 200, { message: 'Login successful', token });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
};

// --- Flight Management ---
exports.createFlight = async (req, res) => {
    try {
        const flightData = req.body;
        const docRef = await db.collection('flights').add(flightData);
        sendResponse(res, 201, { message: 'Flight created successfully', id: docRef.id });
    } catch (error) {
        console.error("Error creating flight:", error);
        sendError(res, "Failed to create flight.");
    }
};

exports.updateFlight = async (req, res) => {
    try {
        const { id } = req.params;
        const flightData = req.body;
        if (!id) return sendResponse(res, 400, { message: "Flight ID is required." });
        delete flightData.id;
        await db.collection('flights').doc(id).update(flightData);
        sendResponse(res, 200, { message: 'Flight updated successfully' });
    } catch (error) {
        console.error("Error updating flight:", error);
        sendError(res, "Failed to update flight.");
    }
};

exports.deleteFlight = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return sendResponse(res, 400, { message: "Flight ID is required." });
        await db.collection('flights').doc(id).delete();
        sendResponse(res, 200, { message: 'Flight deleted successfully' });
    } catch (error) {
        console.error("Error deleting flight:", error);
        sendError(res, "Error deleting flight");
    }
};

// --- Bus Management ---
exports.createBus = async (req, res) => {
    try {
        const busData = req.body;
        const docRef = await db.collection('buses').add(busData);
        sendResponse(res, 201, { message: 'Bus created successfully', id: docRef.id });
    } catch (error) {
        console.error("Error creating bus:", error);
        sendError(res, "Failed to create bus.");
    }
};

exports.updateBus = async (req, res) => {
    try {
        const { id } = req.params;
        const busData = req.body;
        if (!id) return sendResponse(res, 400, { message: "Bus ID is required." });
        delete busData.id;
        await db.collection('buses').doc(id).update(busData);
        sendResponse(res, 200, { message: 'Bus updated successfully' });
    } catch (error) {
        console.error("Error updating bus:", error);
        sendError(res, "Failed to update bus.");
    }
};

exports.deleteBus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return sendResponse(res, 400, { message: "Bus ID is required." });
        await db.collection('buses').doc(id).delete();
        sendResponse(res, 200, { message: 'Bus deleted successfully' });
    } catch (error) {
        console.error("Error deleting bus:", error);
        sendError(res, "Error deleting bus");
    }
};

// --- Coupon Management ---
exports.getCoupons = async (req, res) => {
    try {
        const snapshot = await db.collection('coupons').get();
        const coupons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        sendResponse(res, 200, coupons);
    } catch (error) {
        console.error("Error fetching coupons:", error);
        sendError(res, "Failed to fetch coupons.");
    }
};

exports.createCoupon = async (req, res) => {
    try {
        const { code, discountType, discountValue, isActive, imageUrl } = req.body;
        if (!code || !discountType || !discountValue) {
            return sendResponse(res, 400, { message: "Missing required coupon fields." });
        }
        const newCoupon = { 
            code, 
            discountType, 
            discountValue: Number(discountValue), 
            isActive, 
            imageUrl: imageUrl || '', // Save the image URL string
            createdAt: admin.firestore.FieldValue.serverTimestamp() 
        };
        const docRef = await db.collection('coupons').add(newCoupon);
        sendResponse(res, 201, { message: 'Coupon created successfully', id: docRef.id });
    } catch (error) {
        console.error("Error creating coupon:", error);
        sendError(res, "Failed to create coupon.");
    }
};

exports.updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const couponData = req.body;
        if (!id) return sendResponse(res, 400, { message: "Coupon ID is required." });
        await db.collection('coupons').doc(id).update({ ...couponData, discountValue: Number(couponData.discountValue) });
        sendResponse(res, 200, { message: 'Coupon updated successfully' });
    } catch (error) {
        console.error("Error updating coupon:", error);
        sendError(res, "Failed to update coupon.");
    }
};

exports.deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return sendResponse(res, 400, { message: "Coupon ID is required." });
        await db.collection('coupons').doc(id).delete();
        sendResponse(res, 200, { message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error("Error deleting coupon:", error);
        sendError(res, "Failed to delete coupon.");
    }
};

// --- Banner Management ---
exports.getBanners = async (req, res) => {
    try {
        const snapshot = await db.collection('banners').get();
        const banners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        sendResponse(res, 200, banners);
    } catch (error) {
        console.error("Error fetching banners:", error);
        sendError(res, "Failed to fetch banners.");
    }
};

exports.createBanner = async (req, res) => {
    try {
        const { imageUrl, redirectUrl, isActive } = req.body;
        if (!imageUrl || !redirectUrl) {
            return sendResponse(res, 400, { message: "Missing required banner fields." });
        }
        const newBanner = { 
            imageUrl, 
            redirectUrl, 
            isActive, 
            createdAt: admin.firestore.FieldValue.serverTimestamp() 
        };
        const docRef = await db.collection('banners').add(newBanner);
        sendResponse(res, 201, { message: 'Banner created successfully', id: docRef.id });
    } catch (error) {
        console.error("Error creating banner:", error);
        sendError(res, "Failed to create banner.");
    }
};

exports.updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const bannerData = req.body;
        if (!id) return sendResponse(res, 400, { message: "Banner ID is required." });
        await db.collection('banners').doc(id).update(bannerData);
        sendResponse(res, 200, { message: 'Banner updated successfully' });
    } catch (error) {
        console.error("Error updating banner:", error);
        sendError(res, "Failed to update banner.");
    }
};

exports.deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return sendResponse(res, 400, { message: "Banner ID is required." });
        await db.collection('banners').doc(id).delete();
        sendResponse(res, 200, { message: 'Banner deleted successfully' });
    } catch (error) {
        console.error("Error deleting banner:", error);
        sendError(res, "Failed to delete banner.");
    }
};

// --- Other Management ---
exports.getUsers = async (req, res) => {
    try {
        const listUsersResult = await admin.auth().listUsers();
        const users = listUsersResult.users.map(rec => ({
            id: rec.uid, uid: rec.uid, email: rec.email, creationTime: rec.metadata.creationTime,
        }));
        sendResponse(res, 200, users);
    } catch (error) {
        console.error("Failed to fetch users:", error);
        sendError(res, "Failed to fetch users");
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return sendResponse(res, 400, { message: "User UID is required." });
        await admin.auth().deleteUser(id);
        sendResponse(res, 200, { message: 'User deleted successfully' });
    } catch (error) {
        console.error("Error deleting user:", error);
        sendError(res, "Error deleting user");
    }
};

exports.getBookings = async (req, res) => {
    try {
        const snapshot = await db.collection('bookings').orderBy('bookedAt', 'desc').get();
        const bookings = snapshot.docs.map(doc => {
            const data = doc.data();
            const bookedAt = data.bookedAt?.toDate ? data.bookedAt.toDate().toISOString() : null;
            return { id: doc.id, ...data, bookedAt };
        });
        sendResponse(res, 200, bookings);
    } catch (error) {
        console.error("Failed to fetch bookings:", error);
        sendError(res, "Failed to fetch bookings");
    }
};

exports.deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return sendResponse(res, 400, { message: "Booking ID is required." });
        await db.collection('bookings').doc(id).delete();
        sendResponse(res, 200, { message: 'Booking permanently deleted.' });
    } catch (error) {
        console.error("Failed to delete booking:", error);
        sendError(res, "Failed to delete booking");
    }
};

exports.checkIn = async (req, res) => {
    try {
        const { ticketCode } = req.body;
        if (!ticketCode) return sendResponse(res, 400, { message: "Ticket code is required." });
        const snapshot = await db.collection('bookings').where('ticketCode', '==', ticketCode).limit(1).get();
        if (snapshot.empty) return sendResponse(res, 404, { message: `Ticket code "${ticketCode}" not found.` });
        
        const bookingDoc = snapshot.docs[0];
        const bookingDetails = bookingDoc.data();
        if (bookingDetails.status !== 'active') return sendResponse(res, 400, { message: `Ticket not active. Status: ${bookingDetails.status}` });

        await bookingDoc.ref.update({ status: 'checked-in' });
        sendResponse(res, 200, { message: "Check-in successful!", booking: { id: bookingDoc.id, ...bookingDetails, status: 'checked-in' } });
    } catch (error) {
        console.error("Failed to process check-in:", error);
        sendError(res, "Failed to process check-in.");
    }
};

