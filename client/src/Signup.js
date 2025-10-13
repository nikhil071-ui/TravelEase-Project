import React, { useState, useEffect, useCallback } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { auth, googleProvider } from './firebase'; // Ensure this path is correct

const Signup = () => {
    const navigate = useNavigate();

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    // UI/UX State
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isFormValid, setIsFormValid] = useState(false);
    const [notice, setNotice] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // --- FORM VALIDATION ---
    const validate = useCallback(() => {
        const newErrors = {};

        // Email validation
        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email address is invalid';
        }

        // Password validation
        if (!password) {
            newErrors.password = 'Password is required';
        } else {
            const passwordErrors = [];
            if (password.length < 8) passwordErrors.push('be at least 8 characters');
            if (!/[A-Z]/.test(password)) passwordErrors.push('contain an uppercase letter');
            if (!/[a-z]/.test(password)) passwordErrors.push('contain a lowercase letter');
            if (!/\d/.test(password)) passwordErrors.push('contain a number');
            if (passwordErrors.length > 0) {
                newErrors.password = `Password must ${passwordErrors.join(', ')}.`;
            }
        }

        // Confirm Password validation
        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password && password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [email, password, confirmPassword]);

    useEffect(() => {
        // Re-validate form whenever inputs change
        setIsFormValid(validate());
    }, [email, password, confirmPassword, validate]);

    const handleBlur = (e) => {
        setTouched({
            ...touched,
            [e.target.name]: true,
        });
    };

    // --- EMAIL & PASSWORD SIGNUP HANDLER ---
    const handleSignup = async (e) => {
        e.preventDefault();
        setTouched({ email: true, password: true, confirmPassword: true });

        if (!agreedToTerms) {
            setNotice('You must agree to the Terms and Conditions.');
            return;
        }

        if (!isFormValid) {
            setNotice('Please correct the errors to sign up.');
            return;
        }

        setNotice('');
        setLoading(true);

        try {
            // Step 1: Create the user in Firebase Authentication.
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Step 2: Call backend to send the OTP email.
            // RECOMMENDATION: Store this URL in an environment variable (.env file).
            const response = await fetch('http://localhost:5000/api/email/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email }),
            });

            if (!response.ok) {
                // Handle errors from the backend (e.g., email service is down).
                const data = await response.json();
                throw new Error(data.message || 'Failed to send verification email.');
            }

            // Step 3: Redirect to the OTP verification page on success.
            setNotice('Account created! Please check your email for a verification code.');
            navigate('/verify-otp', { state: { email: user.email } });

        } catch (err) {
            // Catches errors from Firebase (e.g., auth/email-already-in-use)
            // and from the backend fetch call.
            if (err.code === 'auth/email-already-in-use') {
                setNotice('This email is already registered. Please try logging in.');
            } else {
                setNotice(err.message || 'Signup failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // --- GOOGLE SIGNUP HANDLER ---
    const handleGoogleSignup = async () => {
        if (!agreedToTerms) {
            setNotice('You must agree to the Terms and Conditions before signing up with Google.');
            return;
        }
        setNotice('');
        setLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
            setNotice('Google signup successful! Redirecting to home...');
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (err) {
            setNotice(err.message || 'Google signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // --- JSX RENDER ---
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center py-12 px-4">
            <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Create an Account</h2>
                <p className="text-center text-gray-500 mb-8">Start your journey with us</p>

                <form onSubmit={handleSignup} className="space-y-4" noValidate>
                    {notice && (
                        <div
                            className={`p-3 rounded-lg text-center text-sm ${
                                notice.includes('failed') || notice.includes('must agree') || notice.includes('already registered') || Object.keys(errors).length > 0
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                        >
                            {notice}
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={handleBlur}
                            placeholder="you@example.com"
                            className={`w-full px-4 py-2 border rounded-lg transition ${touched.email && errors.email ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500`}
                            required
                            disabled={loading}
                        />
                        {touched.email && errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">Password</label>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onBlur={handleBlur}
                                placeholder="8+ chars, upper, lower, number"
                                className={`w-full px-4 py-2 border rounded-lg transition ${touched.password && errors.password ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500`}
                                required
                                disabled={loading}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-600">
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {touched.password && errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-600 mb-1">Confirm Password</label>
                        <div className="relative">
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                onBlur={handleBlur}
                                placeholder="Confirm your password"
                                className={`w-full px-4 py-2 border rounded-lg transition ${touched.confirmPassword && errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500`}
                                required
                                disabled={loading}
                            />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-600">
                                {showConfirmPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {touched.confirmPassword && errors.confirmPassword && <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="terms"
                            name="terms"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            disabled={loading}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="terms" className="text-sm text-gray-600">
                            I agree to the <Link to="/terms" className="text-blue-600 hover:underline">Terms and Conditions</Link>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg text-lg flex justify-center items-center transition-transform transform hover:scale-105 disabled:bg-blue-300 disabled:cursor-not-allowed"
                        disabled={loading || !isFormValid || !agreedToTerms}
                    >
                        {loading ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : 'Create Account'}
                    </button>

                    <div className="my-6 flex items-center">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="mx-4 text-sm text-gray-500">OR</span>
                        <div className="flex-grow border-t border-gray-300"></div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleSignup}
                        disabled={loading}
                        className="w-full flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:bg-gray-200"
                    >
                        <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                        </svg>
                        <span className="font-medium text-gray-700">Sign up with Google</span>
                    </button>

                    <p className="text-center text-sm text-gray-600 mt-6">
                        Already have an account? <Link to="/login" className="font-medium text-blue-600 hover:underline">Sign in</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Signup;

