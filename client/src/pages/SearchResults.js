import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useFlightSearch } from '../hooks/useFlightSearch';
import { Plane, Clock, DollarSign, ArrowRight, Search, Utensils, Wifi, Armchair, Calendar, ChevronDown, Users, Briefcase, X } from 'lucide-react';

// --- Helper Functions ---
const getDepartureCategory = (time) => {
    if (!time) return 'Any';
    const hour = parseInt(time.split(':')[0], 10);
    if (hour >= 5 && hour < 12) return 'Morning (5am-12pm)';
    if (hour >= 12 && hour < 17) return 'Afternoon (12pm-5pm)';
    if (hour >= 17 && hour < 21) return 'Evening (5pm-9pm)';
    return 'Night (9pm-5am)';
};

const getAirlineLogo = (airlineName) => {
    if (!airlineName) return 'https://placehold.co/48x48/cccccc/FFF?text=?';
    const initials = airlineName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    return `https://placehold.co/48x48/3B82F6/FFF?text=${initials}&font=sans`;
};

// --- Sub-Components ---
const Header = ({ from, to, date, navigate }) => (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-blue-600 cursor-pointer" onClick={() => navigate('/')}>TravelEase</h1>
                <div className="hidden sm:flex items-center gap-4 text-gray-700">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{from}</span>
                        <ArrowRight className="text-blue-500" size={20} />
                        <span className="font-semibold text-lg">{to}</span>
                    </div>
                    {date && (
                        <div className="flex items-center gap-2 border-l pl-4">
                            <Calendar size={16} />
                            <span className="font-semibold text-lg">{date}</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold py-2 px-4 rounded-lg"
                >
                    <Search size={16} />
                    <span>Modify Search</span>
                </button>
            </div>
        </div>
    </header>
);

const FilterSection = ({ title, icon, children }) => (
    <div className="py-4 border-b border-gray-200">
        <h3 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">{icon} {title}</h3>
        {children}
    </div>
);

const SortButton = ({ label, isActive, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-100'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {label}
    </button>
);

const FlightCard = ({ flight, onBook }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-white rounded-xl shadow-md transition-all hover:shadow-xl">
            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full sm:w-1/3">
                    <img src={getAirlineLogo(flight.airline)} alt={`${flight.airline} logo`} className="rounded-full w-12 h-12 border-2 border-blue-100" />
                    <div>
                        <p className="font-bold text-lg text-gray-900">{flight.airline}</p>
                        <p className="text-sm text-gray-500">{flight.flightNumber}</p>
                        <p className="text-xs font-semibold text-blue-600 mt-1">{new Date(flight.date).toDateString()}</p>
                    </div>
                </div>
                <div className="flex items-center justify-around w-full sm:w-1/3 text-center">
                    <div>
                        <p className="font-semibold text-xl">{flight.departureTime}</p>
                        <p className="text-sm text-gray-500">{flight.originCity.substring(0,3).toUpperCase()}</p>
                    </div>
                    <div className="text-center w-28">
                        <p className="text-sm text-gray-500">{flight.duration}</p>
                        <div className="w-full h-px bg-gray-300 relative my-1">
                            <div className="absolute left-0 top-1/2 w-2 h-2 bg-gray-400 rounded-full -translate-y-1/2"></div>
                            <div className="absolute right-0 top-1/2 w-2 h-2 bg-blue-500 rounded-full -translate-y-1/2"></div>
                        </div>
                        <p className="text-xs text-gray-400 font-medium">{flight.stops === 0 ? 'Non-Stop' : `${flight.stops} Stop(s)`}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-xl">{flight.arrivalTime}</p>
                        <p className="text-sm text-gray-500">{flight.destinationCity.substring(0,3).toUpperCase()}</p>
                    </div>
                </div>
                <div className="border-t sm:border-t-0 sm:border-l border-gray-200 pt-4 sm:pt-0 sm:pl-4 sm:ml-4 text-center sm:text-right w-full sm:w-56">
                    <p className="text-sm text-gray-500">Starts from</p>
                    <p className="font-bold text-2xl text-gray-900">{`₹${flight.economyPrice.toLocaleString('en-IN')}`}</p>
                    <p className="text-xs text-gray-500 -mt-1 mb-2">in Economy</p>
                    <button onClick={onBook} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition-all shadow-md hover:shadow-lg">Book Now</button>
                </div>
            </div>
            {flight.stops > 0 && (
                <div className="border-t border-gray-200 px-4 py-2">
                    <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-between items-center text-sm font-semibold text-blue-600">
                        <span>View Stop Details</span>
                        <ChevronDown className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} size={16}/>
                    </button>
                    {isExpanded && (
                        <div className="mt-2 pl-4 text-sm text-gray-600">
                            <p className="font-semibold">Stop Locations:</p>
                            <ul className="list-disc list-inside">
                                {(flight.stopLocations || []).map((stop, index) => (<li key={index}>{stop}</li>))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
             <div className="bg-gray-50/70 px-4 py-3 rounded-b-xl flex justify-center sm:justify-end gap-6 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                    <Users size={16} className="text-blue-500"/>
                    <span className="font-semibold">Economy:</span>
                    <span>₹{flight.economyPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                    <Briefcase size={16} className="text-indigo-500"/>
                    <span className="font-semibold">Business:</span>
                    <span>₹{flight.businessPrice.toLocaleString('en-IN')}</span>
                </div>
            </div>
        </div>
    );
};

const FloatingAd = ({ ad, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsVisible(prev => !prev);
        }, isVisible ? 3000 : 2000); // Show for 3s, hide for 2s

        return () => clearInterval(interval);
    }, [isVisible]);

    if (!ad || !ad.adBannerUrl) return null;

    return (
        <div
            className={`fixed bottom-4 right-4 w-72 h-32 rounded-lg shadow-2xl z-50 transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
        >
            <a href={ad.redirectUrl || '#'} target="_blank" rel="noopener noreferrer">
                <img src={ad.adBannerUrl} alt="Advertisement" className="w-full h-full object-cover rounded-lg" />
            </a>
            <button
                onClick={onClose}
                className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
                aria-label="Close ad"
            >
                <X size={16} />
            </button>
        </div>
    );
};

const SkeletonCard = () => (
    <div className="bg-white rounded-xl shadow-md p-4 animate-pulse">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="rounded-full bg-gray-200 w-12 h-12"></div>
                <div>
                    <div className="h-5 bg-gray-200 rounded w-28 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
            </div>
            <div className="flex gap-4 items-center">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-2 bg-gray-200 rounded w-24"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
        </div>
    </div>
);

const SearchResults = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const date = searchParams.get('date');

    const { flights, loading, error } = useFlightSearch(from, to, date);

    const [sortType, setSortType] = useState('price');
    const [filters, setFilters] = useState({
        maxPrice: 50000,
        stops: 'any',
        selectedAirlines: [],
        selectedDepartureTimes: [],
        selectedServices: []
    });
    
    const [showAd, setShowAd] = useState(true);

    const filterOptions = useMemo(() => {
        const airlines = [...new Set(flights.map(f => f.airline))];
        const departureTimes = [...new Set(flights.map(f => getDepartureCategory(f.departureTime)))];
        const prices = flights.map(f => Number(f.economyPrice) || 0);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 50000;
        return { airlines, departureTimes, minPrice, maxPrice };
    }, [flights]);

    useEffect(() => {
        if (flights.length > 0) {
            setFilters(prev => ({
                ...prev,
                maxPrice: filterOptions.maxPrice,
            }));
        }
    }, [flights, filterOptions.maxPrice]);

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => {
            if (Array.isArray(prev[filterType])) {
                const currentValues = prev[filterType];
                const newValues = currentValues.includes(value)
                    ? currentValues.filter(item => item !== value)
                    : [...currentValues, value];
                return { ...prev, [filterType]: newValues };
            }
            return { ...prev, [filterType]: value };
        });
    };

    const displayedFlights = useMemo(() => {
        return flights
            .filter(flight => {
                const priceCondition = (Number(flight.economyPrice) || 0) <= filters.maxPrice;
                const stopsCondition = filters.stops === 'any' || flight.stops.toString() === filters.stops;
                const airlineCondition = filters.selectedAirlines.length === 0 || filters.selectedAirlines.includes(flight.airline);
                const departureCondition = filters.selectedDepartureTimes.length === 0 || filters.selectedDepartureTimes.includes(getDepartureCategory(flight.departureTime));
                const servicesCondition = filters.selectedServices.every(service => (flight.inFlightServices || []).includes(service));
                return priceCondition && stopsCondition && airlineCondition && departureCondition && servicesCondition;
            })
            .sort((a, b) => {
                if (sortType === 'price') return a.economyPrice - b.economyPrice;
                if (sortType === 'duration') {
                    const durationA = (parseInt(a.duration.split('h')[0], 10) * 60) + parseInt(a.duration.split('h ')[1].replace('m', ''), 10);
                    const durationB = (parseInt(b.duration.split('h')[0], 10) * 60) + parseInt(b.duration.split('h ')[1].replace('m', ''), 10);
                    return durationA - durationB;
                }
                return 0;
            });
    }, [flights, sortType, filters]);

    const adFlight = useMemo(() => {
        return displayedFlights.find(f => f.adBannerUrl);
    }, [displayedFlights]);

    const handleBookFlight = (flight) => {
        const params = new URLSearchParams({
            id: String(flight.id),
            type: 'flight',
            date: flight.date,
            economyPrice: String(flight.economyPrice ?? ''),
            businessPrice: String(flight.businessPrice ?? ''),
            airline: flight.airline || '',
            flightNumber: flight.flightNumber || '',
            departureTime: flight.departureTime || '',
            gate: flight.gate || '',
            originCity: flight.originCity || from || '',
            destinationCity: flight.destinationCity || to || '',
            originAirportCode: flight.originAirportCode || '',
            destinationAirportCode: flight.destinationAirportCode || '',
            adBannerUrl: flight.adBannerUrl || '',

            // --- Updated GST Parameters ---
            flightType: flight.flightType || 'domestic',
            economyDomesticGst: String(flight.economyDomesticGst ?? 0),
            businessDomesticGst: String(flight.businessDomesticGst ?? 0),
            economyInternationalGst: String(flight.economyInternationalGst ?? 0),
            businessInternationalGst: String(flight.businessInternationalGst ?? 0),
        });
        navigate(`/book/${from}/${to}?${params.toString()}`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header from={from} to={to} date={date} navigate={navigate} />
            <main className="container mx-auto px-4 sm:px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <aside className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md h-fit sticky top-24">
                        <h2 className="text-xl font-bold mb-4">Filters</h2>
                        <FilterSection title="Price Range (Economy)" icon={<DollarSign size={18}/>}>
                            <input
                                type="range"
                                min={filterOptions.minPrice}
                                max={filterOptions.maxPrice}
                                value={filters.maxPrice}
                                onChange={(e) => handleFilterChange('maxPrice', Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg"
                                disabled={flights.length === 0}
                            />
                            <div className="text-sm text-center text-gray-600 mt-1">
                                Up to ₹{filters.maxPrice.toLocaleString('en-IN')}
                            </div>
                        </FilterSection>
                        <FilterSection title="Stops" icon={<Plane size={18}/>}>
                            <div className="space-y-2 text-sm">
                                <label className="flex items-center"><input type="radio" name="stops" value="any" checked={filters.stops === 'any'} onChange={(e) => handleFilterChange('stops', e.target.value)} className="mr-2"/>Any</label>
                                <label className="flex items-center"><input type="radio" name="stops" value="0" checked={filters.stops === '0'} onChange={(e) => handleFilterChange('stops', e.target.value)} className="mr-2"/>Non-stop</label>
                                <label className="flex items-center"><input type="radio" name="stops" value="1" checked={filters.stops === '1'} onChange={(e) => handleFilterChange('stops', e.target.value)} className="mr-2"/>1 Stop</label>
                            </div>
                        </FilterSection>
                        <FilterSection title="Departure Time" icon={<Clock size={18}/>}>
                            <div className="space-y-2 text-sm">
                                {filterOptions.departureTimes.sort().map(time => (
                                    <label key={time} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={filters.selectedDepartureTimes.includes(time)}
                                            onChange={() => handleFilterChange('selectedDepartureTimes', time)}
                                            className="mr-2 rounded"
                                        />
                                        {time.split(' (')[0]}
                                    </label>
                                ))}
                            </div>
                        </FilterSection>
                        <FilterSection title="Airlines" icon={<Plane size={18}/>}>
                            <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
                                {filterOptions.airlines.map(a => (
                                    <label key={a} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={filters.selectedAirlines.includes(a)}
                                            onChange={() => handleFilterChange('selectedAirlines', a)}
                                            className="mr-2"
                                        />
                                        {a}
                                    </label>
                                ))}
                            </div>
                        </FilterSection>
                         <FilterSection title="In-Flight Services" icon={<Armchair size={18}/>}>
                            <div className="space-y-2 text-sm">
                                <label className="flex items-center"><input type="checkbox" checked={filters.selectedServices.includes('In-flight Meal')} onChange={() => handleFilterChange('selectedServices', 'In-flight Meal')} className="mr-2"/><Utensils size={14} className="mr-1"/>Meal</label>
                                <label className="flex items-center"><input type="checkbox" checked={filters.selectedServices.includes('WiFi Available')} onChange={() => handleFilterChange('selectedServices', 'WiFi Available')} className="mr-2"/><Wifi size={14} className="mr-1"/>WiFi</label>
                            </div>
                        </FilterSection>
                    </aside>
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-lg shadow-sm p-3 flex flex-wrap items-center justify-between gap-4 mb-6">
                            <p className="font-semibold text-sm">Sort by:</p>
                            <div className="flex flex-wrap gap-2">
                                <SortButton label="Cheapest" isActive={sortType === 'price'} onClick={() => setSortType('price')} disabled={flights.length === 0} />
                                <SortButton label="Fastest" isActive={sortType === 'duration'} onClick={() => setSortType('duration')} disabled={flights.length === 0} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            {loading ? (
                                [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
                            ) : error ? (
                                <div className="text-center bg-white p-8 rounded-lg shadow">
                                    <h3 className="text-xl font-semibold text-red-600">An Error Occurred</h3>
                                    <p className="text-gray-500 mt-2">{error}</p>
                                </div>
                            ) : displayedFlights.length > 0 ? (
                                <>
                                    <p className="text-sm text-gray-600">
                                        Found <span className="font-bold text-blue-600">{displayedFlights.length}</span> of <span className="font-bold">{flights.length}</span> total flights for this route.
                                    </p>
                                    {displayedFlights.map(flight => (
                                        <FlightCard key={flight.id} flight={flight} onBook={() => handleBookFlight(flight)} />
                                    ))}
                                </>
                            ) : (
                                <div className="text-center bg-white p-8 rounded-lg shadow">
                                    <h3 className="text-xl font-semibold text-gray-700">No Flights Found</h3>
                                    <p className="text-gray-500 mt-2">Try adjusting your filters or search for a different route.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            {showAd && <FloatingAd ad={adFlight} onClose={() => setShowAd(false)} />}
        </div>
    );
};

export default SearchResults;