import React from 'react';

// --- UPDATED: Seat component now understands travel classes ---
const Seat = ({ label, type, seatClass, isSelected, isBooked, onSelect, selectedClass, size = 'md' }) => {
    
    // A seat is disabled if it's booked OR if its class doesn't match the user's selection
    const isDisabled = isBooked || (selectedClass && seatClass !== selectedClass);

    // This function determines the style of the seat based on its state and type
    const getSeatClass = () => {
        if (isBooked) return 'bg-gray-400 cursor-not-allowed'; // A booked seat is always gray
        if (isSelected) return 'bg-green-500 text-white shadow-lg scale-110'; // A selected seat is green
        if (isDisabled) return 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-70'; // Disabled for wrong class

        // Apply colors based on the seat type if it's available
        switch (type) {
            case 'window': return 'bg-pink-200 hover:bg-pink-300 text-pink-800';
            case 'middle': return 'bg-green-200 hover:bg-green-300 text-green-800';
            case 'aisle': return 'bg-green-100 hover:bg-green-200 text-green-800';
            default: return 'bg-purple-200 hover:bg-purple-300 text-purple-800'; // Business class
        }
    };

    const sizeClass = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 md:w-10 md:h-10 text-xs';

    return (
        <button
            type="button"
            onClick={() => !isDisabled && onSelect(label)}
            disabled={isDisabled}
            className={`rounded-md flex items-center justify-center font-semibold transition-all duration-200 ${sizeClass} ${getSeatClass()}`}
            title={isDisabled ? `This is a ${seatClass} seat` : `Select seat ${label}`}
        >
            {label}
        </button>
    );
};


// --- UPDATED: Main SeatChart component now accepts selectedClass prop ---
const SeatChart = ({ selectedSeats, onSeatSelect, bookedSeats = [], selectedClass }) => {
    
    const businessRows = [1, 2, 3];
    const economyRows = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const businessLetters = ['A', 'C', 'D', 'F']; // 2x2 layout
    const economyLetters = ['A', 'B', 'C', 'D', 'E', 'F']; // 3x3 layout

    return (
        <div>
            <h3 className="font-semibold text-lg text-gray-700 mb-4 border-b pb-2">Select Your Seats</h3>
            
            <div className="flex justify-center">
                <div className="relative w-full max-w-md bg-gray-200 border-2 border-gray-300 rounded-t-[60px] rounded-b-2xl p-4">
                    {/* Cockpit */}
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-20 h-12 bg-gray-200 border-2 border-gray-300 rounded-t-full"></div>
                    
                    <div className="bg-gray-100 p-2 md:p-4 rounded-lg shadow-inner space-y-6">
                        {/* --- Business Class --- */}
                        <div>
                            <div className="text-center text-sm font-bold text-gray-600 mb-2">BUSINESS CLASS</div>
                            <div className="grid grid-cols-5 gap-x-2 gap-y-3 items-center">
                                {businessRows.map(row => (
                                    <React.Fragment key={`biz-row-${row}`}>
                                        <div className="text-gray-500 font-semibold text-sm text-center">{row}</div>
                                        <div className="col-span-4 grid grid-cols-4 gap-x-2">
                                            {businessLetters.map((letter) => (
                                                <Seat
                                                    key={`${row}${letter}`}
                                                    label={`${row}${letter}`}
                                                    type="business"
                                                    seatClass="business" // <-- Identify seat class
                                                    isSelected={selectedSeats.includes(`${row}${letter}`)}
                                                    isBooked={bookedSeats.includes(`${row}${letter}`)}
                                                    onSelect={onSeatSelect}
                                                    selectedClass={selectedClass} // <-- Pass down user's choice
                                                    size="sm"
                                                />
                                            ))}
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        {/* --- Economy Class --- */}
                        <div>
                            <div className="text-center text-sm font-bold text-gray-600 mb-2">ECONOMY CLASS</div>
                            <div className="grid grid-cols-7 gap-x-2 gap-y-3 items-center">
                                {economyRows.map(row => (
                                    <React.Fragment key={`eco-row-${row}`}>
                                        <div className="text-gray-500 font-semibold text-sm text-center">{row}</div>
                                        <div className="col-span-6 grid grid-cols-6 gap-x-2">
                                            {economyLetters.map(letter => {
                                                const seatLabel = `${row}${letter}`;
                                                const type = (letter === 'A' || letter === 'F') ? 'window' : (letter === 'C' || letter === 'D') ? 'aisle' : 'middle';
                                                return (
                                                    <Seat
                                                        key={seatLabel}
                                                        label={seatLabel}
                                                        type={type}
                                                        seatClass="economy" // <-- Identify seat class
                                                        isSelected={selectedSeats.includes(seatLabel)}
                                                        isBooked={bookedSeats.includes(seatLabel)}
                                                        onSelect={onSeatSelect}
                                                        selectedClass={selectedClass} // <-- Pass down user's choice
                                                        size="sm"
                                                    />
                                                );
                                            })}
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Tail & Staff Area */}
                    <div className="h-16 mt-4 bg-gray-300 rounded-b-xl flex items-center justify-center font-bold text-gray-500">STAFF</div>
                </div>
            </div>
            
            {/* --- UPDATED: New, clearer legend --- */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs text-gray-600">
                <div className="flex items-center justify-center gap-2 p-2 rounded bg-purple-100"><div className="w-4 h-4 rounded-sm bg-purple-200"></div> Business</div>
                <div className="flex items-center justify-center gap-2 p-2 rounded bg-green-100"><div className="w-4 h-4 rounded-sm bg-green-200"></div> Economy</div>
                <div className="flex items-center justify-center gap-2 p-2 rounded bg-green-100"><div className="w-4 h-4 rounded-sm bg-green-500"></div> Selected</div>
                <div className="flex items-center justify-center gap-2 p-2 rounded bg-gray-100"><div className="w-4 h-4 rounded-sm bg-gray-400"></div> Booked</div>
                <div className="flex items-center justify-center gap-2 p-2 rounded bg-gray-100"><div className="w-4 h-4 rounded-sm bg-gray-200 border"></div> Unavailable</div>
            </div>
        </div>
    );
};

export default SeatChart;

