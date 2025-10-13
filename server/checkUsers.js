// In server/checkUsers.js

const admin = require('firebase-admin');
require('dotenv').config(); // To load environment variables
const path = require('path');

try {
    // --- IMPORTANT: CONFIGURE THESE TWO VALUES ---
    const serviceAccountPath = path.resolve(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    const databaseURL = `https://"mca-project-47914".firebaseio.com`; // <-- REPLACE WITH YOUR PROJECT ID

    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: databaseURL
    });

    console.log("✅ Firebase Admin SDK initialized successfully for diagnostic test.");

} catch (error) {
    console.error("❌ Initialization Failed. Check your .env path and Project ID.", error);
    process.exit(1);
}

// Function to list all users from Firebase Authentication
const listAllFirebaseUsers = async () => {
    console.log("\nAttempting to fetch all users from Firebase Auth...");
    try {
        const userRecords = await admin.auth().listUsers(1000);
        
        console.log("--- DIAGNOSTIC RESULT ---");
        if (userRecords.users.length > 0) {
            console.log(`✅ Success! Found ${userRecords.users.length} user(s):`);
            userRecords.users.forEach(user => {
                console.log(`   - UID: ${user.uid}, Email: ${user.email}`);
            });
        } else {
            console.log("🟡 Result: Found 0 users. The user list from Firebase is empty.");
        }
        console.log("-------------------------");

    } catch (error) {
        console.error("❌ Error fetching users:", error);
    }
};

// Run the function
listAllFirebaseUsers();
