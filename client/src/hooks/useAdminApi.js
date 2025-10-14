import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const useAdminApi = () => {
    const [data, setData] = useState({
        flights: [],
        buses: [],
        users: [],
        bookings: [],
        coupons: [],
        banners: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    
    // This ref will prevent the API from being called twice in React's Strict Mode
    const hasFetched = useRef(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        
        const token = sessionStorage.getItem('admin-token');

        if (!token) {
            navigate('/admin/login');
            return;
        }

        try {
            const decodedToken = jwtDecode(token);
            if (decodedToken.exp * 1000 < Date.now()) {
                throw new Error("Token expired");
            }
        } catch (err) {
            sessionStorage.removeItem('admin-token');
            navigate('/admin/login');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/admin/all-data`, {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-cache', // Explicitly disable caching for this request
            });

            if (response.status === 401 || response.status === 403) {
                sessionStorage.removeItem('admin-token');
                navigate('/admin/login');
                return;
            }
            
            // We get the body as text first to avoid JSON error on HTML responses
            const responseText = await response.text();
            if (!response.ok) {
                // Try to parse error from server, or use the raw text
                try {
                    const errorJson = JSON.parse(responseText);
                    throw new Error(errorJson.message || 'Failed to fetch dashboard data.');
                } catch {
                    throw new Error(responseText || 'Failed to fetch dashboard data.');
                }
            }

            // Only try to parse as JSON if the request was successful
            const allData = JSON.parse(responseText);
            setData(allData);

        } catch (err) {
            // This will catch both network errors and the JSON parsing error
            setError(err.message || 'Could not connect to the server.');
            console.error("Error in fetchData:", err);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        // This check ensures the fetch only runs once on component mount
        if (!hasFetched.current) {
            hasFetched.current = true;
            fetchData();
        }
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
};

