import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import AddFlightModal from '../components/AddFlightModal';
import AddBusModal from '../components/AddBusModal';
import EditFlightModal from '../components/EditFlightModal';
import EditBusModal from '../components/EditBusModal';
import { AddCouponModal, EditCouponModal, AddBannerModal, EditBannerModal } from '../components/CouponAndBannerModals'; 
import { useAdminApi } from '../hooks/useAdminApi';
import { Plane, Bus, Users, Edit, Trash2, Ticket, RefreshCw, Search, Tag, ImageIcon, Plus } from 'lucide-react';

/* ---------- Reusable UI Components ---------- */
const StatCard = ({ title, value, icon, color = 'blue' }) => {
    const colorMap = {
        blue: { bg: 'from-blue-400 to-indigo-500', text: 'text-white' },
        orange: { bg: 'from-orange-400 to-amber-500', text: 'text-white' },
        purple: { bg: 'from-purple-400 to-pink-500', text: 'text-white' },
    };
    const chosen = colorMap[color] || colorMap.blue;
    return (
        <div className="relative overflow-hidden rounded-xl shadow-lg">
            <div className={`p-5 bg-gradient-to-r ${chosen.bg} ${chosen.text} flex items-center gap-4`}>
                <div className="p-3 rounded-xl bg-white/20">{icon}</div>
                <div className="flex-1">
                    <p className="text-sm opacity-90 font-medium">{title}</p>
                    <p className="text-2xl font-extrabold mt-1">{value}</p>
                </div>
            </div>
            <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/6 blur-lg" />
        </div>
    );
};

