import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const VerifyOTP = () => {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get email from the state passed during navigation
    const email = location.state?.email;

    useEffect(() => {
        if (!email) {
            // If the user lands here without an email (e.g., direct navigation), send them back.
            navigate('/signup');
        }
    }, [email, navigate]);
    
    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCooldown]);

   const handleApiCall = async (endpoint, body) => {
    // Use an environment variable, with localhost as a backup for development
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

     await fetch(`${apiUrl}/api/email${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'An error occurred.');
        }
        return data;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            await handleApiCall('/verify-otp', { email, otp });
            setMessage('Verification successful! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err) {
            setError(err.message);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;

        setError('');
        setMessage('Sending a new code...');
        try {
            await handleApiCall('/send-otp', { email });
            setMessage('A new verification code has been sent to your email.');
            setResendCooldown(60); // Set cooldown for 60 seconds
        } catch (err) {
            setError(err.message);
            setMessage('');
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 font-sans">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Verify Your Email</h2>
                <p className="text-center text-gray-500 mb-6">
                    A 6-digit code has been sent to <br/><strong>{email}</strong>.
                </p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-gray-600 mb-1">Verification Code</label>
                        <input
                            type="text"
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            maxLength="6"
                            placeholder="_ _ _ _ _ _"
                            required
                        />
                    </div>
                    
                    {error && <p className="text-red-500 text-center text-sm">{error}</p>}
                    {message && <p className="text-green-500 text-center text-sm">{message}</p>}

                    <button 
                        type="submit" 
                        className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition"
                    >
                        Verify Account
                    </button>
                </form>
                <div className="text-center mt-4">
                    <button 
                        onClick={handleResendOtp}
                        disabled={resendCooldown > 0}
                        className="text-sm text-indigo-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                    >
                        {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Did not receive code? Resend'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyOTP;