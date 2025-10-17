import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import Modal from '../components/Modal';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { generateFlightPDF } from '../utils/flightPDF';
import { generateBusPDF } from '../utils/busPDF';
import EditBookingForm from '../components/EditBookingForm';
// For professional icons, add lucide-react: npm install lucide-react
import { Plane, Bus, MapPin, Ticket, Download, Calendar, Users, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';


// --- NEW: Reusable & Child Components for the Revamped UI ---

const StatusPill = ({ status }) => {
    const statusConfig = {
        'active': { text: 'Active', icon: <CheckCircle size={14} />, classes: 'bg-green-100 text-green-700' },
        'checked-in': { text: 'Checked-In', icon: <CheckCircle size={14} />, classes: 'bg-blue-100 text-blue-700' },
        'canceled_by_user': { text: 'Canceled', icon: <XCircle size={14} />, classes: 'bg-red-100 text-red-700' },
        'canceled_by_admin': { text: 'Canceled', icon: <XCircle size={14} />, classes: 'bg-red-100 text-red-700' },
        'completed': { text: 'Completed', icon: <Clock size={14} />, classes: 'bg-gray-100 text-gray-600' }
    };

    const config = statusConfig[status] || statusConfig['completed'];

    return (
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.classes}`}>
            {config.icon}
            <span>{config.text}</span>
        </div>
    );
};

const BookingCard = ({ booking, onEdit, onCancel, onViewTicket, isPast }) => {
    const isCanceled = booking.status.startsWith('canceled');
    const bookingIcon = useMemo(() => {
        switch (booking.type) {
            case 'flight': return { icon: <Plane className="text-sky-600" />, bg: 'bg-sky-100' };
            case 'bus': return { icon: <Bus className="text-amber-600" />, bg: 'bg-amber-100' };
            case 'tour': return { icon: <MapPin className="text-indigo-600" />, bg: 'bg-indigo-100' };
            default: return { icon: <Ticket className="text-gray-600" />, bg: 'bg-gray-100' };
        }
    }, [booking.type]);

    return (
        <div className={`bg-white rounded-xl shadow-md p-5 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] flex flex-col sm:flex-row gap-4 ${isPast || isCanceled ? 'opacity-75' : ''}`}>
            <div className={`w-full sm:w-20 h-20 flex-shrink-0 rounded-lg flex items-center justify-center ${bookingIcon.bg}`}>
                {React.cloneElement(bookingIcon.icon, { size: 32 })}
            </div>
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{booking.type}</p>
                        <h3 className="text-xl font-bold text-gray-800">
                            {booking.type === 'flight' ? `${booking.origin} → ${booking.destination}` : (booking.routeName || booking.tourName)}
                        </h3>
                    </div>
                    <StatusPill status={isPast && !isCanceled ? 'completed' : booking.status} />
                </div>
                <div className="border-t my-3"></div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                     <div className="flex gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            <span>{booking.departureDate || booking.tourDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Users size={14} />
                            <span>{booking.travelers} Traveler(s)</span>
                        </div>
                    </div>
                    {!isPast && !isCanceled && (
                         <div className="flex gap-2">
                            <button onClick={() => onViewTicket(booking)} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2"><Ticket size={16}/>View Ticket</button>
                            <button onClick={() => onEdit(booking)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg text-sm">Edit</button>
                            <button onClick={() => onCancel(booking)} className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-4 rounded-lg text-sm">Cancel</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main BookingHistory Component ---

const BookingHistory = () => {
    const navigate = useNavigate();
    const [allBookings, setAllBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [editingBookingId, setEditingBookingId] = useState(null);
    const [editedData, setEditedData] = useState({ firstName: '', lastName: '', travelers: 1, departureDate: '' });
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [bookingToCancel, setBookingToCancel] = useState(null);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'past'

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) setUser(currentUser); else navigate('/login');
        });
        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        const q = query(collection(db, 'bookings'), where("userId", "==", user.uid), orderBy("bookedAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            setAllBookings(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    // NEW: Memoized filtering for upcoming and past bookings based on tabs
    const { upcomingBookings, pastBookings } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = allBookings.filter(b => {
            const bookingDate = new Date(b.departureDate || b.tourDate);
            return !b.status.startsWith('canceled') && bookingDate >= today;
        });
        const past = allBookings.filter(b => {
            const bookingDate = new Date(b.departureDate || b.tourDate);
            return b.status.startsWith('canceled') || bookingDate < today;
        });

        return { upcomingBookings: upcoming, pastBookings: past };
    }, [allBookings]);

    const bookingsToShow = activeTab === 'upcoming' ? upcomingBookings : pastBookings;
    
    const handleEditClick = (booking) => { /* ... existing logic ... */
        setEditingBookingId(booking.id);
        let passengerData = {};
        if (booking.passengers && Array.isArray(booking.passengers) && booking.passengers.length > 0) {
            passengerData = booking.passengers[0];
        } else {
            passengerData = { firstName: booking.firstName, lastName: booking.lastName };
        }
        setEditedData({
            firstName: passengerData.firstName || '',
            lastName: passengerData.lastName || '',
            travelers: booking.travelers,
            departureDate: booking.departureDate
        });
    };

    const handleSaveClick = async (bookingId) => { /* ... existing logic ... */
        const bookingDocRef = doc(db, 'bookings', bookingId);
        const originalBooking = allBookings.find(b => b.id === bookingId);
        if (!originalBooking) {
            alert("Error: Could not find booking to update.");
            return;
        }

        const newPassengers = (originalBooking.passengers && Array.isArray(originalBooking.passengers)) 
            ? [...originalBooking.passengers] 
            : [{}];

        newPassengers[0] = { ...newPassengers[0], firstName: editedData.firstName, lastName: editedData.lastName };

        const updatePayload = {
            passengers: newPassengers,
            travelers: Number(editedData.travelers),
            departureDate: editedData.departureDate
        };

        try {
            await updateDoc(bookingDocRef, updatePayload);
            setEditingBookingId(null);
        } catch (error) {
            console.error("Error updating booking:", error);
            alert("Failed to save changes.");
        }
    };

    const handleDownloadTicket = async (booking) => { /* ... existing logic ... */
        if (!booking || !Array.isArray(booking.passengers) || booking.passengers.length === 0) {
            alert("Ticket data is incomplete. Please refresh and try again.");
            return;
        }
        try {
            if (booking.type === 'tour' || booking.type === 'bus') await generateBusPDF(booking); else await generateFlightPDF(booking);
            setIsTicketModalOpen(false);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert(`Failed to generate ticket: ${error.message}`);
        }
    };
    
    const handleCancelClick = (booking) => { /* ... existing logic ... */
        setBookingToCancel(booking);
        setIsCancelModalOpen(true);
    };

    const handleCancelModalClose = () => { /* ... existing logic ... */
        setIsCancelModalOpen(false);
        setBookingToCancel(null);
    };
    
    const confirmCancelBooking = async () => {
    if (!bookingToCancel || !user) {
        alert("Error: No booking selected for cancellation.");
        return;
    }
    
    // Use an environment variable for the API URL
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const bookingToUpdate = { ...bookingToCancel };
    handleCancelModalClose();
    
    const bookingDocRef = doc(db, 'bookings', bookingToUpdate.id);

    try {
        // Step 1: Update the document in Firestore
        await updateDoc(bookingDocRef, { status: 'canceled_by_user' });
        
        // Step 2: Try to send the notification email
        const emailResponse = await fetch(`${apiUrl}/api/email/send-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: user.email,
                type: 'canceled',
                bookingDetails: bookingToUpdate
            })
        });

        // Check if the email was sent successfully
        if (!emailResponse.ok) {
            // This is not a critical error, so we just log it and inform the user
            console.error("Failed to send cancellation email, but booking was cancelled.");
            alert("Booking was cancelled successfully, but we failed to send the notification email.");
        } else {
            alert("Booking cancelled successfully!");
        }

    } catch (error) {
        // This catch block now handles critical failures (like Firestore being down)
        console.error("Error during cancellation process:", error);
        // We add a message to inform the user that the primary action might have failed
        alert("A critical error occurred. The booking may not have been canceled. Please refresh and try again.");
    }
};

    const handleViewTicket = (booking) => { /* ... existing logic ... */
        setSelectedBooking(booking);
        setIsTicketModalOpen(true);
    };

    const renderBookings = () => {
        if (loading) {
            return <p className="text-center text-gray-500 mt-8">Loading your bookings...</p>;
        }
        if (bookingsToShow.length === 0) {
            return (
                <div className="text-center bg-white p-10 rounded-lg shadow-sm mt-8">
                    <h3 className="text-xl font-semibold text-gray-800">No {activeTab} bookings found</h3>
                    <p className="text-gray-500 mt-2">
                        {activeTab === 'upcoming' ? "Looks like you're all caught up!" : "Your past adventures will be shown here."}
                    </p>
                    {activeTab === 'upcoming' && <button onClick={() => navigate('/')} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-lg">Book a New Trip</button>}
                </div>
            );
        }
        return (
            <div className="space-y-6 mt-6">
                {bookingsToShow.map(booking => 
                    editingBookingId === booking.id ? (
                         <EditBookingForm key={`edit-${booking.id}`} editedData={editedData} onDataChange={setEditedData} onSave={() => handleSaveClick(booking.id)} onDiscard={() => setEditingBookingId(null)} />
                    ) : (
                         <BookingCard 
                            key={booking.id} 
                            booking={booking} 
                            onEdit={handleEditClick} 
                            onCancel={handleCancelClick} 
                            onViewTicket={handleViewTicket}
                            isPast={activeTab === 'past'}
                        />
                    )
                )}
            </div>
        );
    };
    
    return (
        <>
            <div className="min-h-screen bg-gray-50">
                <header className="bg-white shadow-sm sticky top-0 z-10">
                    <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-blue-600 cursor-pointer" onClick={() => navigate('/')}>TravelEase</h1>
                        <button onClick={() => navigate('/')} className="text-gray-600 hover:text-blue-600 px-4">← Back to Home</button>
                    </nav>
                </header>
                <main className="container mx-auto px-6 py-10">
                    <h2 className="text-4xl font-extrabold text-gray-900 mb-2">My Bookings</h2>
                    <p className="text-gray-600 mb-8">View and manage all your trips in one place.</p>
                    
                    {/* NEW: Tab Navigation */}
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('upcoming')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'upcoming' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            >
                                Upcoming
                            </button>
                            <button
                                onClick={() => setActiveTab('past')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'past' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            >
                                Past & Canceled
                            </button>
                        </nav>
                    </div>

                    {renderBookings()}
                </main>
            </div>
            
            <Modal isOpen={isCancelModalOpen} onClose={handleCancelModalClose} title="Confirm Cancellation">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Cancel Booking</h3>
                    <p className="mt-2 text-sm text-gray-500">Are you sure you want to cancel this booking? This action is permanent and cannot be undone.</p>
                </div>
                 <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                    <button type="button" onClick={confirmCancelBooking} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700">Confirm</button>
                    <button type="button" onClick={handleCancelModalClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0">Discard</button>
                </div>
            </Modal>
            
             {/* NEW: Revamped Ticket Modal */}
            <Modal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} title="">
                {selectedBooking && (
                    <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
                        <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                            <h3 className="text-2xl font-bold">{selectedBooking.routeName || selectedBooking.tourName || `${selectedBooking.origin} → ${selectedBooking.destination}`}</h3>
                            <p className="opacity-80">{selectedBooking.type.charAt(0).toUpperCase() + selectedBooking.type.slice(1)} Ticket</p>
                        </div>

                        <div className="p-6 flex flex-col md:flex-row gap-6">
                            <div className="flex-grow">
                                <h4 className="font-bold text-gray-700 mb-3">Passenger(s)</h4>
                                <ul className="space-y-2">
                                    {(Array.isArray(selectedBooking.passengers) ? selectedBooking.passengers : []).map((p, index) => (
                                        <li key={index} className="text-gray-800 font-medium">
                                            {p.firstName} {p.lastName}
                                            <span className="text-sm font-normal text-gray-500 ml-2">(Seat: {(selectedBooking.selectedSeats || [])[index] || 'N/A'})</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="border-t my-4"></div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Date</p>
                                        <p className="font-semibold text-gray-800">{selectedBooking.departureDate || selectedBooking.tourDate}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Total Price</p>
                                        <p className="font-semibold text-gray-800">₹{selectedBooking.price?.toLocaleString('en-IN') || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-shrink-0 text-center p-4 border-dashed border-l-2 border-gray-300">
                                <p className="text-gray-600 text-sm mb-2">Scan at Check-in</p>
                                <div className="bg-white p-2 inline-block rounded-lg shadow-inner">
                                    <QRCode value={selectedBooking.ticketCode || 'N/A'} size={128} />
                                </div>
                                <p className="text-gray-500 text-xs mt-2">Ticket Code</p>
                                <p className="text-lg font-bold text-gray-800 tracking-widest">{selectedBooking.ticketCode || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 text-right">
                            <button onClick={() => handleDownloadTicket(selectedBooking)} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 ml-auto">
                                <Download size={16}/>Download PDF
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default BookingHistory;