const DataTable = ({ title, items, columns, selectedItems, onSelectionChange, onBulkDelete, onSingleDelete, onAddClick, addLabel, children, onEdit }) => {
    const areAllSelected = useMemo(() => items.length > 0 && selectedItems.length === items.length, [items, selectedItems]);
    const handleSelectAll = () => areAllSelected ? onSelectionChange([]) : onSelectionChange(items.map((item) => item.id));
    const handleSelectItem = (id) => onSelectionChange(selectedItems.includes(id) ? selectedItems.filter((i) => i !== id) : [...selectedItems, id]);

    return (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 border-b border-gray-100">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                    <p className="text-sm text-gray-500 mt-1">Manage {title.toLowerCase()} from here</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {children}
                    <div className="flex items-center gap-2">
                        {onAddClick && (
                            <button onClick={onAddClick} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold transition" title={addLabel}>
                                <Plus size={16} /> {addLabel}
                            </button>
                        )}
                        {selectedItems.length > 0 && (
                            <button onClick={onBulkDelete} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition">
                                Delete Selected ({selectedItems.length})
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                    <thead className="bg-white sticky top-0"><tr className="border-b"><th className="p-3 w-12"><input type="checkbox" checked={areAllSelected} onChange={handleSelectAll} className="form-checkbox h-4 w-4 text-indigo-600 rounded" aria-label="Select all" /></th>{columns.map((col) => (<th key={col.key} className="p-3 text-sm font-semibold text-gray-600 uppercase">{col.header}</th>))}<th className="p-3 text-sm font-semibold text-gray-600 uppercase">Actions</th></tr></thead>
                    <tbody>
                        {items.length > 0 ? (
                            items.map((item, idx) => (
                                <tr key={item.id} className={`border-b last:border-b-0 hover:bg-gray-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                    <td className="p-3 align-top"><input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => handleSelectItem(item.id)} className="form-checkbox h-4 w-4 text-indigo-600" aria-label={`Select ${item.id}`} /></td>
                                    {columns.map((col) => (<td key={`${item.id}-${col.key}`} className="p-3 align-top text-sm text-gray-700">{col.render(item)}</td>))}
                                    <td className="p-3 align-top flex gap-2">
                                        <button onClick={() => onEdit(item)} className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-semibold hover:bg-indigo-100 transition" title="Edit"><Edit size={12} /> Edit</button>
                                        <button onClick={() => onSingleDelete(item)} className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-semibold hover:bg-red-100 transition" title="Delete"><Trash2 size={12} /> Delete</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={columns.length + 3} className="p-6 text-center text-gray-500">No data available.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TabButton = ({ label, icon, isActive, onClick }) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>
        {icon}{label}
    </button>
);


/* ---------- Admin Dashboard Component ---------- */
const AdminDashboard = () => {
    const navigate = useNavigate();
    const { data: apiData = {}, loading, error, refetch } = useAdminApi();
    const [activeTab, setActiveTab] = useState('flights');

    const data = useMemo(() => apiData, [apiData]);

    const [modals, setModals] = useState({
        addFlight: false, editFlight: false, addBus: false, editBus: false,
        addCoupon: false, editCoupon: false, addBanner: false, editBanner: false,
        confirmDelete: false,
    });
    
    const [currentItem, setCurrentItem] = useState(null);
    const [deletionPayload, setDeletionPayload] = useState({ ids: [], type: '' });
    
    const [selections, setSelections] = useState({
        flights: [], buses: [], users: [], bookings: [], coupons: [], banners: []
    });

    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [debouncedUserTerm, setDebouncedUserTerm] = useState('');
    const [bookingSearchTerm, setBookingSearchTerm] = useState('');
    const [debouncedBookingTerm, setDebouncedBookingTerm] = useState('');
    const [ticketCode, setTicketCode] = useState('');
    const [checkInStatus, setCheckInStatus] = useState({ message: '', type: '' });
    const [checkedInBooking, setCheckedInBooking] = useState(null);

    useEffect(() => {
        const userHandler = setTimeout(() => setDebouncedUserTerm(userSearchTerm), 300);
        const bookingHandler = setTimeout(() => setDebouncedBookingTerm(bookingSearchTerm), 300);
        return () => { clearTimeout(userHandler); clearTimeout(bookingHandler); };
    }, [userSearchTerm, bookingSearchTerm]);

    const openModal = (modalName, item = null) => {
        if (item) setCurrentItem(item);
        setModals(prev => ({ ...prev, [modalName]: true }));
    };

    const closeModal = (modalName) => {
        setModals(prev => ({ ...prev, [modalName]: false }));
        setCurrentItem(null);
    };

    const handleSuccess = (modalName) => {
        closeModal(modalName);
        refetch();
    };
    
    const handleLogout = useCallback(() => {
        sessionStorage.removeItem('admin-token');
        navigate('/admin/login');
    }, [navigate]);

    const requestDeleteConfirmation = (ids, type) => {
        if (ids.length === 0) return;
        setDeletionPayload({ ids, type });
        openModal('confirmDelete');
    };

    const executeDelete = async () => {
        const { ids, type } = deletionPayload;
        const token = sessionStorage.getItem('admin-token');
        try {
            await Promise.all(ids.map((id) => fetch(`http://localhost:5000/api/admin/${type}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })));
            refetch();
        } catch (err) {
            alert('An error occurred during deletion.');
        } finally {
            closeModal('confirmDelete');
            setSelections(prev => ({ ...prev, [type]: [] }));
        }
    };

    const handleSelectionChange = (type, ids) => {
        setSelections(prev => ({ ...prev, [type]: ids }));
    };

    const handleCheckIn = async (e) => {
        e.preventDefault();
        setCheckInStatus({ message: 'Checking in...', type: 'info' });
        setCheckedInBooking(null);
        const token = sessionStorage.getItem('admin-token');
        try {
            const response = await fetch('http://localhost:5000/api/admin/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ticketCode }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Check-in failed');
            setCheckInStatus({ message: `Success! Ticket ${result.booking.ticketCode} is valid.`, type: 'success' });
            setCheckedInBooking(result.booking);
            refetch();
        } catch (err) {
            setCheckInStatus({ message: err.message || 'Check-in failed', type: 'error' });
        }
    };

    const filteredUsers = useMemo(() => (data.users || []).filter((u) => (u.email || '').toLowerCase().includes((debouncedUserTerm || '').toLowerCase())), [data.users, debouncedUserTerm]);
    const filteredBookings = useMemo(() => {
        if (!debouncedBookingTerm) return data.bookings || [];
        const lower = debouncedBookingTerm.toLowerCase();
        return (data.bookings || []).filter((b) => (b.userEmail || '').toLowerCase().includes(lower) || (b.ticketCode || '').toLowerCase().includes(lower) || (b.passengers || []).some(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(lower)));
    }, [data.bookings, debouncedBookingTerm]);

    const columns = {
        flights: [
            { key: 'airline', header: 'Airline', render: (i) => i.airline },
            { key: 'route', header: 'Route', render: (i) => `${i.originCity} → ${i.destinationCity}` },
            { key: 'date', header: 'Date', render: (i) => i.date },
            { key: 'economyPrice', header: 'Econ. Price', render: (i) => `₹${i.economyPrice?.toLocaleString('en-IN')}`},
            { key: 'businessPrice', header: 'Bus. Price', render: (i) => `₹${i.businessPrice?.toLocaleString('en-IN')}`},
            { key: 'domesticGst', header: 'Dom. GST', render: (i) => `${i.domesticGst || 0}%` },
            { key: 'internationalGst', header: 'Int\'l GST', render: (i) => `${i.internationalGst || 0}%` },
        ],
        buses: [
            { key: 'operator', header: 'Operator', render: (i) => i.operator },
            { key: 'route', header: 'Route', render: (i) => `${i.originCity} → ${i.destinationCity}` },
            { key: 'price', header: 'Price', render: (i) => `₹${i.price?.toLocaleString('en-IN')}` },
            { key: 'seats', header: 'Seats', render: (i) => i.seatsAvailable },
            { key: 'gst', header: 'GST', render: (i) => `${i.gst || 0}%` },
            { key: 'cleanlinessFare', header: 'Cleanliness Fare', render: (i) => `₹${i.cleanlinessFare?.toLocaleString('en-IN') || 0}` },
            { key: 'maintenanceFare', header: 'Maintenance', render: (i) => `₹${i.maintenanceFare?.toLocaleString('en-IN') || 0}` },
            { key: 'hygieneFare', header: 'Hygiene', render: (i) => `₹${i.hygieneFare?.toLocaleString('en-IN') || 0}` },
        ],
        coupons: [
            { key: 'image', header: 'Image', render: (c) => <img src={c.imageUrl || 'https://placehold.co/128x64/EFEFEF/AAAAAA?text=No+Image'} alt="Coupon" className="w-32 h-16 object-cover rounded-md" /> },
            { key: 'code', header: 'Code', render: (c) => <span className="font-mono bg-gray-100 p-1 rounded">{c.code}</span> },
            { key: 'appliesTo', header: 'Applies To', render: (c) => <span className="capitalize font-medium text-gray-600">{c.appliesTo || 'all'}</span> },
            { key: 'discountValue', header: 'Value', render: (c) => c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}` },
            { key: 'status', header: 'Status', render: (c) => <span className={`px-2 py-1 text-xs font-semibold rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{c.isActive ? 'Active' : 'Inactive'}</span> },
        ],
        banners: [
            { key: 'image', header: 'Banner', render: (b) => <img src={b.imageUrl} alt="Banner" className="w-32 h-16 object-cover rounded-md" /> },
            { key: 'appliesTo', header: 'Applies To', render: (b) => <span className="capitalize font-medium text-gray-600">{b.appliesTo || 'all'}</span> },
            { key: 'redirectUrl', header: 'Redirect URL', render: (b) => <a href={b.redirectUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-xs block">{b.redirectUrl}</a> },
            { key: 'status', header: 'Status', render: (b) => <span className={`px-2 py-1 text-xs font-semibold rounded-full ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{b.isActive ? 'Active' : 'Inactive'}</span> },
        ],
        users: [
            { key: 'email', header: 'Email', render: (i) => i.email },
            { key: 'uid', header: 'User ID', render: (i) => <span className="text-xs break-all">{i.uid}</span> },
            { key: 'created', header: 'Registered', render: (i) => new Date(i.creationTime).toLocaleDateString() },
        ],
        bookings: [
            { key: 'ticketCode', header: 'Ticket', render: (i) => <span className="font-mono">{i.ticketCode}</span> },
            { key: 'email', header: 'Email', render: (i) => i.userEmail },
            { key: 'passenger', header: 'Passenger', render: (i) => `${i.passengers?.[0]?.firstName || ''} ${i.passengers?.[0]?.lastName || ''}`},
            { key: 'bookedAt', header: 'Booking Date', render: (i) => i.bookedAt ? new Date(i.bookedAt).toLocaleDateString('en-IN') : 'N/A' },
            { key: 'departureDate', header: 'Departure', render: (i) => i.departureDate ? new Date(i.departureDate).toLocaleDateString('en-IN') : 'N/A' },
            { key: 'type', header: 'Type', render: (i) => i.type },
        ]
    };

    const tabs = [
        { id: 'flights', label: 'Flights', icon: <Plane size={16} /> },
        { id: 'buses', label: 'Buses', icon: <Bus size={16} /> },
        { id: 'coupons', label: 'Coupons', icon: <Tag size={16} /> },
        { id: 'banners', label: 'Banners', icon: <ImageIcon size={16} /> },
        { id: 'users', label: 'Users', icon: <Users size={16} /> },
        { id: 'bookings', label: 'Bookings', icon: <Ticket size={16} /> },
    ];

    return (
        <>
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                <header className="bg-white shadow sticky top-0 z-40">
                    <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-extrabold text-gray-800">Admin Dashboard</h1>
                            <p className="text-sm text-gray-500">Overview & management panel</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => refetch()} disabled={loading} className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition">
                                <RefreshCw size={16} /> {loading ? 'Refreshing...' : 'Refresh'}
                            </button>
                            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 font-semibold transition">Logout</button>
                        </div>
                    </nav>
                </header>

                <main className="container mx-auto px-6 py-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                        <StatCard title="Total Flights" value={data.flights?.length || 0} icon={<Plane />} color="blue" />
                        <StatCard title="Total Buses" value={data.buses?.length || 0} icon={<Bus />} color="orange" />
                        <StatCard title="Total Users" value={data.users?.length || 0} icon={<Users />} color="purple" />
                        <StatCard title="Total Bookings" value={data.bookings?.length || 0} icon={<Ticket />} color="blue" />
                    </div>

                    <div className="bg-white rounded-2xl shadow-md p-6 mb-8 border border-gray-100">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold">Ticket Check-in</h3>
                                <form onSubmit={handleCheckIn} className="mt-4 flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
                                            <Search size={16} className="text-gray-400" />
                                            <input id="ticketCode" type="text" value={ticketCode} onChange={(e) => setTicketCode(e.target.value)} placeholder="Enter ticket code..." className="w-full outline-none text-sm"/>
                                        </div>
                                    </div>
                                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"><Ticket size={16} /> Check In</button>
                                </form>
                                {checkInStatus.message && <p className={`mt-3 text-sm font-medium ${checkInStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{checkInStatus.message}</p>}
                            </div>
                            {checkedInBooking && (
                                <div className="w-full md:w-1/3 bg-gray-50 rounded-lg p-4 border">
                                    <h4 className="font-semibold">Booking Details</h4>
                                    <div className="text-sm mt-2 space-y-1">
                                        <p><span className="text-gray-600">Route:</span> {checkedInBooking.type === 'flight' ? `${checkedInBooking.origin} → ${checkedInBooking.destination}` : checkedInBooking.routeName}</p>
                                        <p><span className="text-gray-600">Passenger:</span> {checkedInBooking.passengers[0].firstName} {checkedInBooking.passengers[0].lastName}</p>
                                        <p><span className="text-gray-600">Status:</span> <span className="font-bold text-green-600">CHECKED-IN</span></p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-md p-4 mb-8 border border-gray-100">
                        <div className="flex flex-wrap gap-2">
                            {tabs.map(tab => (
                                <TabButton key={tab.id} {...tab} isActive={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
                            ))}
                        </div>
                    </div>

                    {error && <div className="text-red-600 font-medium mb-4">{error}</div>}
                    {loading && <div className="text-center p-10 font-semibold text-gray-600">Loading...</div>}

                    {!loading && !error && (
                        <div className="space-y-8">
                            {activeTab === 'flights' && <DataTable title="Manage Flights" items={data.flights || []} columns={columns.flights} selectedItems={selections.flights} onSelectionChange={(ids) => handleSelectionChange('flights', ids)} onBulkDelete={() => requestDeleteConfirmation(selections.flights, 'flights')} onSingleDelete={(item) => requestDeleteConfirmation([item.id], 'flights')} onAddClick={() => openModal('addFlight')} addLabel="Add Flight" onEdit={(item) => openModal('editFlight', item)}/>}
                            {activeTab === 'buses' && <DataTable title="Manage Buses" items={data.buses || []} columns={columns.buses} selectedItems={selections.buses} onSelectionChange={(ids) => handleSelectionChange('buses', ids)} onBulkDelete={() => requestDeleteConfirmation(selections.buses, 'buses')} onSingleDelete={(item) => requestDeleteConfirmation([item.id], 'buses')} onAddClick={() => openModal('addBus')} addLabel="Add Bus" onEdit={(item) => openModal('editBus', item)}/>}
                            {activeTab === 'coupons' && <DataTable title="Manage Coupon Codes" items={data.coupons || []} columns={columns.coupons} selectedItems={selections.coupons} onSelectionChange={(ids) => handleSelectionChange('coupons', ids)} onBulkDelete={() => requestDeleteConfirmation(selections.coupons, 'coupons')} onSingleDelete={(item) => requestDeleteConfirmation([item.id], 'coupons')} onAddClick={() => openModal('addCoupon')} addLabel="Add Coupon" onEdit={(item) => openModal('editCoupon', item)}/>}
                            {activeTab === 'banners' && <DataTable title="Manage Ad Banners" items={data.banners || []} columns={columns.banners} selectedItems={selections.banners} onSelectionChange={(ids) => handleSelectionChange('banners', ids)} onBulkDelete={() => requestDeleteConfirmation(selections.banners, 'banners')} onSingleDelete={(item) => requestDeleteConfirmation([item.id], 'banners')} onAddClick={() => openModal('addBanner')} addLabel="Add Banner" onEdit={(item) => openModal('editBanner', item)}/>}
                            {activeTab === 'users' && <DataTable title="User Management" items={filteredUsers} columns={columns.users} selectedItems={selections.users} onSelectionChange={(ids) => handleSelectionChange('users', ids)} onBulkDelete={() => requestDeleteConfirmation(selections.users, 'users')} onSingleDelete={(item) => requestDeleteConfirmation([item.id], 'users')}><div className="mb-2 w-full md:w-80"><div className="relative"><input type="search" placeholder="Search by email..." value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm pr-10"/><div className="absolute right-3 top-2.5 text-gray-400"><Search size={14} /></div></div></div></DataTable>}
                            {activeTab === 'bookings' && <DataTable title="All Bookings" items={filteredBookings} columns={columns.bookings} selectedItems={selections.bookings} onSelectionChange={(ids) => handleSelectionChange('bookings', ids)} onBulkDelete={() => requestDeleteConfirmation(selections.bookings, 'bookings')} onSingleDelete={(item) => requestDeleteConfirmation([item.id], 'bookings')}><div className="mb-2 w-full md:w-96"><div className="relative"><input type="search" placeholder="Search by ticket, email, passenger..." value={bookingSearchTerm} onChange={(e) => setBookingSearchTerm(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm pr-10"/><div className="absolute right-3 top-2.5 text-gray-400"><Search size={14} /></div></div></div></DataTable>}
                        </div>
                    )}
                </main>
            </div>

            <ConfirmModal isOpen={modals.confirmDelete} onClose={() => closeModal('confirmDelete')} onConfirm={executeDelete} title="Confirm Deletion"><p>Are you sure? This cannot be undone.</p></ConfirmModal>
            <AddFlightModal isOpen={modals.addFlight} onClose={() => closeModal('addFlight')} onSuccess={() => handleSuccess('addFlight')} />
            <AddBusModal isOpen={modals.addBus} onClose={() => closeModal('addBus')} onSuccess={() => handleSuccess('addBus')} />
            <AddCouponModal isOpen={modals.addCoupon} onClose={() => closeModal('addCoupon')} onSuccess={() => handleSuccess('addCoupon')} />
            <AddBannerModal isOpen={modals.addBanner} onClose={() => closeModal('addBanner')} onSuccess={() => handleSuccess('addBanner')} />

            {currentItem && (
                <>
                    <EditFlightModal isOpen={modals.editFlight} onClose={() => closeModal('editFlight')} flightData={currentItem} onSuccess={() => handleSuccess('editFlight')} />
                    <EditBusModal isOpen={modals.editBus} onClose={() => closeModal('editBus')} busData={currentItem} onSuccess={() => handleSuccess('editBus')} />
                    <EditCouponModal isOpen={modals.editCoupon} onClose={() => closeModal('editCoupon')} couponData={currentItem} onSuccess={() => handleSuccess('editCoupon')} />
                    <EditBannerModal isOpen={modals.editBanner} onClose={() => closeModal('editBanner')} bannerData={currentItem} onSuccess={() => handleSuccess('editBanner')} />
                </>
            )}
        </>
    );
};

export default AdminDashboard;

