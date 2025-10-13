const admin = require('firebase-admin');
const db = admin.firestore();

// Helper function to fetch a collection and format the documents
const fetchCollection = async (collectionName) => {
    try {
        const snapshot = await db.collection(collectionName).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error(`Error fetching collection ${collectionName}:`, error);
        return []; // Return empty array on error to avoid breaking Promise.all
    }
};

// --- CORRECTED AND MORE ROBUST FUNCTION ---
exports.getAllData = async (req, res) => {
    try {
        // Use Promise.allSettled to ensure all promises complete, even if some fail.
        // This prevents the entire endpoint from failing if one collection is inaccessible.
        const results = await Promise.allSettled([
            fetchCollection('flights'),
            fetchCollection('buses'),
            admin.auth().listUsers(1000),
            fetchCollection('bookings'),
            fetchCollection('coupons'),
            fetchCollection('banners'),
        ]);

        // Helper function to safely extract the value from a settled promise
        // or return a default value (like an empty array) if it was rejected.
        const getFulfilledValue = (result, defaultValue = []) => {
            return result.status === 'fulfilled' ? result.value : defaultValue;
        };
        
        const flights = getFulfilledValue(results[0]);
        const buses = getFulfilledValue(results[1]);
        const bookings = getFulfilledValue(results[3]);
        const coupons = getFulfilledValue(results[4]);
        const banners = getFulfilledValue(results[5]);

        // Safely process the users list from the auth result
        const usersResult = getFulfilledValue(results[2], { users: [] }); // Default to object with empty users array
        const users = (usersResult.users || []).map(rec => ({
            id: rec.uid,
            uid: rec.uid,
            email: rec.email,
            creationTime: rec.metadata.creationTime,
        }));

        // ✅ This guarantees a valid JSON object is always returned.
        return res.status(200).json({
            flights,
            buses,
            users,
            bookings,
            coupons,
            banners,
        });

    } catch (error) {
        console.error("A critical error occurred in the getAllData controller:", error);
        // This catch block is for truly unexpected errors.
        return res.status(500).json({ message: "Failed to fetch all admin data due to a server error." });
    }
};


// This function is for public search and can remain as is.
exports.getUniqueLocations = async (req, res) => {
    try {
        const [flightsSnapshot, busesSnapshot] = await Promise.all([
            db.collection('flights').get(),
            db.collection('buses').get()
        ]);

        const locationMap = new Map();

        const addLocation = (doc, key) => {
            const data = doc.data();
            if (data[key]) {
                const name = data[key].toLowerCase();
                if (!locationMap.has(name)) {
                    const country = data.country || 'India'; 
                    locationMap.set(name, { name: data[key], country: country });
                }
            }
        };

        flightsSnapshot.forEach(doc => {
            addLocation(doc, 'originCity');
            addLocation(doc, 'destinationCity');
        });

        busesSnapshot.forEach(doc => {
            addLocation(doc, 'originCity');
            addLocation(doc, 'destinationCity');
        });
        
        const uniqueLocations = Array.from(locationMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        res.status(200).json(uniqueLocations);

    } catch (error) {
        console.error("Error fetching unique locations:", error);
        res.status(500).json({ message: "Internal server error while fetching locations." });
    }
};
