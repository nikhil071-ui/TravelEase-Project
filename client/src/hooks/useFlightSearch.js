import { useState, useEffect } from 'react';

// --- ✅ FIX: The API_URL should only be the base server address. ---
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const useFlightSearch = (from, to, date) => {
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!from || !to) {
            setFlights([]);
            setLoading(false);
            return;
        }

        const fetchFlights = async () => {
            setLoading(true);
            setError(null);
            
            // --- ✅ FIX: Construct the full, correct API path here. ---
            let searchUrl = `${API_URL}/api/flights/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
            if (date) {
                searchUrl += `&date=${encodeURIComponent(date)}`;
            }

            try {
                const response = await fetch(searchUrl);

                // This logic is good for checking if the server sent back an HTML error page.
                const contentType = response.headers.get("content-type");
                if (!response.ok || !contentType || !contentType.includes("application/json")) {
                    const errorText = await response.text();
                    if (errorText && errorText.trim().toLowerCase().startsWith('<!doctype html>')) {
                        throw new Error(`The API server returned an HTML error page. (Status: ${response.status})`);
                    }
                    throw new Error(`An unexpected server response occurred. (Status: ${response.status})`);
                }

                const data = await response.json();
                
                if (!Array.isArray(data)) {
                    console.error("API did not return an array:", data);
                    throw new Error("Data from the server is not in the expected format.");
                }
                
                setFlights(data);

            } catch (err) {
                console.error("Flight search failed:", err);
                setError(err.message);
                setFlights([]);
            } finally {
                setLoading(false);
            }
        };

        fetchFlights();
    }, [from, to, date]);

    return { flights, loading, error };
};