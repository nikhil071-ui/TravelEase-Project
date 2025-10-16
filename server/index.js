const express = require('express');
const cors = require('cors');
require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');

console.log("SERVER STARTING: Raw CLIENT_URL from env:", process.env.CLIENT_URL);

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

// --- FINAL, ROBUST CORS FIX ---
// This handles potential typos or extra slashes in the environment variables.
const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, '') : 'http://localhost:3000';
console.log("SERVER CONFIG: Allowing connections from origin:", clientUrl);

const allowedOrigins = [
    'http://localhost:3000',
    clientUrl 
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.error(`CORS Error: Request from origin '${origin}' was blocked.`);
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

// --- Final Error Handling Middleware ---
app.use((err, req, res, next) => {
    console.error("An unhandled error occurred:", err);
    res.status(500).json({ message: 'An unexpected error occurred on the server.' });
});

// --- Server Startup ---
app.listen(PORT, () => {
    console.log(`🚀 Server is running and listening on http://localhost:${PORT}`);
});

module.exports = app;