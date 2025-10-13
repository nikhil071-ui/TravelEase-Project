import React from 'react';

const Modal = ({ isOpen, onClose, onConfirm, title, children, confirmText = "Confirm", confirmColor = "red" }) => {
    if (!isOpen) return null;

    // ✅ NEW: Dynamically change button color based on the 'confirmColor' prop
    const colorClasses = {
        red: 'bg-red-500 hover:bg-red-600',
        green: 'bg-green-500 hover:bg-green-600',
        blue: 'bg-blue-500 hover:bg-blue-600',
    };

    const confirmButtonClass = colorClasses[confirmColor] || colorClasses.red;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">{title}</h3>
                <div className="text-gray-600 mb-6">
                    {children}
                </div>
                <div className="flex justify-end gap-3">
                    {/* The "Cancel" button can now also be a simple "Close" button */}
                    {onClose && (
                         <button 
                            onClick={onClose} 
                            className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition"
                        >
                            {onConfirm ? "Cancel" : "Close"}
                        </button>
                    )}
                   
                    {/* The "Confirm" button is now more flexible */}
                    {onConfirm && (
                        <button 
                            onClick={onConfirm}
                            className={`px-5 py-2 rounded-lg text-white font-semibold transition ${confirmButtonClass}`}
                        >
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Modal;
