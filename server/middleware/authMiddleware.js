const jwt = require('jsonwebtoken');

exports.verifyAdminToken = (req, res, next) => {
    // --- ✅ NEW: Detailed Logging ---
    console.log("\n--- DEBUG: Inside verifyAdminToken Middleware ---");
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
        console.log("❌ Middleware Error: JWT_SECRET is not loaded!");
        // This should not happen if the server started correctly, but it's a safe check.
        return res.status(500).json({ message: "Server configuration error: JWT secret is missing." });
    }

    const authHeader = req.headers['authorization'];
    console.log("1. Received Authorization Header:", authHeader);

    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) {
        console.log("❌ Middleware Result: No token provided. Denying access.");
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    console.log("2. Extracted Token:", token);

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            console.log("❌ Middleware Result: Token verification failed.", err.message);
            return res.status(403).json({ message: `Forbidden: ${err.message}` });
        }
        
        console.log("3. Token successfully verified. Decoded Payload:", user);

        if (user.role !== 'admin') {
            console.log(`❌ Middleware Result: Role check failed. Expected 'admin', but got '${user.role}'. Denying access.`);
            return res.status(403).json({ message: "Forbidden: User is not an admin" });
        }

        console.log("✅ Middleware Result: Success! User is an admin. Allowing access.");
        console.log("------------------------------------------\n");
        req.user = user;
        next();
    });
};
