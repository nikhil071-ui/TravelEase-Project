const admin = require('firebase-admin');
const db = admin.firestore();

// 1. CREATE a new bus route
exports.createBus = async (req, res) => {
    try {
        const {
            operator, busType, originCity, destinationCity, price,
            departureTime, arrivalTime, date, amenities, rating, seatsAvailable, category,
            gst, adBannerUrl, customFields
        } = req.body;

        if (!operator || !originCity || !destinationCity || !price || !date) {
            return res.status(400).json({ message: 'Missing required bus information, including date.' });
        }

        const cleanedOriginCity = originCity.trim();
        const cleanedDestinationCity = destinationCity.trim();

        const newBus = {
            operator,
            busType,
            category: category || 'Private',
            originCity: cleanedOriginCity,
            destinationCity: cleanedDestinationCity,
            price: Number(price),
            seatsAvailable: Number(seatsAvailable) || 0,
            departureTime,
            arrivalTime,
            date,
            amenities: amenities || [],
            rating: Number(rating) || 0,
            gst: Number(gst) || 0,
            adBannerUrl: adBannerUrl || '',
            customFields: customFields || [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            originCity_lowercase: cleanedOriginCity.toLowerCase(),
            destinationCity_lowercase: cleanedDestinationCity.toLowerCase()
        };

        const docRef = await db.collection('buses').add(newBus);
        res.status(201).json({ message: 'Bus route created successfully', id: docRef.id });

    } catch (error) {
        console.error("Error creating bus route:", error);
        res.status(500).json({ message: 'Failed to create bus route' });
    }
};

// 2. READ: Get ALL bus routes (for admin purposes)
exports.getBuses = async (req, res) => {
    try {
        const busesSnapshot = await db.collection('buses').orderBy('date', 'desc').get();
        const buses = busesSnapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null;
            return { id: doc.id, ...data, createdAt };
        });
        res.status(200).json(buses);
    } catch (error) {
        console.error("Failed to fetch buses:", error);
        res.status(500).json({ message: "Failed to fetch buses" });
    }
};

// 3. UPDATE a bus's details
exports.updateBus = async (req, res) => {
    try {
        const { id } = req.params;
        const busData = req.body;

        if (!id) {
            return res.status(400).json({ message: "Bus ID is required." });
        }

        const updatedData = {
            ...busData,
            price: Number(busData.price) || 0,
            rating: Number(busData.rating) || 0,
            seatsAvailable: Number(busData.seatsAvailable) || 0,
            gst: Number(busData.gst) || 0,
            originCity_lowercase: busData.originCity.trim().toLowerCase(),
            destinationCity_lowercase: busData.destinationCity.trim().toLowerCase(),
        };

        const busRef = db.collection('buses').doc(id);
        await busRef.update(updatedData);

        res.status(200).json({ message: 'Bus route updated successfully', id });

    } catch (error) {
        console.error("Error updating bus route:", error);
        res.status(500).json({ message: "Failed to update bus route." });
    }
};

// 4. DELETE a bus route
exports.deleteBus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: "Bus ID is required." });

        await db.collection('buses').doc(id).delete();

        console.log(`Deleted bus with ID: ${id}`);
        res.status(200).send({ message: 'Bus route deleted successfully' });
    } catch (error) {
        console.error("Error deleting bus route:", error);
        res.status(500).send({ message: 'Error deleting bus route', error: error.message });
    }
};

// 5. SEARCH for buses (date is now optional)
exports.searchBuses = async (req, res) => {
    try {
        const { from, to, date } = req.query;
        if (!from || !to) {
            return res.status(400).json({ message: "Origin (from) and destination (to) are required." });
        }

        const fromCleaned = from.trim().toLowerCase();
        const toCleaned = to.trim().toLowerCase();

        let busesQuery = db.collection('buses')
            .where('originCity_lowercase', '==', fromCleaned)
            .where('destinationCity_lowercase', '==', toCleaned);

        if (date) {
            busesQuery = busesQuery.where('date', '==', date);
        }

        const querySnapshot = await busesQuery.get();
        const buses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.set('Cache-control', 'no-store');
        res.status(200).json(buses);

    } catch (error) {
        console.error("Error searching buses:", error);
        res.status(500).json({ message: "Failed to search buses" });
    }
};

// 6. BOOK bus seats
exports.bookBusSeats = async (req, res) => {
    try {
        const { busId, selectedSeats } = req.body;
        if (!busId || !selectedSeats || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
            return res.status(400).json({ message: 'Bus ID and an array of selected seats are required.' });
        }
        const busRef = db.collection('buses').doc(busId);

        await db.runTransaction(async (transaction) => {
            const busDoc = await transaction.get(busRef);
            if (!busDoc.exists) {
                throw new Error("Bus not found.");
            }
            const busData = busDoc.data();
            const seatsToBook = selectedSeats.length;
            if (busData.seatsAvailable < seatsToBook) {
                throw new Error("Not enough seats available.");
            }
            const newSeatsAvailable = busData.seatsAvailable - seatsToBook;
            transaction.update(busRef, { seatsAvailable: newSeatsAvailable });
        });

        res.status(200).json({ message: 'Seats booked successfully!' });
    } catch (error) {
        console.error("Error booking bus seats:", error);
        res.status(500).json({ message: error.message || "Failed to book seats." });
    }
};
