import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Wind, Wifi, Tv, Calendar, Bus, Percent, Image, PlusCircle, Trash2, Loader2 } from 'lucide-react';

const EditBusModal = ({ isOpen, onClose, onSuccess, busData }) => {
    const today = new Date().toISOString().split('T')[0];
    
    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (busData) {
            // Set default empty arrays for fields that might be missing from older data
            setFormData({
                amenities: [],
                customFields: [],
                ...busData
            });
        }
    }, [busData]);

    useEffect(() => {
        if (formData.departureTime && formData.arrivalTime) {
            const departure = new Date(`1970-01-01T${formData.departureTime}Z`);
            const arrival = new Date(`1970-01-01T${formData.arrivalTime}Z`);
            let durationMinutes = (arrival.getTime() - departure.getTime()) / (1000 * 60);
            if (durationMinutes < 0) durationMinutes += 24 * 60;
            const hours = Math.floor(durationMinutes / 60);
            const minutes = durationMinutes % 60;
            setFormData(prev => ({ ...prev, duration: `${hours}h ${minutes}m` }));
        }
    }, [formData.departureTime, formData.arrivalTime]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                amenities: checked
                    ? [...(prev.amenities || []), name]
                    : (prev.amenities || []).filter(amenity => amenity !== name)
            }));
        } else {
            const isNumber = ['price', 'seatsAvailable', 'rating', 'gst', 'cleanlinessFare', 'maintenanceFare', 'hygieneFare'].includes(name);
            setFormData(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
        }
    };

    const addCustomField = () => {
        setFormData(prev => ({ ...prev, customFields: [...(prev.customFields || []), { key: '', value: '' }] }));
    };

    const removeCustomField = (index) => {
        setFormData(prev => ({ ...prev, customFields: (prev.customFields || []).filter((_, i) => i !== index) }));
    };

    const handleCustomFieldChange = (index, field, value) => {
        const updatedFields = [...(formData.customFields || [])];
        updatedFields[index][field] = value;
        setFormData(prev => ({ ...prev, customFields: updatedFields }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const token = sessionStorage.getItem('admin-token');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        try {
            const response = await fetch(`${apiUrl}/api/admin/buses/${formData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to update the bus route.');
            }
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputStyle = "w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";
    const labelStyle = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
                    <motion.div
                        className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden"
                        initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }}
                    >
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white flex justify-between items-center p-5">
                            <h3 className="text-xl font-bold flex items-center gap-2"><Bus size={24} /> Edit Bus Route</h3>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition"><X size={24} /></button>
                        </div>
                        <div className="p-6 max-h-[80vh] overflow-y-auto">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</p>}
                                <fieldset className="border rounded-lg p-4">
                                    <legend className="text-sm font-semibold px-2">Bus Identity</legend>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div><label className={labelStyle}>Operator Name</label><input type="text" name="operator" value={formData.operator || ''} onChange={handleChange} required className={inputStyle} /></div>
                                        <div><label className={labelStyle}>Bus Type</label><input type="text" name="busType" value={formData.busType || ''} onChange={handleChange} required className={inputStyle} /></div>
                                        <div><label className={labelStyle}>Category</label><select name="category" value={formData.category || 'Private'} onChange={handleChange} className={inputStyle}><option value="Private">Private</option><option value="Government">Government</option></select></div>
                                    </div>
                                </fieldset>
                                <fieldset className="border rounded-lg p-4">
                                    <legend className="text-sm font-semibold px-2">Route & Schedule</legend>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="lg:col-span-3"><label className={`${labelStyle} flex items-center`}><Calendar size={16} className="mr-1" /> Date of Travel</label><input type="date" name="date" value={formData.date || ''} onChange={handleChange} required min={today} className={inputStyle} /></div>
                                        <div><label className={labelStyle}>Origin City</label><input type="text" name="originCity" value={formData.originCity || ''} onChange={handleChange} required className={inputStyle} /></div>
                                        <div><label className={labelStyle}>Destination City</label><input type="text" name="destinationCity" value={formData.destinationCity || ''} onChange={handleChange} required className={inputStyle} /></div>
                                        <div><label className={labelStyle}>Departure Time</label><input type="time" name="departureTime" value={formData.departureTime || ''} onChange={handleChange} required className={inputStyle} /></div>
                                        <div><label className={labelStyle}>Arrival Time</label><input type="time" name="arrivalTime" value={formData.arrivalTime || ''} onChange={handleChange} required className={inputStyle} /></div>
                                        <div className="md:col-span-2 lg:col-span-1"><label className={labelStyle}>Duration</label><input type="text" name="duration" value={formData.duration || ''} readOnly placeholder="Auto-calculated" className={`${inputStyle} bg-gray-100 cursor-not-allowed`} /></div>
                                    </div>
                                </fieldset>
                                <fieldset className="border rounded-lg p-4">
                                    <legend className="text-sm font-semibold px-2">Pricing & Fares</legend>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div><label className={labelStyle}>Base Price (₹)</label><input type="number" name="price" min="0" value={formData.price || ''} onChange={handleChange} required className={inputStyle} /></div>
                                        <div><label className={labelStyle}>Seats Available</label><input type="number" name="seatsAvailable" min="0" value={formData.seatsAvailable || ''} onChange={handleChange} required className={inputStyle} /></div>
                                        <div><label className={`${labelStyle} flex items-center`}><Percent size={14} className="mr-1" /> GST (%)</label><input type="number" name="gst" min="0" step="0.01" placeholder="e.g., 5" value={formData.gst || ''} onChange={handleChange} className={inputStyle} /></div>
                                        <div><label className={labelStyle}>Cleanliness Fare (₹)</label><input type="number" name="cleanlinessFare" min="0" value={formData.cleanlinessFare || ''} onChange={handleChange} className={inputStyle} placeholder="e.g., 50" /></div>
                                        <div><label className={labelStyle}>Maintenance Fare (₹)</label><input type="number" name="maintenanceFare" min="0" value={formData.maintenanceFare || ''} onChange={handleChange} className={inputStyle} placeholder="e.g., 30" /></div>
                                        <div><label className={labelStyle}>Hygiene Fare (₹)</label><input type="number" name="hygieneFare" min="0" value={formData.hygieneFare || ''} onChange={handleChange} className={inputStyle} placeholder="e.g., 20" /></div>
                                    </div>
                                </fieldset>
                                <fieldset className="border rounded-lg p-4">
                                    <legend className="text-sm font-semibold px-2">Features & Promotion</legend>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Amenities</h4>
                                            <div className="flex flex-col space-y-2">
                                                <label className="flex items-center space-x-2"><input type="checkbox" name="AC" checked={(formData.amenities || []).includes('AC')} onChange={handleChange} className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" /><Wind size={16} /><span>A/C</span></label>
                                                <label className="flex items-center space-x-2"><input type="checkbox" name="WiFi" checked={(formData.amenities || []).includes('WiFi')} onChange={handleChange} className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" /><Wifi size={16} /><span>WiFi</span></label>
                                                <label className="flex items-center space-x-2"><input type="checkbox" name="LiveTV" checked={(formData.amenities || []).includes('LiveTV')} onChange={handleChange} className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" /><Tv size={16} /><span>Live TV</span></label>
                                            </div>
                                        </div>
                                        <div>
                                            <label className={`${labelStyle} flex items-center`}><Star size={16} className="mr-1 text-yellow-500" /> Rating (0-5)</label>
                                            <input type="number" name="rating" value={formData.rating || ''} onChange={handleChange} min="0" max="5" step="0.1" className={inputStyle} />
                                        </div>
                                    </div>
                                    <div className="mt-4 border-t pt-4">
                                        <label className={`${labelStyle} flex items-center mb-1`}><Image size={16} className="mr-1" /> Ad / Coupon Banner URL</label>
                                        <input type="text" name="adBannerUrl" value={formData.adBannerUrl || ''} onChange={handleChange} placeholder="https://example.com/banner.jpg" className={inputStyle} />
                                    </div>
                                </fieldset>
                                <fieldset className="border rounded-lg p-4">
                                    <legend className="text-sm font-semibold px-2">Additional Data</legend>
                                    {(formData.customFields || []).map((field, index) => (
                                        <div key={index} className="flex items-center gap-2 mb-2">
                                            <input type="text" placeholder="Field Name (e.g., Driver)" value={field.key || ''} onChange={(e) => handleCustomFieldChange(index, 'key', e.target.value)} className={inputStyle} />
                                            <input type="text" placeholder="Field Value (e.g., Suresh)" value={field.value || ''} onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)} className={inputStyle} />
                                            <button type="button" onClick={() => removeCustomField(index)} className="p-2 text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addCustomField} className="flex items-center gap-2 text-sm text-blue-600 font-semibold hover:text-blue-800 mt-2">
                                        <PlusCircle size={16} /> Add Custom Field
                                    </button>
                                </fieldset>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button type="button" onClick={onClose} className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition">Cancel</button>
                                    <button type="submit" disabled={loading} className="px-5 py-2 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 flex items-center gap-2 transition disabled:opacity-50">
                                        {loading && <Loader2 size={18} className="animate-spin" />}
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default EditBusModal;