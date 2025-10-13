// File: backfill.js

// Make sure to initialize firebase-admin as you do in your main server file
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/your/serviceAccountKey.json'); // IMPORTANT: Update this path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const backfillFlights = async () => {
  const flightsRef = db.collection('flights');
  const snapshot = await flightsRef.get();

  if (snapshot.empty) {
    console.log('No flights found to update.');
    return;
  }

  const batch = db.batch();
  let count = 0;

  snapshot.forEach(doc => {
    const flightData = doc.data();
    
    // Check if the lowercase fields are missing
    if (flightData.originCity && !flightData.originCity_lowercase) {
      console.log(`Updating document: ${doc.id}`);
      const updateData = {
        originCity_lowercase: flightData.originCity.toLowerCase(),
        destinationCity_lowercase: flightData.destinationCity.toLowerCase()
      };
      batch.update(doc.ref, updateData);
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Successfully updated ${count} flight documents.`);
  } else {
    console.log('All flight documents are already up-to-date.');
  }
};

backfillFlights().catch(console.error);
