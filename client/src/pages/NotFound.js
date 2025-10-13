import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center text-center p-4">
            <h1 className="text-6xl font-bold text-blue-600">404</h1>
            <h2 className="text-2xl font-semibold text-gray-800 mt-4">Page Not Found</h2>
            <p className="text-gray-600 mt-2">Sorry, the page you are looking for does not exist.</p>
            <Link 
                to="/" 
                className="mt-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-transform transform hover:scale-105"
            >
                Go Back to Home
            </Link>
        </div>
    );
};

export default NotFound;
