import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, doc, getDoc, addDoc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import SeatChart from '../components/SeatChart';
import Modal from '../components/Modal';
import { Plane, User, ShieldCheck, CreditCard, Users, Briefcase, CheckCircle, Ticket, X, Gift, Loader2, ArrowRight, PlusCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Sub-Components ---
const FormSection = ({ title, icon, children }) => (
    <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="font-bold text-xl text-gray-800 mb-4 border-b pb-3 flex items-center gap-2">{icon}{title}</h3>
        {children}
    </div>
);

const ProgressBar = ({ step }) => (
    <div className="flex justify-between items-center mb-8 bg-gray-50 p-4 rounded-xl shadow-inner">
        {['Details', 'Passenger', 'Seat'].map((name, index) => (
            <React.Fragment key={name}>
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${index + 1 <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {index + 1}
                    </div>
                    <span className={`font-semibold transition-colors duration-300 ${index + 1 <= step ? 'text-blue-600' : 'text-gray-500'}`}>{name}</span>
                </div>
                {index < 2 && <div className="flex-1 h-1 bg-gray-200 mx-4"><div className={`h-1 rounded-full transition-all duration-500 ${index + 1 < step ? 'bg-blue-600 w-full' : 'bg-transparent w-0'}`} style={{ transitionProperty: 'width, background-color' }} /></div>}
            </React.Fragment>
        ))}
    </div>
);

const ClassSelector = ({ travelClass, price, icon, selected, onSelect }) => (
    <div
        onClick={() => onSelect(travelClass.toLowerCase())}
        className={`cursor-pointer border-2 rounded-lg p-4 flex justify-between items-center transition-all duration-200 ${selected ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-gray-300 bg-white hover:border-indigo-400'}`}
    >
        <div>
            <div className="flex items-center gap-2">
                {icon}
                <h4 className="font-bold text-gray-800">{travelClass}</h4>
            </div>
            <p className="text-sm text-gray-600">₹{price ? price.toLocaleString('en-IN') : '0'} / traveler</p>
        </div>
        {selected && <CheckCircle className="text-indigo-600" />}
    </div>
);

const RandomBannerPopup = ({ banner, isVisible, onDismiss, position }) => (
    <AnimatePresence>
        {isVisible && banner && (
            <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{ position: 'fixed', top: position.top, left: position.left, transform: 'translate(-50%, -50%)', zIndex: 100 }}
                className="w-full max-w-xs bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl shadow-2xl overflow-hidden"
            >
                <a href={banner.redirectUrl} target="_blank" rel="noopener noreferrer" className="block p-4">
                    <img src={banner.imageUrl} alt="Offer Banner" className="w-full h-32 object-cover rounded-lg mb-3" />
                    <div className="text-center">
                        <p className="font-bold text-lg">Special Offer!</p>
                        <p className="text-sm opacity-90 mt-1">Click to learn more about this exclusive deal.</p>
                    </div>
                </a>
                <button onClick={() => onDismiss(banner)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/30 hover:bg-black/50 transition">
                    <X size={18} />
                </button>
            </motion.div>
        )}
    </AnimatePresence>
);

const PermanentBanner = ({ banner }) => (
    <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-xl shadow-lg mb-8 overflow-hidden"
    >
        <a href={banner.redirectUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4">
            <img src={banner.imageUrl} alt="Offer Banner" className="w-24 h-12 object-cover rounded-md flex-shrink-0 bg-white/20" />
            <div className="flex-grow">
                <p className="font-bold">Special Offer!</p>
                <p className="text-sm opacity-90">This is a limited-time offer just for you!</p>
            </div>
        </a>
    </motion.div>
);

const BookingForm = () => {
    const navigate = useNavigate();
    const { to } = useParams();
    const [searchParams] = useSearchParams();
    const flightId = searchParams.get('id');
    const bookingType = searchParams.get('type') || 'flight';

    const [flightData, setFlightData] = useState(null);
    const [isFetching, setIsFetching] = useState(true);
    
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [bookedSeats, setBookedSeats] = useState([]);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [passengers, setPassengers] = useState([{ firstName: '', lastName: '', gender: 'Male', dob: '', passportNumber: '', passportExpiry: '' }]);
    const [selectedClass, setSelectedClass] = useState('economy');
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [couponMessage, setCouponMessage] = useState({ type: '', text: '' });
    
    const [popupBanners, setPopupBanners] = useState([]);
    const [dismissedBanners, setDismissedBanners] = useState([]);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const [isBannerVisible, setIsBannerVisible] = useState(false);
    const [bannerPosition, setBannerPosition] = useState({ top: '50%', left: '50%' });
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const generateUniqueTicketCode = async () => {
        let ticketCode;
        let isUnique = false;
        while (!isUnique) {
            ticketCode = String(Math.floor(100000 + Math.random() * 900000));
            const q = query(collection(db, "bookings"), where("ticketCode", "==", ticketCode));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) isUnique = true;
        }
        return ticketCode;
    };

    useEffect(() => {
        const fetchFlightDetails = async () => {
            if (!flightId) {
                setValidationError("No flight ID provided in URL.");
                setIsFetching(false);
                return;
            }
            try {
                const flightDocRef = doc(db, 'flights', flightId);
                const flightDocSnap = await getDoc(flightDocRef);

                if (flightDocSnap.exists()) {
                    setFlightData({ id: flightDocSnap.id, ...flightDocSnap.data() });
                } else {
                    setValidationError("The requested flight could not be found.");
                }
            } catch (error) {
                console.error("Error fetching flight details:", error);
                setValidationError("An error occurred while fetching flight details.");
            } finally {
                setIsFetching(false);
            }
        };
        fetchFlightDetails();
    }, [flightId]);

    const pricePerTraveler = useMemo(() => {
        if (!flightData) return 0;
        return selectedClass === 'business' ? flightData.businessPrice : flightData.economyPrice;
    }, [selectedClass, flightData]);
    
    const { gstLabel, gstRate, gstAmount, finalPrice } = useMemo(() => {
        if (!flightData) return { gstLabel: 'GST', gstRate: 0, gstAmount: 0, finalPrice: 0 };

        let gst = 0;
        let label = 'GST';
        if (flightData.flightType === 'international') {
            gst = selectedClass === 'business' ? flightData.businessInternationalGst : flightData.economyInternationalGst;
            label = 'Intl. GST';
        } else {
            gst = selectedClass === 'business' ? flightData.businessDomesticGst : flightData.economyDomesticGst;
            label = 'Dom. GST';
        }

        const baseTotal = pricePerTraveler * passengers.length;
        const gstValue = (baseTotal * gst) / 100;
        const total = baseTotal + gstValue - discount;
        
        return { gstLabel: label, gstRate: gst || 0, gstAmount: gstValue || 0, finalPrice: total > 0 ? total : 0 };
    }, [pricePerTraveler, discount, flightData, passengers, selectedClass]);

    const handleClassChange = (newClass) => {
        if (newClass !== selectedClass) {
            setSelectedClass(newClass);
            setSelectedSeats([]);
            setValidationError('');
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) setUser(currentUser);
            else navigate('/login');
        });
        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        const fetchBookedSeats = async () => {
            if (!flightData) return;
            const bookingsQuery = query(collection(db, "bookings"), where("flightId", "==", flightData.id), where("departureDate", "==", flightData.date));
            const querySnapshot = await getDocs(bookingsQuery);
            const allBookedSeats = querySnapshot.docs.flatMap(doc => doc.data().selectedSeats || []);
            setBookedSeats(allBookedSeats);
        };
        fetchBookedSeats();
    }, [flightData]);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const bannerQuery = query(collection(db, "banners"), where("isActive", "==", true), where("appliesTo", "in", ["all", bookingType]));
                const bannerSnapshot = await getDocs(bannerQuery);
                const activeBanners = bannerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPopupBanners(activeBanners);

                const couponQuery = query(collection(db, "coupons"), where("isActive", "==", true), where("appliesTo", "in", ["all", bookingType]));
                const couponSnapshot = await getDocs(couponQuery);
                const activeCoupons = couponSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAvailableCoupons(activeCoupons);
            } catch (err) {
                console.error("Failed to fetch promotions:", err);
            }
        };
        fetchData();
    }, [bookingType]);
    
    useEffect(() => {
        if (!user) return;
        const checkFirstBooking = async () => {
            const bookingsQuery = query(collection(db, "bookings"), where("userId", "==", user.uid), limit(1));
            const snapshot = await getDocs(bookingsQuery);
            if (snapshot.empty) {
                setIsFirstTimeUser(true);
            }
        };
        checkFirstBooking();
    }, [user]);

    useEffect(() => {
        if (popupBanners.length === 0) {
            setIsBannerVisible(false);
            return;
        }
        const setRandomPosition = () => {
            const top = Math.floor(20 + Math.random() * 60);
            const left = Math.floor(20 + Math.random() * 60);
            setBannerPosition({ top: `${top}%`, left: `${left}%` });
        };
        setRandomPosition();
        setIsBannerVisible(true);
        const timer = setInterval(() => {
            setIsBannerVisible(false);
            setTimeout(() => {
                setCurrentBannerIndex(prevIndex => (prevIndex + 1) % popupBanners.length);
                setRandomPosition();
                setIsBannerVisible(true);
            }, 2000);
        }, 5000);
        return () => clearInterval(timer);
    }, [popupBanners]);
    
    const currentPopupBanner = popupBanners[currentBannerIndex];
    
    const handleDismissBanner = (bannerToDismiss) => {
        setDismissedBanners(prev => {
            if (prev.find(b => b.id === bannerToDismiss.id)) return prev;
            return [...prev, bannerToDismiss];
        });
        setPopupBanners(prev => prev.filter(b => b.id !== bannerToDismiss.id));
        setIsBannerVisible(false);
    };

    const handleApplyCoupon = async (codeToApply) => {
        const code = (codeToApply || couponCode).toUpperCase();
        if (!code) return setCouponMessage({ type: 'error', text: 'Please enter a coupon code.' });
        setCouponMessage({ type: 'loading', text: 'Validating...' });
        setDiscount(0);
        try {
            const q = query(collection(db, "coupons"), where("code", "==", code), where("isActive", "==", true));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) throw new Error("Invalid or expired coupon code.");
            const couponData = querySnapshot.docs[0].data();
            if (couponData.appliesTo !== 'all' && couponData.appliesTo !== bookingType) {
                throw new Error(`Coupon "${code}" is not valid for ${bookingType} bookings.`);
            }
            const baseTotal = pricePerTraveler * passengers.length;
            let calculatedDiscount = 0;
            if (couponData.discountType === 'percentage') {
                calculatedDiscount = baseTotal * (couponData.discountValue / 100);
            } else {
                calculatedDiscount = couponData.discountValue;
            }
            setDiscount(calculatedDiscount);
            setCouponMessage({ type: 'success', text: `Success! ₹${calculatedDiscount.toLocaleString('en-IN')} discount applied.` });
        } catch (err) {
            setDiscount(0);
            setCouponMessage({ type: 'error', text: err.message });
        }
    };

    const handleCouponClick = (couponCode) => {
        setCouponCode(couponCode);
        handleApplyCoupon(couponCode);
    };

    const handleRemoveCoupon = () => {
        setDiscount(0);
        setCouponCode('');
        setCouponMessage({ type: '', text: '' });
    };

    const currentStep = useMemo(() => {
        // --- UPDATED: Check all passengers, not just the first one ---
        const passengersComplete = passengers.every(p => p.firstName && p.lastName && p.dob && p.passportNumber && p.passportExpiry);
        const seatsSelected = selectedSeats.length === passengers.length;
        if (seatsSelected && passengersComplete) return 3;
        if (passengersComplete) return 2;
        return 1;
    }, [passengers, selectedSeats]);

    const handlePassengerChange = (index, event) => {
        const { name, value } = event.target;
        const updated = [...passengers];
        updated[index] = { ...updated[index], [name]: value };
        setPassengers(updated);
    };

    // --- NEW: Functions to add and remove passengers ---
    const handleAddPassenger = () => {
        setPassengers(prev => [...prev, { firstName: '', lastName: '', gender: 'Male', dob: '', passportNumber: '', passportExpiry: '' }]);
    };

    const handleRemovePassenger = (index) => {
        if (passengers.length > 1) { // Prevent removing the last passenger
            setPassengers(prev => prev.filter((_, i) => i !== index));
            // Also remove the last selected seat if it corresponds to the removed passenger
            setSelectedSeats(prev => prev.slice(0, passengers.length - 1));
        }
    };
    
    // --- UPDATED: `handleSeatSelect` now correctly handles multiple seats ---
    const handleSeatSelect = (seatNumber) => {
        setSelectedSeats(prevSelected => {
            const newSelected = [...prevSelected];
            const seatIndex = newSelected.indexOf(seatNumber);

            if (seatIndex > -1) {
                // If seat is already selected, unselect it
                newSelected.splice(seatIndex, 1);
            } else {
                // If not selected, add it, but only if we haven't reached the passenger limit
                if (newSelected.length < passengers.length) {
                    newSelected.push(seatNumber);
                } else {
                    setValidationError(`You can only select ${passengers.length} seat(s).`);
                }
            }
            return newSelected;
        });
        // Clear validation error if the selection is now valid
        if (selectedSeats.length < passengers.length) {
            setValidationError('');
        }
    };

    // --- UPDATED: `handleSubmit` has corrected logic for booking and email sending ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationError('');

        if (!user) return setValidationError('You must be logged in to book.');
        if (!flightData) return setValidationError('Flight data is missing.');
        if (selectedSeats.length !== passengers.length) {
            return setValidationError(`Please select ${passengers.length} seat(s).`);
        }

        // Validate all passengers
        for (const passenger of passengers) {
            if (!passenger.firstName || !passenger.lastName || !passenger.dob || !passenger.passportNumber || !passenger.passportExpiry) {
                return setValidationError('Please fill in all details for every passenger.');
            }
        }
        
        // Validate seat class for all selected seats
        const businessRows = [1, 2, 3];
        for (const seat of selectedSeats) {
            const row = parseInt((seat || '0').match(/\d+/)[0], 10);
            const seatClass = businessRows.includes(row) ? 'business' : 'economy';
            if (seatClass !== selectedClass) {
                return setValidationError(`Seat ${seat} is in ${seatClass} class. Please select only ${selectedClass} class seats.`);
            }
        }
        
        setLoading(true);

        try {
            const ticketCode = await generateUniqueTicketCode();
            const newBooking = {
                userId: user.uid, userEmail: user.email, passengers, flightId: flightData.id,
                origin: flightData.originCity,
                destination: flightData.destinationCity,
                travelers: passengers.length, 
                departureDate: flightData.date, 
                bookedAt: serverTimestamp(),
                selectedSeats, 
                status: 'active', 
                ticketCode, 
                price: finalPrice, 
                class: selectedClass,
                type: 'flight', 
                airline: flightData.airline, 
                flightNumber: flightData.flightNumber,
                departureTime: flightData.departureTime, 
                gate: flightData.gate || null,
                gstInfo: { type: gstLabel, rate: gstRate, amount: gstAmount },
                discountInfo: { code: couponCode, amount: discount }
            };

            // 1. Save the booking to the database and WAIT for it to complete.
            await addDoc(collection(db, 'bookings'), newBooking);

            // 2. NOW that the booking is saved, show the success message to the user.
            setIsSuccessModalOpen(true);

            // 3. Send the email in the background without waiting (fire-and-forget).
            fetch(`${apiUrl}/api/email/send-confirmation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: user.email,
                    subject: `Your Flight Booking for "${newBooking.airline}" is Confirmed!`,
                    bookingDetails: newBooking
                })
            }).catch(error => {
                // Log any email errors for your own records. The user is not affected.
                console.error("Background email sending failed:", error);
            });

        } catch (err) {
            // This block will run if the database save (addDoc) fails.
            console.error('Error creating flight booking: ', err);
            setValidationError('Failed to create booking. Please try again.');
        } finally {
            // This will run regardless of success or failure.
            setLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="flex items-center gap-4 text-xl font-semibold text-gray-600">
                    <Loader2 className="animate-spin" size={32} />
                    <span>Loading Booking Details...</span>
                </div>
            </div>
        );
    }

    if (!flightData) {
        return (
             <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600">Error</h2>
                    <p className="text-gray-600 mt-2">{validationError || "Could not load flight data."}</p>
                    <button onClick={() => navigate('/')} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">Go to Homepage</button>
                </div>
            </div>
        )
    }

    return (
        <>
            <RandomBannerPopup 
                banner={currentPopupBanner} 
                isVisible={isBannerVisible} 
                onDismiss={handleDismissBanner} 
                position={bannerPosition}
            />
            <div className="min-h-screen bg-gray-100">
                <header className="bg-white shadow-sm sticky top-0 z-40">
                   <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-blue-600 cursor-pointer" onClick={() => navigate('/')}>TravelEase</h1>
                        <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-blue-600 px-4 font-semibold">← Back to Results</button>
                    </nav>
                </header>
                <main className="container mx-auto px-6 py-12">
                    <div className="space-y-4 mb-8">
                        {dismissedBanners.map(banner => <PermanentBanner key={banner.id} banner={banner} />)}
                    </div>
                    <ProgressBar step={currentStep} />
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            <div className="lg:col-span-2 space-y-6">
                                <FormSection title="Your Selected Flight" icon={<Plane size={24} />}>
                                    <div className="flex justify-between items-center text-lg">
                                        <span className="font-semibold text-gray-700">{flightData.originCity}</span>
                                        <ArrowRight className="text-gray-400" />
                                        <span className="font-semibold text-gray-700">{flightData.destinationCity}</span>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-2">{flightData.airline} - {flightData.flightNumber} • Departs {flightData.departureTime || '—'}</div>
                                </FormSection>
                                <FormSection title="Select Travel Class" icon={<Briefcase size={24} />}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <ClassSelector travelClass="Economy" price={flightData.economyPrice} icon={<Users size={20} className="text-gray-600" />} selected={selectedClass === 'economy'} onSelect={handleClassChange} />
                                        <ClassSelector travelClass="Business" price={flightData.businessPrice} icon={<Briefcase size={20} className="text-gray-600" />} selected={selectedClass === 'business'} onSelect={handleClassChange} />
                                    </div>
                                </FormSection>
                                <FormSection title="Passenger Details" icon={<User size={24} />}>
                                    {/* --- UPDATED: Passenger form now maps over the passengers array --- */}
                                    {passengers.map((passenger, index) => (
                                        <div key={index} className={`p-4 border rounded-lg ${index > 0 ? 'mt-6' : ''}`}>
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-semibold text-lg text-gray-700">Passenger {index + 1}</h4>
                                                {index > 0 && (
                                                    <button type="button" onClick={() => handleRemovePassenger(index)} className="text-red-500 hover:text-red-700">
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div><label htmlFor={`firstName-${index}`}>First Name</label><input type="text" id={`firstName-${index}`} name="firstName" value={passenger.firstName} onChange={(e) => handlePassengerChange(index, e)} required /></div>
                                                <div><label htmlFor={`lastName-${index}`}>Last Name</label><input type="text" id={`lastName-${index}`} name="lastName" value={passenger.lastName} onChange={(e) => handlePassengerChange(index, e)} required /></div>
                                                <div><label htmlFor={`gender-${index}`}>Gender</label><select id={`gender-${index}`} name="gender" value={passenger.gender} onChange={(e) => handlePassengerChange(index, e)}><option>Male</option><option>Female</option><option>Other</option></select></div>
                                                <div><label htmlFor={`dob-${index}`}>Date of Birth</label><input type="date" id={`dob-${index}`} name="dob" value={passenger.dob} onChange={(e) => handlePassengerChange(index, e)} required /></div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <h5 className="font-semibold text-md text-gray-700 mb-3">Passport Information</h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div><label htmlFor={`passportNumber-${index}`}>Passport Number</label><input type="text" id={`passportNumber-${index}`} name="passportNumber" value={passenger.passportNumber} onChange={(e) => handlePassengerChange(index, e)} required /></div>
                                                    <div><label htmlFor={`passportExpiry-${index}`}>Expiry Date</label><input type="date" id={`passportExpiry-${index}`} name="passportExpiry" value={passenger.passportExpiry} onChange={(e) => handlePassengerChange(index, e)} required /></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={handleAddPassenger}
                                        className="mt-4 flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-800"
                                    >
                                        <PlusCircle size={18} /> Add another passenger
                                    </button>
                                </FormSection>
                                <FormSection title="Select Your Seat" icon={<ShieldCheck size={24} />}>
                                    <p className="text-sm text-gray-600 mb-4">Please select {passengers.length} seat(s) for your party.</p>
                                    <SeatChart selectedSeats={selectedSeats} onSeatSelect={handleSeatSelect} bookedSeats={bookedSeats} isFlight={true} selectedClass={selectedClass} />
                                </FormSection>
                            </div>
                            <aside className="lg:col-span-1">
                                <div className="sticky top-28 space-y-6">
                                    <div className="bg-white p-6 rounded-xl shadow-md">
                                        <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3">Booking Summary</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between"><span className="text-gray-600">Booking Date:</span><span className="font-semibold text-gray-800">{new Date().toLocaleDateString('en-IN')}</span></div>
                                            <div className="flex justify-between"><span className="text-gray-600">Travel Date:</span><span className="font-semibold text-gray-800">{flightData.date}</span></div>
                                            <div className="flex justify-between"><span className="text-gray-600">From:</span><span className="font-semibold text-gray-800">{flightData.originCity}</span></div>
                                            <div className="flex justify-between"><span className="text-gray-600">To:</span><span className="font-semibold text-gray-800">{flightData.destinationCity}</span></div>
                                            <div className="flex justify-between"><span className="text-gray-600">Travelers:</span><span className="font-semibold text-gray-800">{passengers.length}</span></div>
                                            <div className="flex justify-between"><span className="text-gray-600">Class:</span><span className="font-semibold text-gray-800 capitalize">{selectedClass}</span></div>
                                            <div className="border-t my-4 pt-4 space-y-2">
                                                <div className="flex justify-between text-sm text-gray-600"><span>Base Fare x {passengers.length}</span><span>₹{(pricePerTraveler * passengers.length).toLocaleString('en-IN')}</span></div>
                                                <div className="flex justify-between text-sm text-gray-600"><span>{gstLabel} ({gstRate}%)</span><span>+ ₹{gstAmount.toLocaleString('en-IN')}</span></div>
                                                {discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>- ₹{discount.toLocaleString('en-IN')}</span></div>}
                                                <div className="flex justify-between text-xl mt-2"><span className="text-gray-700 font-semibold">Total Price:</span><span className="font-bold text-blue-600">₹{finalPrice.toLocaleString('en-IN')}</span></div>
                                            </div>
                                        </div>
                                        <button type="submit" disabled={loading || isFetching} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg text-lg flex items-center justify-center gap-2">
                                            <CreditCard size={20} /> {loading ? 'Processing...' : 'Confirm & Book'}
                                        </button>
                                    </div>
                                    <div className="bg-white p-6 rounded-xl shadow-md">
                                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Ticket size={20} /> Have a coupon?</h4>
                                        
                                        {discount > 0 && couponMessage.type === 'success' ? (
                                            <div className="text-center">
                                                <p className="text-sm text-green-600 font-semibold">{couponMessage.text}</p>
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveCoupon}
                                                    className="mt-2 text-xs text-red-500 hover:text-red-700 font-semibold"
                                                >
                                                    Remove Coupon
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={couponCode}
                                                        onChange={(e) => setCouponCode(e.target.value)}
                                                        placeholder="Enter code"
                                                        className="w-full"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApplyCoupon()}
                                                        className="bg-gray-800 text-white px-4 rounded-lg font-semibold hover:bg-black"
                                                    >
                                                        Apply
                                                    </button>
                                                </div>
                                                {couponMessage.text && <p className={`text-sm mt-2 ${couponMessage.type === 'error' ? 'text-red-600' : ''}`}>{couponMessage.text}</p>}
                                            </>
                                        )}

                                        <div className="mt-4 pt-4 border-t">
                                            <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Available Offers</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {isFirstTimeUser && availableCoupons.find(c => c.code === 'TRAVELEASE') && (
                                                    <button type="button" onClick={() => handleCouponClick('TRAVELEASE')} className="flex items-center gap-2 text-xs bg-green-100 text-green-800 font-semibold px-2 py-1 rounded-full hover:bg-green-200 transition">
                                                        <Gift size={14} /> 
                                                        <span>FIRST BOOKING</span>
                                                        <span className="font-normal opacity-75">(₹{availableCoupons.find(c=>c.code === 'TRAVELEASE')?.discountValue || '...'} OFF)</span>
                                                    </button>
                                                )}
                                                {availableCoupons.filter(c => c.code !== 'TRAVELEASE').map(coupon => (
                                                    <button key={coupon.id} type="button" onClick={() => handleCouponClick(coupon.code)} className="flex items-center gap-2 text-xs bg-gray-100 text-gray-800 font-semibold px-2 py-1 rounded-full hover:bg-gray-200 transition">
                                                        <span>{coupon.code}</span>
                                                        <span className="font-normal opacity-75">
                                                            ({coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`} OFF)
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </form>
                </main>
            </div>
            <style>{`
                label { display: block; font-size: 0.875rem; font-weight: 500; color: #4B5563; margin-bottom: 0.25rem; }
                input, select { width: 100%; padding: 0.5rem 1rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; }
                input[readonly] { background-color: #F9FAFB; color: #6B7280; }
            `}</style>
            <Modal isOpen={isSuccessModalOpen} onClose={() => navigate('/history')} title="Booking Confirmed!">
                <p>Your booking for the flight to {flightData?.destinationCity || to} has been successfully confirmed. A confirmation email has been sent to {user?.email}.</p>
            </Modal>
            <Modal isOpen={!!validationError} onClose={() => setValidationError('')} title="Booking Error" onConfirm={() => setValidationError('')}>
                <p>{validationError}</p>
            </Modal>
        </>
    );
};

export default BookingForm;