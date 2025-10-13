import React from 'react';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow-md">
                <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 
                        className="text-2xl font-bold text-blue-600 cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        TravelEase
                    </h1>
                    <button 
                        onClick={() => navigate(-1)} // This will take the user back to the previous page
                        className="text-gray-600 hover:text-blue-600 font-semibold px-4 py-2"
                    >
                        ← Back
                    </button>
                </nav>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-12">
                <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">The Official Rules & Regulations</h2>
                    
                    <div className="space-y-4 text-gray-700">
                        <p><strong>Effective Date:</strong> Whenever you're reading this. Time is a construct.</p>
                        <p>Welcome to TravelEase! By using our service, you agree to the following terms, which are legally binding and definitely not written by a bored intern.</p>
                        
                        <h3 className="text-xl font-semibold text-gray-800 pt-4">Article 1: Our Service</h3>
                        <p>We provide a platform for booking imaginary travel to fantastic destinations. We take no responsibility if your flight to Paris accidentally lands you in a Parisian-themed bakery in Poughkeepsie.</p>

                        <h3 className="text-xl font-semibold text-gray-800 pt-4">Article 2: User Responsibilities</h3>
                        <p>You, the User, agree to the following:</p>
                        <ul className="list-disc list-inside pl-4">
                            <li>Not to book a flight for your pet rock unless it has a valid passport photo.</li>
                            <li>To pack your sense of humor at all times. It’s carry-on friendly.</li>
                            <li>To accept that "window seat" may occasionally mean a window into the plane's electrical systems. It's a learning experience.</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 pt-4">Article 3: Cancellations</h3>
                        <p>All bookings are final. If you need to cancel, you must send a formal request via carrier pigeon. We cannot guarantee the pigeon will find us, but we appreciate the effort.</p>
                        
                        <h3 className="text-xl font-semibold text-gray-800 pt-4">Article 4: The "I Agree" Button</h3>
                        <p>By clicking "I agree" on the signup form, you legally acknowledge that you have read, understood, and chuckled at least once at these terms. You also agree that pineapple on pizza is a matter of personal taste and will not be debated on our platform.</p>

                        <h3 className="text-xl font-semibold text-gray-800 pt-4">Article 5: Acts of God</h3>
                        <p>We are not liable for flight delays caused by dragon migrations, spontaneous wormholes, or if the pilot decides to stop for chai mid-flight. These are considered features, not bugs.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Terms;
