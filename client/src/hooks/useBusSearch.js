import { useState, useEffect } from 'react';

// ✅ FIX: The API_URL should only be the base server address.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const useBusSearch = (from, to, date) => {
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!from || !to) {
            setBuses([]);
            setLoading(false);
            return;
        }

        const fetchBuses = async () => {
            setLoading(true);
            setError(null);
            
            // ✅ FIX: Construct the full, correct API path here.
            let searchUrl = `${API_URL}/api/buses/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
            if (date) {
                searchUrl += `&date=${encodeURIComponent(date)}`;
            }

            try {
                const response = await fetch(searchUrl);

                const contentType = response.headers.get("content-type");
                if (!response.ok || !contentType || !contentType.includes("application/json")) {
                    const errorText = await response.text();
                    if (errorText && errorText.trim().toLowerCase().startsWith('<!doctype html>')) {
                        throw new Error(`The API server returned an HTML error page instead of data. (Status: ${response.status})`);
                    }
                    throw new Error(`An unexpected error occurred. (Status: ${response.status})`);
                }
                
                const data = await response.json();
                
                if (!Array.isArray(data)) {
                    throw new Error("Data from the server is not in the expected array format.");
                }
                
                setBuses(data);

            } catch (err) {
                setError(err.message);
                setBuses([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBuses();
    }, [from, to, date]);

    return { buses, loading, error };
};