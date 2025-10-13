import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import Guards
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';

// Import Page Components
import Home from './pages/Home';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import UserProfile from './pages/UserProfile';
import BookingHistory from './pages/BookingHistory';
import SearchResults from './pages/SearchResults';
import BusSearchResults from './pages/BusSearchResults';
import BookingForm from './pages/BookingForm';
import TourBookingForm from './pages/TourBookingForm';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import HelpCenter from './pages/HelpCenter';
import Terms from './Terms';
import Deals from './pages/Deals';
import VerifyOTP from './pages/VerifyOTP'; // Import the VerifyOTP page

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/" element={<Home />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOTP />} /> {/* Add the new OTP route */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/search-bus" element={<BusSearchResults />} />

          {/* --- Protected User Routes --- */}
          <Route 
            path="/book/:from/:to" 
            element={<ProtectedRoute><BookingForm /></ProtectedRoute>} 
          />
          <Route 
            path="/book-tour/:tourName" 
            element={<ProtectedRoute><TourBookingForm /></ProtectedRoute>} 
          />
          <Route 
            path="/profile" 
            element={<ProtectedRoute><UserProfile /></ProtectedRoute>} 
          />
          <Route 
            path="/history" 
            element={<ProtectedRoute><BookingHistory /></ProtectedRoute>} 
          />

          {/* --- Admin Routes --- */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin/dashboard" 
            element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} 
          />
          
          {/* --- Catch-all 404 Route --- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

