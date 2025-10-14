const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Loads environment variables
const admin = require('firebase-admin');
const path = require('path');

// --- Firebase Initialization ---
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

// --- THIS IS THE FIX ---
// This explicitly tells your server to trust your Vercel website.
const allowedOrigins = [
    'http://localhost:3000', // For local testing
    process.env.CLIENT_URL   // Your live Vercel URL
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};

app.use(cors(corsOptions));
// --- END OF FIX ---

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

// --- Server Startup ---
app.listen(PORT, () => {
    console.log(`🚀 Server is running and listening on http://localhost:${PORT}`);
});

module.exports = app;

