import React from 'react';

const EditBookingForm = ({ editedData, onDataChange, onSave, onDiscard }) => {
    // This handler simplifies passing data changes up to the parent component
    const handleChange = (e) => {
        const { name, value } = e.target;
        onDataChange(prevData => ({ ...prevData, [name]: value }));
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 animate-pulse-once">
            <h4 className="font-bold text-gray-700 mb-4">Editing Booking...</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* First Name Input */}
                <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-600">First Name</label>
                    <input 
                        type="text" 
                        id="firstName"
                        name="firstName" 
                        value={editedData.firstName} 
                        onChange={handleChange} 
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500" 
                    />
                </div>

                {/* Last Name Input */}
                <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-600">Last Name</label>
                    <input 
                        type="text" 
                        id="lastName"
                        name="lastName" 
                        value={editedData.lastName} 
                        onChange={handleChange} 
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                    />
                </div>

                {/* REMOVED: Travelers and Departure Date inputs are no longer here */}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-4">
                <button 
                    onClick={onSave} 
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                    Save Changes
                </button>
                <button 
                    onClick={onDiscard} 
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                    Discard
                </button>
            </div>
            
            {/* Simple animation for when the form appears */}
            <style>{`
                @keyframes pulse-once {
                    0% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(234, 179, 8, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); }
                }
                .animate-pulse-once {
                    animation: pulse-once 1.5s;
                }
            `}</style>
        </div>
    );
};

export default EditBookingForm;
