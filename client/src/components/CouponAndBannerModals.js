import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, ImageIcon, Loader2, Percent, Link, AlertCircle } from 'lucide-react';

// --- Reusable UI Components ---
const ModalWrapper = ({ isOpen, onClose, title, children }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                    initial={{ scale: 0.9, y: 50, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 50, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="bg-gray-50 flex justify-between items-center p-5 border-b">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">{title}</h3>
                        <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 transition" aria-label="Close modal"><X size={24} /></button>
                    </div>
                    <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

const InputField = ({ name, label, type = 'text', value, onChange, error, icon, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">{icon}</span>
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                className={`w-full p-2 pl-10 border rounded-lg ${error ? 'border-red-500' : 'border-gray-300'} focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                {...props}
            />
        </div>
        {error && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14}/>{error}</p>}
    </div>
);

// --- Validation Logic ---
const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;

const validateCoupon = (data) => {
    const errors = {};
    if (!data.code) errors.code = 'Coupon code is required.';
    else if (!/^[A-Z0-9]+$/.test(data.code)) errors.code = 'Code must be uppercase letters and numbers only.';
    if (!data.discountValue || data.discountValue <= 0) errors.discountValue = 'Discount value must be a positive number.';
    if (data.discountType === 'percentage' && data.discountValue > 100) errors.discountValue = 'Percentage cannot exceed 100.';
    if (data.imageUrl && !urlRegex.test(data.imageUrl)) errors.imageUrl = 'Please enter a valid URL.';
    return errors;
};

const validateBanner = (data) => {
    const errors = {};
    if (!data.imageUrl) errors.imageUrl = 'Image URL is required.';
    else if (!urlRegex.test(data.imageUrl)) errors.imageUrl = 'Please enter a valid URL.';
    if (!data.redirectUrl) errors.redirectUrl = 'Redirect URL is required.';
    else if (!urlRegex.test(data.redirectUrl)) errors.redirectUrl = 'Please enter a valid URL.';
    return errors;
};

// --- API Helper ---
const apiCall = async (endpoint, method, body) => {
    const token = sessionStorage.getItem("admin-token");
    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    
    const response = await fetch(`${apiUrl}/api/admin/${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Failed to ${method.toLowerCase()} the item.`);
    }
    return response.json();
};

// --- Coupon Modals ---
export const AddCouponModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ code: '', discountType: 'percentage', discountValue: '', isActive: true, imageUrl: '', appliesTo: 'all' });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = name === 'code' ? value.toUpperCase() : (type === 'checkbox' ? checked : value);
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateCoupon(formData);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;
        
        setLoading(true);
        try {
            await apiCall('coupons', 'POST', formData);
            onSuccess();
        } catch (err) {
            setErrors({ submit: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title={<><Tag size={24} /> Add New Coupon</>}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {errors.submit && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{errors.submit}</p>}
                <InputField name="code" label="Coupon Code" value={formData.code} onChange={handleChange} error={errors.code} icon={<Tag size={16}/>} placeholder="E.g., SUMMER25" />
                <InputField name="imageUrl" label="Image URL (Optional)" type="url" value={formData.imageUrl} onChange={handleChange} error={errors.imageUrl} icon={<ImageIcon size={16}/>} placeholder="https://example.com/coupon.png" />
                
                {/* ✅ NEW: Applies To field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Applies To</label>
                    <select name="appliesTo" value={formData.appliesTo} onChange={handleChange} className="w-full p-2 border rounded-lg border-gray-300">
                        <option value="all">All Services</option>
                        <option value="flights">Flights Only</option>
                        <option value="buses">Buses Only</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                    <select name="discountType" value={formData.discountType} onChange={handleChange} className="w-full p-2 border rounded-lg border-gray-300"><option value="percentage">Percentage (%)</option><option value="fixed">Fixed Amount (₹)</option></select>
                </div>
                <InputField name="discountValue" label="Discount Value" type="number" value={formData.discountValue} onChange={handleChange} error={errors.discountValue} icon={formData.discountType === 'percentage' ? <Percent size={16}/> : <span className="text-base">₹</span>} placeholder="E.g., 15" />
                <div className="flex items-center gap-2 pt-2"><input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} id="coupon-active" className="h-4 w-4 rounded" /><label htmlFor="coupon-active" className="text-sm font-medium text-gray-700">Set as Active</label></div>
                <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300">Cancel</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold flex items-center gap-2 disabled:bg-blue-400">{loading ? <><Loader2 className="animate-spin" /> Saving...</> : 'Save Coupon'}</button>
                </div>
            </form>
        </ModalWrapper>
    );
};

export const EditCouponModal = ({ isOpen, onClose, onSuccess, couponData }) => {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    
    useEffect(() => { setFormData(couponData || {}); }, [couponData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = name === 'code' ? value.toUpperCase() : (type === 'checkbox' ? checked : value);
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateCoupon(formData);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        setLoading(true);
        try {
            await apiCall(`coupons/${formData.id}`, 'PUT', formData);
            onSuccess();
        } catch (err) {
            setErrors({ submit: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title={<><Tag size={24} /> Edit Coupon</>}>
             <form onSubmit={handleSubmit} className="space-y-4">
                {errors.submit && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{errors.submit}</p>}
                <InputField name="code" label="Coupon Code" value={formData.code || ''} onChange={handleChange} error={errors.code} icon={<Tag size={16}/>} />
                <InputField name="imageUrl" label="Image URL (Optional)" type="url" value={formData.imageUrl || ''} onChange={handleChange} error={errors.imageUrl} icon={<ImageIcon size={16}/>} />
                
                {/* ✅ NEW: Applies To field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Applies To</label>
                    <select name="appliesTo" value={formData.appliesTo || 'all'} onChange={handleChange} className="w-full p-2 border rounded-lg border-gray-300">
                        <option value="all">All Services</option>
                        <option value="flight">Flight Only</option>
                        <option value="bus">Bus Only</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                    <select name="discountType" value={formData.discountType || 'percentage'} onChange={handleChange} className="w-full p-2 border rounded-lg border-gray-300"><option value="percentage">Percentage (%)</option><option value="fixed">Fixed Amount (₹)</option></select>
                </div>
                <InputField name="discountValue" label="Discount Value" type="number" value={formData.discountValue || ''} onChange={handleChange} error={errors.discountValue} icon={formData.discountType === 'percentage' ? <Percent size={16}/> : <span className="text-base">₹</span>} />
                <div className="flex items-center gap-2 pt-2"><input type="checkbox" name="isActive" checked={formData.isActive || false} onChange={handleChange} id="edit-coupon-active" className="h-4 w-4 rounded" /><label htmlFor="edit-coupon-active" className="text-sm font-medium text-gray-700">Set as Active</label></div>
                <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300">Cancel</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold flex items-center gap-2 disabled:bg-blue-400">{loading ? <><Loader2 className="animate-spin" /> Saving...</> : 'Save Changes'}</button>
                </div>
            </form>
        </ModalWrapper>
    );
};

// --- Banner Modals ---
export const AddBannerModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ imageUrl: '', redirectUrl: '', isActive: true, appliesTo: 'all' });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateBanner(formData);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;
        
        setLoading(true);
        try {
            await apiCall('banners', 'POST', formData);
            onSuccess();
        } catch (err) {
            setErrors({ submit: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title={<><ImageIcon size={24} /> Add New Banner</>}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {errors.submit && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{errors.submit}</p>}
                <InputField name="imageUrl" label="Image URL" type="url" value={formData.imageUrl} onChange={handleChange} error={errors.imageUrl} icon={<ImageIcon size={16}/>} placeholder="https://example.com/image.png" />
                <InputField name="redirectUrl" label="Redirect URL" type="url" value={formData.redirectUrl} onChange={handleChange} error={errors.redirectUrl} icon={<Link size={16}/>} placeholder="https://example.com/offer-page" />
                
                {/* ✅ NEW: Applies To field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Applies To</label>
                    <select name="appliesTo" value={formData.appliesTo} onChange={handleChange} className="w-full p-2 border rounded-lg border-gray-300">
                        <option value="all">All Services</option>
                        <option value="flight">Flight Only</option>
                        <option value="bus">Bus Only</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 pt-2"><input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} id="banner-active" className="h-4 w-4 rounded"/><label htmlFor="banner-active" className="text-sm font-medium text-gray-700">Set as Active</label></div>
                {formData.imageUrl && !errors.imageUrl && <img src={formData.imageUrl} alt="preview" className="rounded-lg mt-2 max-h-40 w-full object-contain border" />}
                <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300">Cancel</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold flex items-center gap-2 disabled:bg-blue-400">{loading ? <><Loader2 className="animate-spin" /> Saving...</> : 'Save Banner'}</button>
                </div>
            </form>
        </ModalWrapper>
    );
};

export const EditBannerModal = ({ isOpen, onClose, onSuccess, bannerData }) => {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    
    useEffect(() => { setFormData(bannerData || {}); }, [bannerData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateBanner(formData);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        setLoading(true);
        try {
            await apiCall(`banners/${formData.id}`, 'PUT', formData);
            onSuccess();
        } catch (err) {
            setErrors({ submit: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title={<><ImageIcon size={24} /> Edit Banner</>}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {errors.submit && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{errors.submit}</p>}
                <InputField name="imageUrl" label="Image URL" type="url" value={formData.imageUrl || ''} onChange={handleChange} error={errors.imageUrl} icon={<ImageIcon size={16}/>} />
                <InputField name="redirectUrl" label="Redirect URL" type="url" value={formData.redirectUrl || ''} onChange={handleChange} error={errors.redirectUrl} icon={<Link size={16}/>} />
                
                 {/* ✅ NEW: Applies To field */}
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Applies To</label>
                    <select name="appliesTo" value={formData.appliesTo || 'all'} onChange={handleChange} className="w-full p-2 border rounded-lg border-gray-300">
                        <option value="all">All Services</option>
                        <option value="flight">Flight Only</option>
                        <option value="bus">Bus Only</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 pt-2"><input type="checkbox" name="isActive" checked={formData.isActive || false} onChange={handleChange} id="edit-banner-active" className="h-4 w-4 rounded" /><label htmlFor="edit-banner-active" className="text-sm font-medium text-gray-700">Set as Active</label></div>
                {formData.imageUrl && !errors.imageUrl && <img src={formData.imageUrl} alt="preview" className="rounded-lg mt-2 max-h-40 w-full object-contain border" />}
                <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300">Cancel</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold flex items-center gap-2 disabled:bg-blue-400">{loading ? <><Loader2 className="animate-spin" /> Saving...</> : 'Save Changes'}</button>
                </div>
            </form>
        </ModalWrapper>
    );
};

