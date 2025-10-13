const admin = require('firebase-admin');
const db = admin.firestore();

exports.getFlights = async (req, res) => {
    try {
        const flightsSnapshot = await db.collection('flights').orderBy('date', 'desc').get();
        
        const flights = flightsSnapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null;

            return {
                id: doc.id,
                ...data,
                createdAt: createdAt
            };
        });
        
        res.status(200).json(flights);
    } catch (error) {
        console.error("Failed to fetch flights:", error);
        res.status(500).json({ message: "Failed to fetch flights" });
    }
};

exports.createFlight = async (req, res) => {
    try {
        const {
            airline, flightNumber, originCity, destinationCity,
            economyPrice, businessPrice,
            departureTime, arrivalTime, date, duration, stops, stopLocations,
            inFlightServices, seatsAvailable,
            flightType,
            economyDomesticGst, businessDomesticGst,
            economyInternationalGst, businessInternationalGst,
            adBannerUrl, customFields
        } = req.body;

        if (!airline || !originCity || !destinationCity || !date ||
            seatsAvailable === undefined || economyPrice === undefined || businessPrice === undefined) {
            return res.status(400).json({ message: 'Missing required flight information.' });
        }

        if (Number(businessPrice) < Number(economyPrice)) {
            return res.status(400).json({ message: 'Business price cannot be less than Economy price.' });
        }

        const cleanedOriginCity = originCity.trim();
        const cleanedDestinationCity = destinationCity.trim();

        const newFlight = {
            airline,
            flightNumber,
            originCity: cleanedOriginCity, // <-- FIXED
            destinationCity: cleanedDestinationCity, // <-- FIXED
            economyPrice: Number(economyPrice),
            businessPrice: Number(businessPrice),
            departureTime,
            arrivalTime,
            date,
            duration,
            stops: Number(stops),
            stopLocations: stopLocations || [],
            seatsAvailable: Number(seatsAvailable),
            inFlightServices: inFlightServices || [],
            flightType: flightType || 'domestic',
            economyDomesticGst: Number(economyDomesticGst) || 0,
            businessDomesticGst: Number(businessDomesticGst) || 0,
            economyInternationalGst: Number(economyInternationalGst) || 0,
            businessInternationalGst: Number(businessInternationalGst) || 0,
            adBannerUrl: adBannerUrl || '',
            customFields: customFields || [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            originCity_lowercase: cleanedOriginCity.toLowerCase(),
            destinationCity_lowercase: cleanedDestinationCity.toLowerCase(),
        };

        const docRef = await db.collection('flights').add(newFlight);
        res.status(201).json({ message: 'Flight created successfully', id: docRef.id });

    } catch (error) {
        console.error("Error creating flight:", error);
        res.status(500).json({ message: 'Failed to create flight' });
    }
};

exports.searchFlights = async (req, res) => {
    try {
        const { from, to, date } = req.query;

        if (!from || !to) {
            return res.status(400).json({ message: "Origin (from) and destination (to) are required." });
        }

        const fromCleaned = from.trim().toLowerCase();
        const toCleaned = to.trim().toLowerCase();

        let flightsQuery = db.collection('flights')
            .where('originCity_lowercase', '==', fromCleaned)
            .where('destinationCity_lowercase', '==', toCleaned)
            .where('seatsAvailable', '>', 0);
        
        if (date) {
            flightsQuery = flightsQuery.where('date', '==', date);
        }

        const querySnapshot = await flightsQuery.get();
        const flights = querySnapshot.docs.map(doc => {
             const data = doc.data();
             const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null;
             return { id: doc.id, ...data, createdAt };
        });

        res.set('Cache-Control', 'no-store');
        res.status(200).json(flights);
        
    } catch (error) {
        console.error("Error searching flights:", error);
        res.status(500).json({ message: "Failed to search flights" });
    }
};

exports.bookFlightSeats = async (req, res) => {
    try {
        const { flightId, passengers } = req.body;
        const seatsToBook = passengers.length;

        if (!flightId || !passengers || !Array.isArray(passengers) || seatsToBook === 0) {
            return res.status(400).json({ message: 'Flight ID and an array of passengers are required.' });
        }

        const flightRef = db.collection('flights').doc(flightId);
        
        await db.runTransaction(async (transaction) => {
            const flightDoc = await transaction.get(flightRef);
            if (!flightDoc.exists) {
                throw new Error("Flight not found.");
            }
            const flightData = flightDoc.data();
            if (flightData.seatsAvailable < seatsToBook) {
                throw new Error("Not enough seats available on this flight.");
            }
            const newSeatsAvailable = flightData.seatsAvailable - seatsToBook;
            transaction.update(flightRef, { seatsAvailable: newSeatsAvailable });
        });

        res.status(200).json({ message: 'Flight seats reserved successfully!' });

    } catch (error) {
        console.error("Error booking flight seats:", error);
        res.status(500).json({ message: error.message || "Failed to book seats." });
    }
};

exports.updateFlight = async (req, res) => {
    try {
        const { id } = req.params;
        const flightData = req.body;

        if (!id) {
            return res.status(400).json({ message: "Flight ID is required." });
        }

        const updatedData = {
            ...flightData,
            economyPrice: Number(flightData.economyPrice),
            businessPrice: Number(flightData.businessPrice),
            seatsAvailable: Number(flightData.seatsAvailable),
            stops: Number(flightData.stops),
            economyDomesticGst: Number(flightData.economyDomesticGst) || 0,
            businessDomesticGst: Number(flightData.businessDomesticGst) || 0,
            economyInternationalGst: Number(flightData.economyInternationalGst) || 0,
            businessInternationalGst: Number(flightData.businessInternationalGst) || 0,
            originCity: flightData.originCity.trim(),
            destinationCity: flightData.destinationCity.trim(),
        };

        const flightRef = db.collection('flights').doc(id);
        await flightRef.update(updatedData);

        res.status(200).json({ message: 'Flight updated successfully', id });

    } catch (error) {
        console.error("Error updating flight:", error);
        res.status(500).json({ message: "Failed to update flight." });
    }
};

exports.deleteFlight = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: "Flight ID is required." });

        await db.collection('flights').doc(id).delete();
        
        console.log(`Deleted flight with ID: ${id}`);
        res.status(200).send({ message: 'Flight deleted successfully' });
    } catch (error) {
        console.error("Error deleting flight:", error);
        res.status(500).send({ message: 'Error deleting flight', error: error.message });
    }
};