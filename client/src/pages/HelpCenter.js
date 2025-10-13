import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// A reusable component for each FAQ item
const FaqItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-200 py-4">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left text-lg font-semibold text-gray-800 focus:outline-none"
            >
                <span className="hover:text-blue-600">{question}</span>
                <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </button>
            {isOpen && (
                <div className="mt-4 text-gray-600 space-y-2" dangerouslySetInnerHTML={{ __html: answer }} />
            )}
        </div>
    );
};

const HelpCenter = () => {
    const navigate = useNavigate();

    // A comprehensive list of FAQs covering the entire project
    const faqCategories = [
        {
            category: "Getting Started & Setup",
            questions: [
                {
                    question: "What is TravelEase?",
                    answer: "TravelEase is a full-stack web application for booking flights. It includes user authentication, a real-time booking system, an email notification service, and a complete admin dashboard for managing the platform."
                },
                {
                    question: "What technologies are used in this project?",
                    answer: "The frontend is built with <strong>React</strong> and styled with <strong>Tailwind CSS</strong>. The backend is a <strong>Node.js</strong> server using the <strong>Express</strong> framework. All data and user authentication are handled by <strong>Google Firebase</strong> (Firestore Database and Authentication)."
                },
                {
                    question: "How is the styling (CSS) handled?",
                    answer: "We use Tailwind CSS, a utility-first CSS framework. Instead of writing custom CSS files for each component, we apply utility classes directly in the JSX (e.g., `className='bg-blue-500 text-white'`). The only CSS file is `src/index.css`, which loads the Tailwind library."
                }
            ]
        },
        {
            category: "Account Management",
            questions: [
                {
                    question: "How do I create an account?",
                    answer: "You can create an account by clicking the 'Sign Up' button on the home page. You can sign up using your email and a password, or instantly with your Google account."
                },
                {
                    question: "I forgot my password. What should I do?",
                    answer: "On the Login page, click the 'Forgot Password?' link. Enter your registered email address, and if an account exists with that email, Firebase will send you a secure link to reset your password. Note: This will not work for accounts created using Google sign-in."
                },
                {
                    question: "How do I update my name on my profile?",
                    answer: "Once you are logged in, a profile avatar will appear in the header. Click on it to go to your 'My Profile' page. From there, you can enter your display name and click 'Save Changes'."
                }
            ]
        },
        {
            category: "Booking Flights",
            questions: [
                {
                    question: "How do I search for a flight?",
                    answer: "On the home page, use the main search bar to enter your 'From' and 'To' locations. As you type, a list of suggestions will appear. Once you have selected both locations, click 'Search Flights' to see the results."
                },
                {
                    question: "Can I book a flight from a 'Popular Destination' card?",
                    answer: "Yes! When you click 'Book Now' on a popular destination, a pop-up will ask for your 'From' location. Once you enter it and click 'Proceed,' you will be taken to the search results page for that route."
                },
                {
                    question: "How does the seat selection work?",
                    answer: "On the booking form, you will see a seat chart. Seats are color-coded: pink for window, green for middle, and light green for aisle. Gray seats are already booked for that flight on that specific date and cannot be selected."
                },
                {
                    question: "What happens after I confirm a booking?",
                    answer: "After you finalize your booking, the details are saved to our secure Firestore database. You will then receive a beautiful confirmation email that includes all your trip details, a unique 8-digit ticket code, and a scannable QR code for check-in."
                }
            ]
        },
        {
            category: "Managing Your Bookings",
            questions: [
                {
                    question: "Where can I see my bookings?",
                    answer: "After you log in, click the 'My Bookings' button in the header. This will take you to your booking history page, which shows all of your active and checked-in flights in real-time."
                },
                {
                    question: "How do I view my ticket?",
                    answer: "On the 'My Bookings' page, each active booking has a 'View Ticket' button. Clicking this will open a pop-up showing your unique ticket code and a scannable QR code."
                },
                {
                    question: "Can I edit my booking details?",
                    answer: "Yes. On the 'My Bookings' page, you can click the 'Edit' button to change your name, the number of travelers, or the departure date for any active booking. After you save, you will receive an email confirming the update."
                },
                {
                    question: "How do I cancel a booking?",
                    answer: "On the 'My Bookings' page, click the 'Cancel' button. A confirmation pop-up will appear. If you confirm, your booking will be canceled, and you will receive a cancellation notification via email. The booking will then appear in the admin's 'Canceled by User' list."
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm">
                <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 
                        className="text-2xl font-bold text-blue-600 cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        TravelEase
                    </h1>
                    <button 
                        onClick={() => navigate('/')}
                        className="text-gray-600 hover:text-blue-600 font-semibold px-4 py-2"
                    >
                        ← Back to Home
                    </button>
                </nav>
            </header>

            <main className="container mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-800">Help Center</h2>
                    <p className="text-gray-600 mt-2">Frequently Asked Questions</p>
                </div>

                <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
                    {faqCategories.map(category => (
                        <div key={category.category} className="mb-10">
                            <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">{category.category}</h3>
                            <div className="space-y-2">
                                {category.questions.map((faq, index) => (
                                    <FaqItem key={index} question={faq.question} answer={faq.answer} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default HelpCenter;
