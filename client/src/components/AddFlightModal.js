import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plane, Utensils, Wifi, Armchair, Calendar, Loader2, Percent, Image, PlusCircle, Trash2, Globe } from "lucide-react";

const AddFlightModal = ({ isOpen, onClose, onSuccess }) => {
    const today = new Date().toISOString().split("T")[0];

    const initialFlightData = useMemo(() => ({
        airline: "",
        flightNumber: "",
        originCity: "",
        destinationCity: "",
        departureTime: "",
        arrivalTime: "",
        economyPrice: "",
        businessPrice: "",
        stops: 0,
        stopLocations: [],
        inFlightServices: [],
        duration: "",
        date: "",
        seatsAvailable: "",
        flightType: "domestic", // Manual selector
        economyDomesticGst: "",
        businessDomesticGst: "",
        economyInternationalGst: "",
        businessInternationalGst: "",
        adBannerUrl: "",
        customFields: [],
    }), []);

    const [flightData, setFlightData] = useState(initialFlightData);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFlightData(initialFlightData);
            setError('');
        }
    }, [isOpen, initialFlightData]);

    useEffect(() => {
        if (flightData.departureTime && flightData.arrivalTime) {
            const departure = new Date(`1970-01-01T${flightData.departureTime}Z`);
            const arrival = new Date(`1970-01-01T${flightData.arrivalTime}Z`);
            let durationMinutes = (arrival.getTime() - departure.getTime()) / (1000 * 60);
            if (durationMinutes < 0) durationMinutes += 24 * 60;
            const hours = Math.floor(durationMinutes / 60);
            const minutes = durationMinutes % 60;
            setFlightData((prev) => ({ ...prev, duration: `${hours}h ${minutes}m` }));
        }
    }, [flightData.departureTime, flightData.arrivalTime]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === "checkbox") {
            setFlightData((prev) => ({
                ...prev,
                inFlightServices: checked ? [...(prev.inFlightServices || []), name] : (prev.inFlightServices || []).filter((service) => service !== name),
            }));
        } else {
            const isNumber = [
                "economyPrice", "businessPrice", "stops", "seatsAvailable",
                "economyDomesticGst", "businessDomesticGst", "economyInternationalGst", "businessInternationalGst"
            ].includes(name);
            const numericValue = isNumber ? Number(value) : value;

            setFlightData((prev) => {
                const updatedData = { ...prev, [name]: numericValue };
                if (name === "stops") {
                    const numStops = Number(value) >= 0 ? Number(value) : 0;
                    const currentStops = prev.stopLocations || [];
                     if (numStops > currentStops.length) {
                        updatedData.stopLocations = [...currentStops, ...Array(numStops - currentStops.length).fill('')];
                    } else {
                        updatedData.stopLocations = currentStops.slice(0, numStops);
                    }
                }
                if (name === "flightType") {
                    if (value === 'domestic') {
                        updatedData.economyInternationalGst = "";
                        updatedData.businessInternationalGst = "";
                    } else {
                        updatedData.economyDomesticGst = "";
                        updatedData.businessDomesticGst = "";
                    }
                }
                return updatedData;
            });
        }
    };

    const handleStopLocationChange = (index, value) => {
        setFlightData((prev) => {
            const newStopLocations = [...prev.stopLocations];
            newStopLocations[index] = value;
            return { ...prev, stopLocations: newStopLocations };
        });
    };

    const addCustomField = () => {
        setFlightData(prev => ({ ...prev, customFields: [...(prev.customFields || []), { key: '', value: '' }] }));
    };

    const removeCustomField = (index) => {
        setFlightData(prev => ({ ...prev, customFields: (prev.customFields || []).filter((_, i) => i !== index) }));
    };

    const handleCustomFieldChange = (index, field, value) => {
        const updatedFields = [...(flightData.customFields || [])];
        updatedFields[index][field] = value;
        setFlightData(prev => ({ ...prev, customFields: updatedFields }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        const token = sessionStorage.getItem("admin-token");
        const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

        try {
            const response = await fetch(`${apiUrl}/api/admin/flights`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(flightData),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || "Failed to create the flight route.");
            }
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const inputStyle = "w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";
    const labelStyle = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                    <motion.div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden" initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }}>
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center p-5">
                            <h3 className="text-xl font-bold flex items-center gap-2"><Plane size={24} /> Add New Flight</h3>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition"><X size={24} /></button>
                        </div>
                        <div className="p-6 max-h-[80vh] overflow-y-auto">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</p>}
                                <fieldset className="border rounded-lg p-4">
                                    <legend className="text-sm font-semibold px-2">Flight Identity</legend>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className={labelStyle}>Airline Name</label><input type="text" name="airline" value={flightData.airline} onChange={handleChange} required className={inputStyle} /></div>
                                        <div><label className={labelStyle}>Flight Number</label><input type="text" name="flightNumber" value={flightData.flightNumber} onChange={handleChange} required className={inputStyle} /></div>
                                    </div>
                                </fieldset>
                                <fieldset className="border rounded-lg p-4">
                                    <legend className="text-sm font-semibold px-2">Route & Schedule</legend>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2"><label className={`${labelStyle} flex items-center`}><Calendar size={16} className="mr-1"/> Date of Flight</label><input type="date" name="date" value={flightData.date} onChange={handleChange} required min={today} className={inputStyle} /></div>
                                        <div><label className={labelStyle}>Origin City</label><input type="text" name="originCity" value={flightData.originCity} onChange={handleChange} required className={inputStyle} /></div>
                                        <div><label className={labelStyle}>Destination City</label><input type="text" name="destinationCity" value={flightData.destinationCity} onChange={handleChange} required className={inputStyle} /></div>
                                        <div><label className={labelStyle}>Departure Time</label><input type="time" name="departureTime" value={flightData.departureTime} onChange={handleChange} required className={inputStyle} /></div>
                                        <div><label className={labelStyle}>Arrival Time</label><input type="time" name="arrivalTime" value={flightData.arrivalTime} onChange={handleChange} required className={inputStyle} /></div>
                                        <div className="md:col-span-2"><label className={labelStyle}>Duration</label><input type="text" name="duration" value={flightData.duration} readOnly placeholder="Auto-calculated" className={`${inputStyle} bg-gray-100 cursor-not-allowed`} /></div>
                                    </div>
                                </fieldset>
                                <fieldset className="border rounded-lg p-4">
                                    <legend className="text-sm font-semibold px-2">Pricing & Taxes</legend>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className={labelStyle}>Economy Price (₹)</label><input type="number" name="economyPrice" min="0" value={flightData.economyPrice} onChange={handleChange} required className={inputStyle} /></div>
                                        <div><label className={labelStyle}>Business Price (₹)</label><input type="number" name="businessPrice" min="0" value={flightData.businessPrice} onChange={handleChange} required className={inputStyle} /></div>
                                        <div className="md:col-span-2">
                                            <label className={`${labelStyle} flex items-center`}><Globe size={16} className="mr-1"/> Flight Type</label>
                                            <select name="flightType" value={flightData.flightType} onChange={handleChange} className={inputStyle}>
                                                <option value="domestic">Domestic</option>
                                                <option value="international">International</option>
                                            </select>
                                        </div>
                                        {flightData.flightType === 'domestic' && (
                                            <>
                                                <div><label className={`${labelStyle} flex items-center`}><Percent size={14} className="mr-1" /> Economy Domestic GST (%)</label><input type="number" name="economyDomesticGst" min="0" step="0.01" value={flightData.economyDomesticGst} onChange={handleChange} className={inputStyle} placeholder="e.g., 5" /></div>
                                                <div><label className={`${labelStyle} flex items-center`}><Percent size={14} className="mr-1" /> Business Domestic GST (%)</label><input type="number" name="businessDomesticGst" min="0" step="0.01" value={flightData.businessDomesticGst} onChange={handleChange} className={inputStyle} placeholder="e.g., 12" /></div>
                                            </>
                                        )}
                                        {flightData.flightType === 'international' && (
                                            <>
                                                <div><label className={`${labelStyle} flex items-center`}><Percent size={14} className="mr-1" /> Economy Intl. GST (%)</label><input type="number" name="economyInternationalGst" min="0" step="0.01" value={flightData.economyInternationalGst} onChange={handleChange} className={inputStyle} placeholder="e.g., 18" /></div>
                                                <div><label className={`${labelStyle} flex items-center`}><Percent size={14} className="mr-1" /> Business Intl. GST (%)</label><input type="number" name="businessInternationalGst" min="0" step="0.01" value={flightData.businessInternationalGst} onChange={handleChange} className={inputStyle} placeholder="e.g., 18" /></div>
                                            </>
                                        )}
                                    </div>
                                </fieldset>
                                <fieldset className="border rounded-lg p-4">
                                    <legend className="text-sm font-semibold px-2">Configuration</legend>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className={labelStyle}>Stops</label><input type="number" name="stops" min="0" value={flightData.stops} onChange={handleChange} required className={inputStyle} /></div>
                                        <div><label className={labelStyle}>Seats Available</label><input type="number" name="seatsAvailable" min="0" value={flightData.seatsAvailable} onChange={handleChange} required className={inputStyle} /></div>
                                    </div>
                                    {flightData.stops > 0 && (
                                        <div className="mt-4 border-t pt-4">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Stop Locations</h4>
                                            <div className="space-y-2">
                                                {(flightData.stopLocations || []).map((stop, index) => (
                                                    <div key={index}>
                                                        <label className={labelStyle}>Stop {index + 1} City</label>
                                                        <input type="text" value={stop} onChange={(e) => handleStopLocationChange(index, e.target.value)} required className={inputStyle} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </fieldset>
                                <fieldset className="border rounded-lg p-4">
                                    <legend className="text-sm font-semibold px-2">Services & Promotion</legend>
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">In-Flight Services</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <label className="flex items-center space-x-2"><input type="checkbox" name="In-flight Meal" checked={(flightData.inFlightServices || []).includes('In-flight Meal')} onChange={handleChange} className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" /><Utensils size={16} /><span>Meal</span></label>
                                            <label className="flex items-center space-x-2"><input type="checkbox" name="WiFi Available" checked={(flightData.inFlightServices || []).includes('WiFi Available')} onChange={handleChange} className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" /><Wifi size={16} /><span>WiFi</span></label>
                                            <label className="flex items-center space-x-2"><input type="checkbox" name="Extra Legroom" checked={(flightData.inFlightServices || []).includes('Extra Legroom')} onChange={handleChange} className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" /><Armchair size={16} /><span>Extra Legroom</span></label>
                                        </div>
                                    </div>
                                    <div className="mt-4 border-t pt-4">
                                        <label className={`${labelStyle} flex items-center mb-1`}><Image size={16} className="mr-1" /> Ad / Coupon Banner URL</label>
                                        <input type="text" name="adBannerUrl" value={flightData.adBannerUrl} onChange={handleChange} placeholder="https://example.com/banner.jpg" className={inputStyle} />
                                    </div>
                                </fieldset>
                                <fieldset className="border rounded-lg p-4">
                                    <legend className="text-sm font-semibold px-2">Additional Data</legend>
                                    {(flightData.customFields || []).map((field, index) => (
                                        <div key={index} className="flex items-center gap-2 mb-2">
                                            <input type="text" placeholder="Field Name" value={field.key} onChange={(e) => handleCustomFieldChange(index, 'key', e.target.value)} className={inputStyle} />
                                            <input type="text" placeholder="Field Value" value={field.value} onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)} className={inputStyle} />
                                            <button type="button" onClick={() => removeCustomField(index)} className="p-2 text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addCustomField} className="flex items-center gap-2 text-sm text-blue-600 font-semibold hover:text-blue-800 mt-2">
                                        <PlusCircle size={16} /> Add Custom Field
                                    </button>
                                </fieldset>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button type="button" onClick={onClose} className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition">Cancel</button>
                                    <button type="submit" disabled={loading} className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center gap-2 transition disabled:opacity-50">
                                        {loading && <Loader2 size={18} className="animate-spin" />}
                                        {loading ? "Saving..." : "Save Flight"}
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

export default AddFlightModal;

