import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, doc, getDoc, addDoc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import Modal from '../components/Modal';
import BusSeatChart from '../components/BusSeatChart';
import { Bus, User, Calendar, ShieldCheck, CreditCard, Ticket, X, Gift, Loader2 } from 'lucide-react';
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
        {['Details', 'Passengers', 'Seats'].map((name, index) => (
            <React.Fragment key={name}>
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${index + 1 <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {index + 1}
                    </div>
                    <span className={`font-semibold transition-colors duration-300 ${index + 1 <= step ? 'text-blue-600' : 'text-gray-500'}`}>{name}</span>
                </div>
                {index < 2 && <div className="flex-1 h-1 bg-gray-200 mx-4 rounded-full"><div style={{ width: index + 1 < step ? '100%' : '0%' }} className={`h-1 rounded-full bg-blue-600 transition-all duration-500`} /></div>}
            </React.Fragment>
        ))}
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

const TourBookingForm = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const busId = searchParams.get('id');

    const [busData, setBusData] = useState(null);
    const [isFetching, setIsFetching] = useState(true);
    
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [bookedSeats, setBookedSeats] = useState([]);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [passengers, setPassengers] = useState([{ firstName: '', lastName: '', gender: 'Male', dob: '' }]);
    const [currentStep, setCurrentStep] = useState(1);

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
        const fetchBusDetails = async () => {
            if (!busId) {
                setValidationError("No bus ID provided.");
                setIsFetching(false);
                return;
            }
            try {
                const busDocRef = doc(db, 'buses', busId);
                const busDocSnap = await getDoc(busDocRef);
                if (busDocSnap.exists()) {
                    setBusData({ id: busDocSnap.id, ...busDocSnap.data() });
                } else {
                    setValidationError("Bus not found.");
                }
            } catch (error) {
                console.error("Error fetching bus details:", error);
                setValidationError("Failed to fetch bus details.");
            } finally {
                setIsFetching(false);
            }
        };
        fetchBusDetails();
    }, [busId]);

    const { baseTotal, totalFees, gstAmount, finalPrice } = useMemo(() => {
        if (!busData) return { baseTotal: 0, totalFees: 0, gstAmount: 0, finalPrice: 0 };

        const numTravelers = passengers.length;
        const base = (busData.price || 0) * numTravelers;
        const fees = ((busData.cleanlinessFare || 0) + (busData.maintenanceFare || 0) + (busData.hygieneFare || 0)) * numTravelers;
        const subtotal = base + fees;
        const gst = (subtotal * (busData.gst || 0)) / 100;
        const total = subtotal + gst - discount;

        return {
            baseTotal: base,
            totalFees: fees,
            gstAmount: gst,
            finalPrice: total > 0 ? total : 0,
        };
    }, [busData, passengers.length, discount]);

    const handleTravelerCountChange = (count) => {
        const newCount = Math.max(1, parseInt(count, 10) || 1);
        setSelectedSeats([]);
        setPassengers(current => {
            const newPassengers = [...current];
            while (newPassengers.length < newCount) {
                newPassengers.push({ firstName: '', lastName: '', gender: 'Male', dob: '' });
            }
            return newPassengers.slice(0, newCount);
        });
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) navigate('/login');
            else setUser(currentUser);
        });
        return () => unsubscribe();
    }, [navigate]);
    
    useEffect(() => {
        const fetchBookedSeats = async () => {
            if (!busData) return;
            const bookingsQuery = query(collection(db, "bookings"), where("busId", "==", busData.id), where("departureDate", "==", busData.date));
            const querySnapshot = await getDocs(bookingsQuery);
            const allBookedSeats = querySnapshot.docs.flatMap(doc => doc.data().selectedSeats || []);
            setBookedSeats(allBookedSeats);
        };
        fetchBookedSeats();
    }, [busData]);

    useEffect(() => {
        const passengersComplete = passengers.every(p => p.firstName && p.lastName && p.dob);
        const seatsSelected = selectedSeats.length === passengers.length && selectedSeats.length > 0;
        if (seatsSelected && passengersComplete) setCurrentStep(3);
        else if (passengersComplete) setCurrentStep(2);
        else setCurrentStep(1);
    }, [passengers, selectedSeats]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const bannerQuery = query(collection(db, "banners"), where("isActive", "==", true), where("appliesTo", "in", ["all", "bus"]));
                const bannerSnapshot = await getDocs(bannerQuery);
                const activeBanners = bannerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPopupBanners(activeBanners);

                const couponQuery = query(collection(db, "coupons"), where("isActive", "==", true), where("appliesTo", "in", ["all", "bus"]));
                const couponSnapshot = await getDocs(couponQuery);
                const activeCoupons = couponSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAvailableCoupons(activeCoupons);
            } catch (err) {
                console.error("Failed to fetch promotions:", err);
            }
        };
        fetchData();
    }, []);
    
    useEffect(() => {
        if (!user) return;
        const checkFirstBooking = async () => {
            const bookingsQuery = query(collection(db, "bookings"), where("userId", "==", user.uid), limit(1));
            const snapshot = await getDocs(bookingsQuery);
            if (snapshot.empty) setIsFirstTimeUser(true);
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
        setDismissedBanners(prev => prev.find(b => b.id === bannerToDismiss.id) ? prev : [...prev, bannerToDismiss]);
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
            if (couponData.appliesTo !== 'all' && couponData.appliesTo !== 'bus') {
                throw new Error(`Coupon "${code}" is not valid for bus bookings.`);
            }
            const baseTotalForCoupon = (busData.price || 0) * passengers.length;
            let calculatedDiscount = 0;
            if (couponData.discountType === 'percentage') {
                calculatedDiscount = baseTotalForCoupon * (couponData.discountValue / 100);
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

    const handleSeatSelect = (seatNumber) => {
        setSelectedSeats(prevSeats => {
            if (prevSeats.includes(seatNumber)) {
                return prevSeats.filter(s => s !== seatNumber);
            } else {
                if (prevSeats.length < passengers.length) {
                    return [...prevSeats, seatNumber];
                }
                setValidationError(`You can only select ${passengers.length} seat(s).`);
                return prevSeats;
            }
        });
    };

    const handlePassengerChange = (index, event) => {
        const { name, value } = event.target;
        const updatedPassengers = [...passengers];
        updatedPassengers[index] = { ...updatedPassengers[index], [name]: value };
        setPassengers(updatedPassengers);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationError('');
        if (selectedSeats.length !== passengers.length) return setValidationError(`Please select exactly ${passengers.length} seat(s).`);
        for (const passenger of passengers) {
            if (!passenger.firstName || !passenger.lastName || !passenger.dob) {
                return setValidationError('Please fill in all details for each passenger.');
            }
        }

        setLoading(true);
        try {
            const uniqueTicketCode = await generateUniqueTicketCode();
            const newBusBooking = {
                userId: user.uid,
                userEmail: user.email,
                ticketCode: uniqueTicketCode,
                passengers,
                busId: busData.id,
                routeName: `${busData.originCity} to ${busData.destinationCity}`,
                operator: busData.operator,
                travelers: passengers.length,
                departureDate: busData.date,
                bookedAt: serverTimestamp(),
                price: finalPrice,
                status: 'active',
                type: 'bus',
                selectedSeats,
                fareDetails: {
                    base: baseTotal,
                    fees: totalFees,
                    gst: gstAmount,
                    discount: discount,
                }
            };
            await addDoc(collection(db, "bookings"), newBusBooking);
            
            // Send confirmation email
            await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/email/send-confirmation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: user.email,
                    subject: `Your Bus Booking for "${newBusBooking.operator}" is Confirmed!`,
                    bookingDetails: newBusBooking
                })
            });

            setIsSuccessModalOpen(true);
        } catch (error) {
            console.error("Error creating bus booking: ", error);
            setValidationError("Failed to create bus booking. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    
    if (isFetching) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={32}/></div>;
    if (!busData) return <div className="min-h-screen flex items-center justify-center"><p>{validationError}</p></div>;

    return (
        <>
            <RandomBannerPopup banner={currentPopupBanner} isVisible={isBannerVisible} onDismiss={handleDismissBanner} position={bannerPosition} />
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
                                <FormSection title="Your Selected Bus" icon={<Bus size={24}/>}>
                                    <div className="flex justify-between items-center text-lg">
                                        <div>
                                            <p className="font-semibold text-gray-800">{busData.operator}</p>
                                            <p className="text-sm text-gray-500">{busData.originCity} to {busData.destinationCity}</p>
                                        </div>
                                        <p className="font-bold text-blue-600">{busData.busType}</p>
                                    </div>
                                </FormSection>

                                <FormSection title="Trip Details" icon={<Calendar size={24}/>}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label>Date of Travel</label>
                                            <input type="text" value={busData.date || ''} readOnly />
                                        </div>
                                        <div>
                                            <label htmlFor="travelers">Number of Travelers</label>
                                            <input type="number" id="travelers" min="1" value={passengers.length} onChange={(e) => handleTravelerCountChange(e.target.value)} required/>
                                        </div>
                                    </div>
                                </FormSection>
                                
                                {passengers.map((passenger, index) => (
                                    <FormSection key={index} title={`Passenger ${index + 1}`} icon={<User size={24}/>}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label htmlFor={`firstName-${index}`}>First Name</label><input type="text" id={`firstName-${index}`} name="firstName" value={passenger.firstName} onChange={(e) => handlePassengerChange(index, e)} required /></div>
                                            <div><label htmlFor={`lastName-${index}`}>Last Name</label><input type="text" id={`lastName-${index}`} name="lastName" value={passenger.lastName} onChange={(e) => handlePassengerChange(index, e)} required /></div>
                                            <div><label htmlFor={`gender-${index}`}>Gender</label><select id={`gender-${index}`} name="gender" value={passenger.gender} onChange={(e) => handlePassengerChange(index, e)}><option>Male</option><option>Female</option><option>Other</option></select></div>
                                            <div><label htmlFor={`dob-${index}`}>Date of Birth</label><input type="date" id={`dob-${index}`} name="dob" value={passenger.dob} onChange={(e) => handlePassengerChange(index, e)} required /></div>
                                        </div>
                                    </FormSection>
                                ))}

                                <FormSection title="Select Your Seats" icon={<ShieldCheck size={24}/>}>
                                    <BusSeatChart selectedSeats={selectedSeats} onSeatSelect={handleSeatSelect} bookedSeats={bookedSeats} totalSeats={37} />
                                </FormSection>
                            </div>
                            
                            <aside className="lg:col-span-1">
                                <div className="sticky top-28 space-y-6">
                                    <div className="bg-white p-6 rounded-xl shadow-md">
                                        <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3">Booking Summary</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between"><span className="text-gray-600">Route:</span><span className="font-semibold text-gray-800">{busData.originCity} to {busData.destinationCity}</span></div>
                                            <div className="flex justify-between"><span className="text-gray-600">Travelers:</span><span className="font-semibold text-gray-800">{passengers.length}</span></div>
                                            <div className="flex justify-between"><span className="text-gray-600">Travel Date:</span><span className="font-semibold text-gray-800">{busData.date}</span></div>
                                            <div className="flex justify-between"><span className="text-gray-600">Seats:</span><span className="font-semibold text-gray-800 text-right">{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}</span></div>
                                            <div className="border-t my-4 pt-4 space-y-2 text-sm">
                                                <div className="flex justify-between"><span>Base Fare</span><span>₹{baseTotal.toLocaleString('en-IN')}</span></div>
                                                {(busData.cleanlinessFare > 0) && <div className="flex justify-between"><span>Cleanliness Fare</span><span>+ ₹{(busData.cleanlinessFare * passengers.length).toLocaleString('en-IN')}</span></div>}
                                                {(busData.maintenanceFare > 0) && <div className="flex justify-between"><span>Maintenance Fare</span><span>+ ₹{(busData.maintenanceFare * passengers.length).toLocaleString('en-IN')}</span></div>}
                                                {(busData.hygieneFare > 0) && <div className="flex justify-between"><span>Hygiene Fare</span><span>+ ₹{(busData.hygieneFare * passengers.length).toLocaleString('en-IN')}</span></div>}
                                                <div className="flex justify-between"><span>GST ({busData.gst || 0}%)</span><span>+ ₹{gstAmount.toLocaleString('en-IN')}</span></div>
                                                {discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>- ₹{discount.toLocaleString('en-IN')}</span></div>}
                                                <div className="flex justify-between text-xl mt-2"><span className="font-semibold">Total Price:</span><span className="font-bold text-blue-600">₹{finalPrice.toLocaleString('en-IN')}</span></div>
                                            </div>
                                        </div>
                                        <button type="submit" disabled={loading || isFetching} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg text-lg flex items-center justify-center gap-2">
                                            <CreditCard size={20}/> {loading ? 'Processing...' : 'Confirm & Book'}
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
            
            <Modal isOpen={isSuccessModalOpen} onClose={() => navigate('/history')} title="Bus Booking Confirmed!">
                <p>Your booking for the {busData?.operator} bus has been successfully confirmed. A confirmation email has been sent to {user?.email}.</p>
            </Modal>
            <Modal isOpen={!!validationError} onClose={() => setValidationError('')} title="Booking Error" onConfirm={() => setValidationError('')}>
                <p>{validationError}</p>
            </Modal>
        </>
    );
};

export default TourBookingForm;