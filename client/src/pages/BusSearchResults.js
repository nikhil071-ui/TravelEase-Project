import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useBusSearch } from '../hooks/useBusSearch';
import { 
    Clock, Wind, Wifi, Tv, DollarSign, ArrowRight, Sun, Moon, Sunset, Search, Calendar, Armchair 
} from 'lucide-react';
import { motion } from 'framer-motion';

// --- Helper Functions ---
const getDepartureCategory = (time) => {
    if (!time || typeof time !== 'string' || !time.includes(':')) return 'Any';
    const hour = parseInt(time.split(':')[0], 10);
    if (hour >= 5 && hour < 12) return 'Morning (5am-12pm)';
    if (hour >= 12 && hour < 17) return 'Afternoon (12pm-5pm)';
    if (hour >= 17 && hour < 21) return 'Evening (5pm-9pm)';
    return 'Night (9pm-5am)';
};

// --- Sub-Components ---
const Header = ({ from, to, date, navigate }) => (
    <motion.header 
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg shadow-md"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
    >
        <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex justify-between items-center">
                <h1 
                    className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer tracking-wide" 
                    onClick={() => navigate('/')}
                >
                    TravelEase
                </h1>
                <div className="hidden sm:flex items-center gap-6 text-gray-700">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{from}</span>
                        <ArrowRight className="text-blue-500" size={20} />
                        <span className="font-semibold text-lg">{to}</span>
                    </div>
                    {date && (
                        <div className="flex items-center gap-2 border-l pl-4">
                            <Calendar size={16} className="text-blue-600" />
                            <span className="font-semibold text-lg">
                                {new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                    )}
                </div>
                <button 
                    onClick={() => navigate('/')} 
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-90 font-semibold py-2 px-4 rounded-xl shadow-md transition-all transform hover:scale-105"
                >
                    <Search size={16} />
                    <span>Modify Search</span>
                </button>
            </div>
        </div>
    </motion.header>
);

const FilterSection = ({ title, icon, children }) => (
    <div className="py-6 border-b border-gray-200 last:border-none">
        <h3 className="flex items-center gap-3 font-semibold text-gray-900 mb-4 text-lg">
            <span className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 rounded-full shadow-sm">
                {icon}
            </span>
            {title}
        </h3>
        <div className="pl-2">{children}</div>
    </div>
);

const FiltersSidebar = ({ buses, filters, onFilterChange, onReset }) => {
    const filterOptions = useMemo(() => {
        if (buses.length === 0) {
            return { operators: [], busTypes: [], categories: [], departureTimes: [], minPrice: 0, maxPrice: 10000 };
        }
        const operators = [...new Set(buses.map(bus => bus.operator))];
        const categories = [...new Set(buses.map(bus => bus.category).filter(Boolean))];
        const departureTimes = [...new Set(buses.map(bus => getDepartureCategory(bus.departureTime)))];
        const prices = buses.map(bus => Number(bus.price) || 0);
        return { operators, categories, departureTimes, minPrice: Math.min(...prices), maxPrice: Math.max(...prices) };
    }, [buses]);

    return (
        <aside className="lg:col-span-1 bg-white/95 backdrop-blur rounded-2xl shadow-xl p-6 sticky top-24 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-700">Filters</h2>
                <button onClick={onReset} className="text-sm font-semibold text-blue-600 hover:underline">Reset</button>
            </div>
            
            <FilterSection title="Price Range" icon={<DollarSign size={18} className="text-green-600" />}>
                <input
                    type="range"
                    min={filterOptions.minPrice}
                    max={filterOptions.maxPrice}
                    value={filters.priceRange}
                    onChange={(e) => onFilterChange('priceRange', Number(e.target.value))}
                    className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    disabled={buses.length === 0}
                />
                <div className="flex justify-between text-xs text-gray-600 mt-3 font-medium">
                    <span>₹{filterOptions.minPrice}</span>
                    <span className="font-bold text-blue-600">Up to ₹{filters.priceRange}</span>
                    <span>₹{filterOptions.maxPrice}</span>
                </div>
            </FilterSection>

            {filterOptions.categories.length > 0 && (
                <FilterSection title="Bus Category" icon={<Armchair size={18} className="text-indigo-600" />}>
                    <div className="space-y-3 text-sm">
                        {filterOptions.categories.map(cat => (
                            <label key={cat} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={filters.selectedCategories.includes(cat)} onChange={() => onFilterChange('selectedCategories', cat)} className="accent-blue-600" />
                                <span>{cat}</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>
            )}

            <FilterSection title="Departure Time" icon={<Clock size={18} className="text-orange-600" />}>
                <div className="space-y-3 text-sm">
                    {filterOptions.departureTimes.sort().map(time => (
                        <label key={time} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={filters.selectedDepartureTimes.includes(time)} onChange={() => onFilterChange('selectedDepartureTimes', time)} className="accent-blue-600" />
                            {time.includes('Morning') && <Sun size={14} className="text-yellow-500" />}
                            {time.includes('Afternoon') && <Sunset size={14} className="text-orange-500" />}
                            {time.includes('Evening') && <Moon size={14} className="text-indigo-500" />}
                            {time.includes('Night') && <Moon size={14} className="text-gray-600" />}
                            <span>{time}</span>
                        </label>
                    ))}
                </div>
            </FilterSection>
            
            <FilterSection title="Operators" icon={<Wind size={18} className="text-cyan-600" />}>
                <div className="space-y-3 text-sm max-h-40 overflow-y-auto pr-2 custom-scroll">
                    {filterOptions.operators.map(op => (
                        <label key={op} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={filters.selectedOperators.includes(op)} onChange={() => onFilterChange('selectedOperators', op)} className="accent-blue-600" />
                            <span>{op}</span>
                        </label>
                    ))}
                </div>
            </FilterSection>
        </aside>
    );
};

const BusCard = ({ bus, onBook }) => {
    const operatorInitial = bus.operator ? bus.operator.charAt(0).toUpperCase() : 'B';
    const logoUrl = `https://placehold.co/48x48/E0E7FF/4F46E5?text=${operatorInitial}&font=sans`;
    const amenities = bus.amenities || [];

    return (
        <motion.div 
            className="bg-white rounded-2xl shadow-lg p-5 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] flex flex-col gap-5 border border-gray-100"
            whileHover={{ scale: 1.01 }}
        >
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <img src={logoUrl} alt={`${bus.operator} logo`} className="rounded-full w-14 h-14 border-2 border-blue-100 shadow-sm" />
                    <div>
                        <p className="font-bold text-lg text-gray-900">{bus.operator}</p>
                        <p className="text-sm text-gray-500">{bus.busType}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">{bus.category}</span>
                    <p className="text-sm font-semibold text-blue-600 mt-2">{new Date(bus.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 w-full">
                <div className="flex items-center justify-around w-full sm:w-auto sm:gap-6 text-center">
                    <div>
                        <p className="font-semibold text-xl text-gray-800">{bus.departureTime || '--:--'}</p>
                        <p className="text-sm text-gray-500">{bus.originCity}</p>
                    </div>
                    <div className="text-center w-28">
                        <p className="text-sm text-gray-500">{bus.duration || '--'}</p>
                        <div className="w-full h-px bg-gray-300 relative my-2">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-400"></div>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500"></div>
                        </div>
                    </div>
                    <div>
                        <p className="font-semibold text-xl text-gray-800">{bus.arrivalTime || '--:--'}</p>
                        <p className="text-sm text-gray-500">{bus.destinationCity}</p>
                    </div>
                </div>

                <div className="border-t sm:border-t-0 sm:border-l border-gray-200 pt-4 sm:pt-0 sm:pl-6 sm:ml-6 text-center sm:text-right w-full sm:w-52">
                    <p className="font-bold text-2xl text-gray-900">{`₹${bus.priceNumber.toLocaleString('en-IN')}`}</p>
                    <p className={`text-xs font-semibold mb-2 ${bus.seatsAvailable < 10 ? 'text-red-500 animate-pulse' : 'text-green-600'}`}>
                        {bus.seatsAvailable} seats left
                    </p>
                    <button onClick={onBook} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold py-2 px-5 rounded-lg shadow-md hover:shadow-xl transition-all transform hover:scale-105">Book Seat</button>
                </div>
            </div>

            <div className="border-t border-gray-100 pt-3 flex items-center gap-4 text-xs text-gray-600">
                <span className="font-semibold">Amenities:</span>
                <div className="flex gap-3">
                    {amenities.includes('AC') && <span className="flex items-center gap-1"><Wind size={14} /> A/C</span>}
                    {amenities.includes('WiFi') && <span className="flex items-center gap-1"><Wifi size={14} /> WiFi</span>}
                    {amenities.includes('LiveTV') && <span className="flex items-center gap-1"><Tv size={14} /> Live TV</span>}
                </div>
            </div>
        </motion.div>
    );
};

const SortButton = ({ label, isActive, onClick, disabled }) => (
    <button 
        onClick={onClick} 
        className={`px-5 py-2 text-sm font-semibold rounded-full transition-all shadow-sm ${isActive ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={disabled}
    >
        {label}
    </button>
);

const SkeletonCard = () => (
    <div className="bg-white rounded-2xl shadow-md p-6 animate-pulse">
        <div className="flex justify-between items-start">
            <div className="flex gap-4 items-center">
                <div className="rounded-full bg-gray-200 w-14 h-14"></div>
                <div>
                    <div className="h-5 bg-gray-200 rounded w-28 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="flex justify-between items-center mt-6">
            <div className="flex gap-4 items-center">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-2 bg-gray-200 rounded w-24"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
        </div>
    </div>
);

const BusSearchResults = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const date = searchParams.get('date');

    const { buses, loading, error } = useBusSearch(from, to, date);

    const [sortType, setSortType] = useState('price');
    const [filters, setFilters] = useState({
        selectedOperators: [],
        selectedCategories: [],
        selectedDepartureTimes: [],
        priceRange: 10000,
    });
    const [selectedDateFilter, setSelectedDateFilter] = useState(date || 'all');

    const availableDates = useMemo(() => {
        if (!buses) return [];
        return [...new Set(buses.map(bus => bus.date))].sort();
    }, [buses]);
    
    useEffect(() => {
        if (buses.length > 0) {
            const prices = buses.map(bus => Number(bus.price) || 0);
            const maxPrice = Math.max(...prices);
            setFilters(prev => ({ ...prev, priceRange: maxPrice }));
        }
    }, [buses]);

    useEffect(() => {
        if (from && to) {
            document.title = `Buses from ${from} to ${to} | TravelEase`;
        }
    }, [from, to]);

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
    
    const resetFilters = () => {
        const prices = buses.map(bus => Number(bus.price) || 0);
        setFilters({
            selectedOperators: [],
            selectedCategories: [],
            selectedDepartureTimes: [],
            priceRange: prices.length > 0 ? Math.max(...prices) : 10000,
        });
        setSelectedDateFilter(date || 'all');
    };

    const displayedBuses = useMemo(() => {
        const transformedBuses = buses.map(bus => {
            let duration = '--';
            let durationNumber = Infinity;
            if (bus.departureTime && bus.arrivalTime) {
                const departure = new Date(`1970-01-01T${bus.departureTime}Z`);
                const arrival = new Date(`1970-01-01T${bus.arrivalTime}Z`);
                if (!isNaN(departure) && !isNaN(arrival)) {
                    let durationMinutes = (arrival - departure) / 60000;
                    if (durationMinutes < 0) durationMinutes += 24 * 60;
                    durationNumber = durationMinutes;
                    duration = `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;
                }
            }
            return {
                ...bus,
                priceNumber: Number(bus.price) || 0,
                durationNumber,
                duration,
            };
        });

        return transformedBuses
            .filter(bus => {
                const operatorCondition = filters.selectedOperators.length === 0 || filters.selectedOperators.includes(bus.operator);
                const categoryCondition = filters.selectedCategories.length === 0 || filters.selectedCategories.includes(bus.category);
                const departureTimeCondition = filters.selectedDepartureTimes.length === 0 || filters.selectedDepartureTimes.includes(getDepartureCategory(bus.departureTime));
                const priceCondition = bus.priceNumber <= filters.priceRange;
                const dateCondition = selectedDateFilter === 'all' || bus.date === selectedDateFilter;
                return operatorCondition && categoryCondition && departureTimeCondition && priceCondition && dateCondition;
            })
            .sort((a, b) => {
                if (sortType === 'price') return a.priceNumber - b.priceNumber;
                if (sortType === 'duration') return a.durationNumber - b.durationNumber;
                if (sortType === 'departure' && a.departureTime && b.departureTime) {
                    return a.departureTime.localeCompare(b.departureTime);
                }
                return 0;
            });
    }, [buses, sortType, filters, selectedDateFilter]);

    const handleBookBus = (bus) => {
        const queryParams = new URLSearchParams({
            id: bus.id,
        }).toString();
        
        const tourName = `${bus.operator}-${bus.originCity}-to-${bus.destinationCity}`.replace(/\s+/g, '-').toLowerCase();
        navigate(`/book-tour/${tourName}?${queryParams}`);
    };
    
    const noResults = !loading && displayedBuses.length === 0;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            <Header from={from} to={to} date={date} navigate={navigate} />
            <main className="container mx-auto px-4 sm:px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <FiltersSidebar buses={buses} filters={filters} onFilterChange={handleFilterChange} onReset={resetFilters} />
                    <div className="lg:col-span-3">
                        {!date && availableDates.length > 1 && (
                            <div className="bg-white rounded-2xl shadow-md p-4 flex flex-wrap items-center gap-4 mb-6 border border-gray-100">
                                <p className="font-semibold text-sm whitespace-nowrap flex items-center gap-2 text-gray-700"><Calendar size={16} className="text-blue-600" /> Available Dates:</p>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => setSelectedDateFilter('all')} className={`px-3 py-1 text-xs rounded-full transition-all ${selectedDateFilter === 'all' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>All Dates</button>
                                    {availableDates.map(d => (
                                        <button key={d} onClick={() => setSelectedDateFilter(d)} className={`px-3 py-1 text-xs rounded-full transition-all ${selectedDateFilter === d ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                                            {new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl shadow-md p-4 flex flex-wrap items-center justify-between gap-4 mb-6 border border-gray-100">
                            <p className="font-semibold text-sm whitespace-nowrap text-gray-700">Sort by:</p>
                            <div className="flex flex-wrap gap-2">
                                <SortButton label="Cheapest" isActive={sortType === 'price'} onClick={() => setSortType('price')} disabled={noResults} />
                                <SortButton label="Fastest" isActive={sortType === 'duration'} onClick={() => setSortType('duration')} disabled={noResults} />
                                <SortButton label="Earliest Departure" isActive={sortType === 'departure'} onClick={() => setSortType('departure')} disabled={noResults} />
                            </div>
                        </div>

                        <div className="space-y-5">
                            {loading ? ([...Array(4)].map((_, i) => <SkeletonCard key={i} />))
                            : error ? (
                                <div className="text-center bg-white p-10 rounded-2xl shadow-md border border-red-100">
                                    <h3 className="text-xl font-bold text-red-600">An Error Occurred</h3>
                                    <p className="text-gray-500 mt-2">{error}</p>
                                </div>
                            )
                            : displayedBuses.length > 0 ? (
                                <>
                                    <p className="text-sm text-gray-600 mb-2">Found <span className="font-bold text-blue-600">{displayedBuses.length}</span> of <span className="font-bold">{buses.length}</span> buses.</p>
                                    {displayedBuses.map(bus => (<BusCard key={bus.id} bus={bus} onBook={() => handleBookBus(bus)} />))}
                                </>
                            )
                            : (
                                <div className="text-center bg-white p-10 rounded-2xl shadow-md border border-gray-100">
                                    <h3 className="text-xl font-bold text-gray-700">No Buses Found</h3>
                                    <p className="text-gray-500 mt-2">Try adjusting your filters or search for a different route.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BusSearchResults;

