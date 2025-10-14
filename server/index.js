const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Loads environment variables from .env file
const admin = require('firebase-admin');
const path = require('path');

// --- Firebase Initialization ---
// Make sure your serviceAccountKey.json is in the root of the 'server' folder
try {
    const serviceAccount = require('./serviceAccountKey.json');
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
// This allows your Vercel frontend to make requests to your Render backend
const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:3000'
};
app.use(cors(corsOptions));
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

// --- NOTE: The section for serving the frontend build has been removed ---
// This server is now a dedicated API, as required by Render.

// --- Final Error Handling Middleware ---
app.use((err, req, res, next) => {
    console.error("An unhandled error occurred:", err);
    res.status(500).json({ message: 'An unexpected error occurred on the server.' });
});

// --- Server Startup ---
app.listen(PORT, () => {
    console.log(`🚀 Server is running and listening on http://localhost:${PORT}`);
});

