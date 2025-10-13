import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    children,
    variant = 'default', // 'default' or 'danger'
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmDisabled = false // New prop to disable button during loading
}) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    const isDanger = variant === 'danger';
    
    const IconComponent = isDanger ? ShieldAlert : AlertTriangle;
    
    const iconStyles = {
        container: isDanger ? 'bg-red-100' : 'bg-blue-100',
        icon: isDanger ? 'text-red-600' : 'text-blue-600',
    };

    const confirmButtonStyles = isDanger 
        ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-300' 
        : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={onClose}
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
                            <div className="flex flex-col items-center text-center">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${iconStyles.container}`}>
                                    <IconComponent size={40} className={iconStyles.icon} />
                                </div>

                                <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
                                
                                <div className="text-gray-600 mb-8">
                                    {children}
                                </div>

                                <div className="flex flex-col-reverse sm:flex-row justify-center gap-4 w-full">
                                    <button
                                        onClick={onClose}
                                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition"
                                    >
                                        {cancelText}
                                    </button>
                                    <button
                                        onClick={onConfirm}
                                        disabled={confirmDisabled}
                                        className={`w-full text-white font-bold py-3 px-4 rounded-lg transition ${confirmButtonStyles}`}
                                    >
                                        {confirmText}
                                    </button>
                                </div>
                            </div>
                        </div>
                         <button 
                            onClick={onClose} 
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

export default ConfirmModal;
