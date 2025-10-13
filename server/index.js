const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Loads environment variables
const admin = require('firebase-admin');
const path = require('path');

// --- ✅ NEW: Environment Variable Check ---
// This will crash the server if the .env file is not loaded correctly.
if (!process.env.JWT_SECRET || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.error("❌ FATAL ERROR: Missing required environment variables (JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD).");
    console.error("Please ensure the .env file exists in the /server directory and is configured correctly.");
    process.exit(1); // Exit the application
}
console.log("✅ Environment variables loaded successfully.");


// --- Firebase Initialization ---
try {
    const serviceAccountPath = path.resolve(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Firebase Admin initialized successfully.");
} catch (error) {
    console.error("❌ Firebase Admin Initialization Error:", error);
    process.exit(1);
}


const app = express();
const PORT = process.env.PORT || 5000;


// --- Middleware ---
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());


// --- API Route Imports ---
const adminRoutes = require('./routes/adminRoutes');
const flightRoutes = require('./routes/flightRoutes');
const busRoutes = require('./routes/busRoutes');
const dataRoutes = require('./routes/dataRoutes');
const emailRoutes = require('./routes/emailRoutes');


// --- API ROUTING SETUP ---
app.use('/api/admin', adminRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/buses', busRoutes);
app.use('/api', dataRoutes);
app.use('/api/email', emailRoutes);


// --- Serve Frontend (React Production Build) ---
const clientBuildPath = path.join(__dirname, '../client/build');
app.use(express.static(clientBuildPath));


// --- THE "CATCH-ALL" ROUTE FOR REACT ROUTER ---
app.get('/*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});


// --- Final Error Handling Middleware ---
app.use((err, req, res, next) => {
    console.error("An unhandled error occurred:", err);
    res.status(500).json({ message: 'An unexpected error occurred on the server.' });
});


// --- Server Startup ---
app.listen(PORT, () => {
    console.log(`🚀 Server is running and listening on http://localhost:${PORT}`);
});
