import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, KeyRound, Eye, EyeOff } from 'lucide-react';

const ReauthModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    loading 
}) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleConfirm = () => {
        if (!password) {
            setError('Password is required to proceed.');
            return;
        }
        setError('');
        onConfirm(password);
    };

    const handleClose = useCallback(() => {
        setPassword('');
        setError('');
        onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            const handleKeyDown = (event) => {
                if (event.key === 'Escape') handleClose();
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isOpen, handleClose]);


    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={handleClose}
                >
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative bg-white rounded-2xl shadow-xl max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">{title || "Authentication Required"}</h2>
                                <p className="text-gray-600 mt-2">For your security, please confirm your password.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="reauth-password"
                                        name="reauth-password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your current password"
                                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                        autoComplete="current-password"
                                    />
                                     <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row justify-center gap-4 w-full mt-8">
                                <button
                                    onClick={handleClose}
                                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={loading}
                                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-3 px-4 rounded-lg transition"
                                >
                                    {loading ? "Verifying..." : "Confirm & Delete"}
                                </button>
                            </div>
                        </div>
                         <button 
                            onClick={handleClose} 
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Close modal"
                        >
                            <X size={24} />
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ReauthModal;

