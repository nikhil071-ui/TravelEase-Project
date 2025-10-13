import React, { useState, useEffect } from 'react';
import SearchInput from './SearchInput';
import { Calendar } from 'lucide-react';

const OriginModal = ({ isOpen, onClose, onProceed, destination, placeholder, locations }) => {
    const [fromLocation, setFromLocation] = useState('');
    // 1. Add state to manage the selected date, defaulting to today
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Reset all state when the modal opens
            setFromLocation('');
            setDate(new Date().toISOString().split('T')[0]);
            setError('');
        }
    }, [isOpen]);

    const handleProceedClick = () => {
        if (!fromLocation.trim()) {
            setError('Please select a valid origin location.');
            return;
        }
        const isValidLocation = locations.some(loc => loc.name.toLowerCase() === fromLocation.toLowerCase());
        if (!isValidLocation) {
            setError('Location not recognized. Please select from the suggestions.');
            return;
        }
        
        setError('');
        // 2. Pass an object containing both location and date
        onProceed({ fromLocation, date });
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold mb-2 text-gray-800">Book Your Trip</h2>
                <p className="text-gray-600 mb-6">
                    Trip to <span className="font-semibold text-blue-600">{destination}</span>
                </p>

                {/* --- Form now includes Origin and Date --- */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                        <SearchInput 
                            value={fromLocation} 
                            onChange={setFromLocation} 
                            placeholder={placeholder || 'Enter your location'} 
                            locations={locations}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>
                </div>
                
                {error && <p className="text-red-500 text-sm mt-4 animate-shake">{error}</p>}

                <div className="mt-8 flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold transition-all">
                        Cancel
                    </button>
                    <button onClick={handleProceedClick} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all">
                        Proceed
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OriginModal;