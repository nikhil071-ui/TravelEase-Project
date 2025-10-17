import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import SearchInput from '../components/SearchInput';
import Modal from '../components/Modal';
import { Calendar, Plane, Bus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

// --- Reusable Child Components ---
const ProfileAvatar = ({ user }) => {
  const navigate = useNavigate();
  const getInitials = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return '?';
  };
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate('/profile')}
      className="w-11 h-11 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      {user?.photoURL ? (
        <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full" />
      ) : (
        <span>{getInitials()}</span>
      )}
    </motion.button>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    className="bg-white p-8 rounded-2xl shadow-lg text-center hover:shadow-2xl transform hover:-translate-y-3 transition-all duration-300 ease-in-out border border-gray-100"
  >
    <div className="flex justify-center mb-5 text-blue-600">{icon}</div>
    <h3 className="text-2xl font-bold text-gray-800 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </motion.div>
);

const Home = () => {
  const navigate = useNavigate();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [user, setUser] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [transportType, setTransportType] = useState('Flights');
  const [allLocations, setAllLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchLocations = async () => {
      try {
       const response = await fetch(`${apiUrl}/api/unique-locations`);
        setAllLocations(data);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      }
    };
    fetchLocations();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setValidationError('');
    if (!from || !to || !date) {
      setValidationError("Please fill in the 'From', 'To', and 'Date' fields.");
      return;
    }
    if (from.toLowerCase() === to.toLowerCase()) {
      setValidationError("The 'From' and 'To' locations cannot be the same.");
      return;
    }
    setLoading(true);
    try {
      const collectionName = transportType.toLowerCase();
      const q = query(
        collection(db, collectionName),
        where('originCity_lowercase', '==', from.toLowerCase()),
        where('destinationCity_lowercase', '==', to.toLowerCase()),
        where('date', '==', date),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setValidationError(`Sorry, no ${transportType.toLowerCase()} found for this route on ${date}.`);
        setLoading(false);
        return;
      }

      const searchPath = transportType === 'Buses' ? '/search-bus' : '/search';
      navigate(`${searchPath}?from=${from}&to=${to}&date=${date}`);
    } catch (error) {
      console.error('Error checking route existence:', error);
      setValidationError('An error occurred while searching. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* --- HEADER --- */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm transition-all duration-300">
          <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
            <motion.h1
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate('/')}
              className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 cursor-pointer"
            >
              TravelEase
            </motion.h1>
            <div className="flex items-center gap-5">
              <button onClick={() => navigate('/deals')} className="font-semibold text-gray-700 hover:text-blue-600 transition-colors">
                Deals
              </button>
              {user ? (
                <div className="flex items-center gap-5">
                  <button
                    onClick={() => navigate('/history')}
                    className="text-gray-600 hover:text-blue-600 font-semibold transition-colors"
                  >
                    My Bookings
                  </button>
                  <ProfileAvatar user={user} />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/login')}
                    className="text-gray-600 hover:text-blue-600 font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    Login
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/signup')}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-2 px-5 rounded-xl shadow-md hover:shadow-xl transition-all"
                  >
                    Sign Up
                  </motion.button>
                </div>
              )}
            </div>
          </nav>
        </header>

        {/* --- HERO SECTION --- */}
        <section className="relative h-[520px] flex items-center justify-center text-white overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1"
            className="absolute inset-0 w-full h-full object-cover scale-105 hover:scale-110 transition-transform duration-[4000ms] ease-out"
            alt="Scenic view"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20"></div>
          <div className="relative z-10 text-center max-w-3xl px-4">
            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-6xl font-extrabold mb-5 drop-shadow-lg"
            >
              Discover Your Next Adventure
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="text-lg md:text-xl mb-10 text-gray-200"
            >
              Book flights, buses, and experiences in just a few clicks.
            </motion.p>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/20 backdrop-blur-lg p-6 rounded-2xl max-w-4xl mx-auto shadow-2xl"
            >
              <div className="flex justify-center mb-6 gap-3">
                <button
                  onClick={() => setTransportType('Flights')}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold transition-all ${
                    transportType === 'Flights'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                      : 'bg-white/30 text-white/80 hover:bg-white/50'
                  }`}
                >
                  <Plane size={18} /> Flights
                </button>
                <button
                  onClick={() => setTransportType('Buses')}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold transition-all ${
                    transportType === 'Buses'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                      : 'bg-white/30 text-white/80 hover:bg-white/50'
                  }`}
                >
                  <Bus size={18} /> Buses
                </button>
              </div>
              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <SearchInput value={from} onChange={setFrom} placeholder="Enter origin" locations={allLocations} />
                <SearchInput value={to} onChange={setTo} placeholder="Enter destination" locations={allLocations} />
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/90 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-3">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </section>

        {/* --- FEATURES --- */}
        <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-14">
              Why Choose{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">TravelEase?</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <FeatureCard
                icon={<Sparkles className="h-12 w-12" />}
                title="Best Price Guarantee"
                description="We offer the most competitive prices on flights and hotels, ensuring you get the best value."
              />
              <FeatureCard
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0
11-18 0 9 9 0 0118 0z" /></svg>}
                title="Easy & Secure Booking"
                description="Our booking process is simple, fast, and protected with top-tier security."
              />
              <FeatureCard
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 3l-6 6m0
0V4m0 5h5M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15
15 15h1a2 2 0 002-2v-3.28a1 1 0
00-.684-.948l-4.493-1.498a1 1 0
00-1.21.502l-1.13 2.257a11.042 11.042 0
01-5.516-5.517l2.257-1.128a1 1 0
00.502-1.21L9.228 3.683A1 1 0
008.279 3H5z" /></svg>}
                title="24/7 Customer Support"
                description="Our dedicated support team is available around the clock to assist you with any queries."
              />
            </div>
          </div>
        </section>

        {/* --- DEALS --- */}
        <section className="py-20 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-extrabold text-gray-800 mb-6">Find the Best Deals</h2>
            <p className="text-lg text-gray-600 mb-10">Check out our dedicated page for the latest handpicked offers on flights and buses.</p>
            <motion.button
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/deals')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-10 rounded-xl text-lg shadow-md hover:shadow-xl transition-all"
            >
              View All Deals
            </motion.button>
          </div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="bg-white border-t border-gray-200">
          <div className="container mx-auto px-6 py-10">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-center md:text-left mb-6 md:mb-0">
                <h3 className="text-xl font-extrabold text-blue-600">TravelEase</h3>
                <p className="text-gray-500">Your adventure starts here.</p>
              </div>
              <div className="flex gap-8 text-gray-600">
                <a href="/help" className="hover:text-blue-600 transition-colors">Help Center</a>
                <a href="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</a>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-200 pt-6 text-center text-gray-500 text-sm">
              <p>&copy; {new Date().getFullYear()} TravelEase™. All Rights Reserved.</p>
            </div>
          </div>
        </footer>
      </div>

      <Modal
        isOpen={!!validationError}
        onClose={() => setValidationError('')}
        title="Invalid Search"
        confirmText="OK"
        onConfirm={() => setValidationError('')}
      >
        <p>{validationError}</p>
      </Modal>
    </>
  );
};

export default Home;
