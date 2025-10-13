import React from 'react';

// A sub-component for an individual bus seat
const BusSeat = ({ label, isSelected, isBooked, onSelect }) => {
    const getSeatClass = () => {
        if (isBooked) {
            return 'bg-gray-400 cursor-not-allowed';
        }
        if (isSelected) {
            return 'bg-blue-600 text-white shadow-lg';
        }
        return 'bg-green-200 hover:bg-green-300'; // All available bus seats are green
    };

    return (
        <button
            type="button"
            onClick={() => onSelect(label)}
            disabled={isBooked}
            className={`w-10 h-10 rounded-md flex items-center justify-center font-semibold text-xs transition-all duration-200 ${getSeatClass()}`}
            title={`Seat ${label}`}
        >
            {label}
        </button>
    );
};

// The main BusSeatChart component
const BusSeatChart = ({ selectedSeats, onSeatSelect, bookedSeats = [] }) => {
    const rows = [1, 2, 3, 4, 5, 6, 7, 8]; // 8 rows of seats
    const seatLetters = ['A', 'B', 'C', 'D']; // 2x2 layout
    const backRowSeats = [33, 34, 35, 36, 37]; // The long back seat

    return (
        <div>
            <h3 className="font-semibold text-lg text-gray-700 mb-4 border-b pb-2">Select Your Seats</h3>
            
            <div className="flex justify-center">
                <div className="relative w-full max-w-xs bg-gray-200 border-2 border-gray-300 rounded-lg p-4">
                    {/* Driver's Seat */}
                    <div className="absolute -top-4 left-4 w-10 h-10 bg-gray-300 rounded-md flex items-center justify-center text-xs font-bold text-gray-500">
                        DRV
                    </div>
                    
                    <div className="bg-gray-100 p-4 rounded-lg shadow-inner space-y-3">
                        {/* Main 2x2 seating area */}
                        <div className="grid grid-cols-5 gap-x-2 gap-y-3">
                            {rows.map(row => 
                                seatLetters.map((letter, index) => {
                                    const seatLabel = `${(row - 1) * 4 + index + 1}`;
                                    const isSelected = selectedSeats.includes(seatLabel);
                                    const isBooked = bookedSeats.includes(seatLabel);
                                    return (
                                        <div key={seatLabel} className={index === 2 ? 'col-start-4' : ''}>
                                            <BusSeat
                                                label={seatLabel}
                                                isSelected={isSelected}
                                                isBooked={isBooked}
                                                onSelect={onSeatSelect}
                                            />
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        
                        {/* Back Row */}
                        <div className="pt-3 border-t border-gray-300 flex justify-between">
                             {backRowSeats.map(seatLabel => {
                                const isSelected = selectedSeats.includes(String(seatLabel));
                                const isBooked = bookedSeats.includes(String(seatLabel));
                                return (
                                    <BusSeat
                                        key={seatLabel}
                                        label={String(seatLabel)}
                                        isSelected={isSelected}
                                        isBooked={isBooked}
                                        onSelect={onSeatSelect}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Instructions and color key */}
            <div className="mt-8 grid grid-cols-3 gap-2 text-center text-xs text-gray-600">
                <div className="flex items-center justify-center gap-2 p-1 rounded bg-green-100"><div className="w-3 h-3 rounded-sm bg-green-200"></div> Available</div>
                <div className="flex items-center justify-center gap-2 p-1 rounded bg-blue-100"><div className="w-3 h-3 rounded-sm bg-blue-600"></div> Selected</div>
                <div className="flex items-center justify-center gap-2 p-1 rounded bg-gray-100"><div className="w-3 h-3 rounded-sm bg-gray-400"></div> Booked</div>
            </div>
        </div>
    );
};

export default BusSeatChart;
