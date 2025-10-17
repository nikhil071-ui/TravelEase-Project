import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, CheckCircle, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState('enter-email'); // 'enter-email', 'enter-otp', 'reset-password'
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleApiCall = async (endpoint, body) => {
    // Use an environment variable, with localhost as a backup for development
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    await fetch(`${apiUrl}/api/email${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    // ... rest of the function
};

    const handleSendLink = async () => {
        if (!email) { setError('Please enter your email address.'); return; }
        setLoading(true); setError(''); setMessage('');
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('Password reset link sent! Please check your email.');
        } catch (err) {
            setError(err.code === 'auth/user-not-found' ? 'No account found with this email.' : 'Failed to send reset link.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async () => {
        if (!email) { setError('Please enter your email address.'); return; }
        setLoading(true); setError(''); setMessage('');
        try {
            await handleApiCall('/send-otp', { email });
            setMessage(`An OTP has been sent to ${email}.`);
            setStep('enter-otp');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true); setError(''); setMessage('');
        try {
            await handleApiCall('/verify-otp', { email, otp });
            setMessage('OTP verified successfully. Please set your new password.');
            setStep('reset-password');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
        if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }

        setLoading(true); setError(''); setMessage('');
        try {
            await handleApiCall('/reset-password-with-otp', { email, otp, newPassword });
            setMessage('Password reset successfully! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderEnterEmailStep = () => (
        <>
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Forgot Password?</h2>
            <p className="text-center text-gray-500 mb-8">Choose a recovery method.</p>
            {message && <div className="bg-green-100 text-green-700 p-3 rounded-lg text-center text-sm">{message}</div>}
            {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-center text-sm">{error}</div>}
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg" required disabled={loading} />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={handleSendLink} className="w-full flex justify-center items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg" disabled={loading}>
                    <Mail size={18} /> Send Link
                </button>
                <button onClick={handleSendOtp} className="w-full flex justify-center items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg" disabled={loading}>
                    <KeyRound size={18} /> Send OTP
                </button>
            </div>
        </>
    );

    const renderEnterOtpStep = () => (
        <form onSubmit={handleVerifyOtp}>
            <button onClick={() => setStep('enter-email')} className="flex items-center gap-2 text-sm text-gray-600 hover:underline mb-4"><ArrowLeft size={16} />Back to email</button>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Enter OTP</h2>
            <p className="text-center text-gray-500 mb-8">Check your email for the 6-digit code.</p>
            {message && <div className="bg-green-100 text-green-700 p-3 rounded-lg text-center text-sm">{message}</div>}
            {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-center text-sm">{error}</div>}
            <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-600 mb-1">Verification Code</label>
                <input id="otp" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength="6" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center tracking-[1em]" required disabled={loading} />
            </div>
            <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
        </form>
    );

    const renderResetPasswordStep = () => (
         <form onSubmit={handleResetPassword}>
            <div className="flex items-center gap-2 text-green-600 font-semibold mb-4"><CheckCircle size={20}/> OTP Verified</div>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Set New Password</h2>
            <p className="text-center text-gray-500 mb-8">Create a new, strong password.</p>
            {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-center text-sm">{error}</div>}
            <div className="space-y-4">
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" className="w-full px-4 py-2 border border-gray-300 rounded-lg" required disabled={loading} />
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" className="w-full px-4 py-2 border border-gray-300 rounded-lg" required disabled={loading} />
            </div>
            <button type="submit" className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
            </button>
        </form>
    );


    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center py-12 px-4">
            <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl p-8">
                <div className="space-y-6">
                    {step === 'enter-email' && renderEnterEmailStep()}
                    {step === 'enter-otp' && renderEnterOtpStep()}
                    {step === 'reset-password' && renderResetPasswordStep()}
                </div>
                {message.includes('Redirecting') && <div className="bg-green-100 text-green-700 p-3 rounded-lg text-center text-sm mt-4">{message}</div>}
                <div className="text-center text-sm text-gray-600 mt-6">
                    <Link to="/login" className="font-medium text-blue-600 hover:underline">← Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
