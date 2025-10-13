import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Bus, ArrowDownUp, Filter, Tag } from 'lucide-react';

// --- Reusable UI Components ---
const DealCard = ({ deal, onBook }) => {
    const isFlight = deal.type === 'flight';
    const operator = isFlight ? deal.airline : deal.operator;
    const price = isFlight ? deal.economyPrice : deal.price;

    const imageUrl = `https://source.unsplash.com/400x300/?${deal.destinationCity},city`;

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden group transform hover:-translate-y-2 transition-transform duration-300 ease-in-out flex flex-col">
            <div className="relative">
                <img src={imageUrl} alt={deal.destinationCity} className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/400x300/E0E7FF/4F46E5?text=Travel'; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                    Hot Deal
                </div>
                <div className="absolute bottom-0 left-0 p-4">
                    <h3 className="text-2xl font-bold text-white tracking-wide">{deal.destinationCity}</h3>
                    <p className="text-sm text-white/90">from {deal.originCity}</p>
                </div>
            </div>
            <div className="p-5 flex flex-col flex-grow">
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                    {isFlight ? <Plane size={16} className="text-blue-500" /> : <Bus size={16} className="text-green-500" />}
                    <span>{operator}</span>
                </div>
                <p className="font-semibold text-gray-700">{new Date(deal.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                
                <div className="mt-auto pt-4 flex justify-between items-center">
                    <p className="text-xl font-bold text-gray-900">
                        {`₹${price.toLocaleString('en-IN')}`}
                    </p>
                    <button
                        onClick={() => onBook(deal)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                    >
                        View Deal
                    </button>
                </div>
            </div>
        </div>
    );
};

const SkeletonCard = () => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
        <div className="bg-gray-200 h-40 w-full"></div>
        <div className="p-5">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="flex justify-between items-center mt-4">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-300 rounded-lg w-1/3"></div>
            </div>
        </div>
    </div>
);


const Deals = () => {
    const [allDeals, setAllDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [filterType, setFilterType] = useState('all');
    const [sortType, setSortType] = useState('price-asc');

    useEffect(() => {
        const fetchDeals = async () => {
            setLoading(true);
            setError('');
            try {
                const [flightsRes, busesRes] = await Promise.all([
                    fetch('http://localhost:5000/api/flights'),
                    fetch('http://localhost:5000/api/buses')
                ]);

                if (!flightsRes.ok || !busesRes.ok) {
                    throw new Error('Failed to fetch deals from the server.');
                }

                const flightsData = await flightsRes.json();
                const busesData = await busesRes.json();

                const normalizedFlights = flightsData.map(f => ({ ...f, type: 'flight', price: f.economyPrice }));
                const normalizedBuses = busesData.map(b => ({ ...b, type: 'bus' }));
                
                const combinedDeals = [...normalizedFlights, ...normalizedBuses];

                // --- NEW: Filter out past deals ---
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Normalize to the start of today

                const futureDeals = combinedDeals.filter(deal => {
                    const dealDate = new Date(deal.date);
                    return dealDate >= today;
                });

                setAllDeals(futureDeals);
                
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDeals();
    }, []);

    const displayedDeals = useMemo(() => {
        return allDeals
            .filter(deal => {
                if (filterType === 'all') return true;
                return deal.type === filterType;
            })
            .sort((a, b) => {
                switch (sortType) {
                    case 'price-asc':
                        return a.price - b.price;
                    case 'price-desc':
                        return b.price - a.price;
                    case 'date-asc':
                        return new Date(a.date) - new Date(b.date);
                    default:
                        return 0;
                }
            });
    }, [allDeals, filterType, sortType]);
    
    const handleBookDeal = (deal) => {
        const searchPath = deal.type === 'flight' ? '/search' : '/search-bus';
        navigate(`${searchPath}?from=${deal.originCity}&to=${deal.destinationCity}&date=${deal.date}`);
    };
    
    return (
        <div className="min-h-screen bg-gray-50">
             <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-40">
                <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-blue-600 cursor-pointer" onClick={() => navigate('/')}>TravelEase</h1>
                    <button onClick={() => navigate('/')} className="font-semibold text-gray-700 hover:text-blue-600">Home</button>
                </nav>
            </header>

            <main className="container mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <h2 className="text-5xl font-extrabold text-gray-800">Today's Top Deals</h2>
                    <p className="text-lg text-gray-500 mt-2">Handpicked offers on flights and buses, just for you.</p>
                </div>

                {/* --- Filter and Sort Controls --- */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-gray-500" />
                        <span className="font-semibold">Filter by:</span>
                        <div className="flex gap-2">
                            <button onClick={() => setFilterType('all')} className={`px-4 py-1.5 text-sm rounded-full ${filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>All</button>
                            <button onClick={() => setFilterType('flight')} className={`px-4 py-1.5 text-sm rounded-full ${filterType === 'flight' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Flights</button>
                            <button onClick={() => setFilterType('bus')} className={`px-4 py-1.5 text-sm rounded-full ${filterType === 'bus' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Buses</button>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        <ArrowDownUp size={18} className="text-gray-500" />
                        <span className="font-semibold">Sort by:</span>
                        <select value={sortType} onChange={(e) => setSortType(e.target.value)} className="border-gray-200 rounded-md text-sm">
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="date-asc">Date: Earliest First</option>
                        </select>
                    </div>
                </div>

                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                )}

                {error && <div className="text-center p-10 bg-red-50 text-red-600 rounded-lg">Error: {error}</div>}

                {!loading && !error && displayedDeals.length > 0 && (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {displayedDeals.map(deal => (
                            <DealCard key={deal.id} deal={deal} onBook={handleBookDeal} />
                        ))}
                    </div>
                )}

                {!loading && !error && displayedDeals.length === 0 && (
                     <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
                        <Tag size={48} className="mx-auto text-gray-300" />
                        <h3 className="text-xl font-semibold text-gray-700 mt-4">No Deals Found</h3>
                        <p className="text-gray-500 mt-2">We couldn't find any deals right now. Please check back later!</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Deals;
