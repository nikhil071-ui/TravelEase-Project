import React, { useState, useEffect, useCallback } from 'react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { auth, googleProvider } from './firebase';
import { Eye, EyeOff } from 'lucide-react'; // Import icons

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [notice, setNotice] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    const validate = useCallback(() => {
        const newErrors = {};
        if (!email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email address is invalid';
        if (!password) newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [email, password]);

    useEffect(() => {
        if (touched.email || touched.password) {
            validate();
        }
    }, [email, password, touched.email, touched.password, validate]);

    const handleBlur = (e) => {
        setTouched({
            ...touched,
            [e.target.name]: true,
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setTouched({ email: true, password: true });
        if (!validate()) {
            setNotice('Please fix the errors before submitting.');
            return;
        }
        setNotice('');
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/');
        } catch (err) {
            // --- ENHANCED: More specific error messages ---
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
                setNotice('No account found with this email address.');
            } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setNotice('Incorrect password. Please try again.');
            } else {
                setNotice('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setNotice('');
        setLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
            navigate('/');
        } catch (err) {
            setNotice(err.message || 'Google login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center py-12 px-4">
            <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Welcome Back!</h2>
                <p className="text-center text-gray-500 mb-8">Sign in to continue your journey.</p>
                
                <form onSubmit={handleLogin} className="space-y-4" noValidate>
                    {notice && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-center text-sm">{notice}</div>}
                    
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email" // ACCESSIBILITY FIX
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
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-600">Password</label>
                            <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline">Forgot password?</Link>
                        </div>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password" // ACCESSIBILITY FIX
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onBlur={handleBlur}
                                placeholder="••••••••"
                                className={`w-full px-4 py-2 border rounded-lg transition ${touched.password && errors.password ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500`}
                                required
                                disabled={loading}
                            />
                            {/* --- UI ENHANCEMENT: Icon button --- */}
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {touched.password && errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
                    </div>

                    <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg text-lg flex justify-center items-center transition-transform transform hover:scale-105 disabled:bg-blue-300" disabled={loading}>
                        {loading ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : 'Sign In'}
                    </button>
                </form>

                <div className="my-6 flex items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="mx-4 text-sm text-gray-500">OR</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <button onClick={handleGoogleLogin} disabled={loading} className="w-full flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:bg-gray-200">
                    <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                    </svg>
                    <span className="font-medium text-gray-700">Continue with Google</span>
                </button>

                <p className="text-center text-sm text-gray-600 mt-6">
                    Don't have an account? <Link to="/signup" className="font-medium text-blue-600 hover:underline">Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
