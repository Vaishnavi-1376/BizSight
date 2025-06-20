// frontend/src/pages/HomePage.jsx (No changes needed in this file for font application)
import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
    return (
        <div className="relative min-h-screen bg-gray-950 text-white overflow-hidden font-sans">
            {/* Abstract Background Shapes (for uniqueness) */}
            <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-pink-500 to-red-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-80 h-80 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            
            {/* Content Container (to ensure content is above blobs) */}
            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Navbar */}
                <nav className="bg-transparent p-6 shadow-none">
                    <div className="container mx-auto flex justify-between items-center">
                        <Link to="/" className="text-white text-4xl font-extrabold tracking-tight drop-shadow-lg">
                            BizSight<span className="text-indigo-300">.</span>
                        </Link>
                        <div className="space-x-4">
                            <Link
                                to="/register"
                                className="inline-block bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-7 py-3 rounded-lg text-lg font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-1 shadow-xl"
                            >
                                Get Started
                            </Link>
                            <Link
                                to="/login"
                                className="inline-block border-2 border-white text-white px-7 py-3 rounded-lg text-lg font-semibold hover:bg-white hover:text-indigo-700 transition-all duration-300 transform hover:-translate-y-1 shadow-xl"
                            >
                                Login
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="flex-grow flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 text-center">
                    <div className="max-w-4xl mx-auto">
                        {/* The font-headline class is already here */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-8 drop-shadow-2xl font-headline">
                            Track - Analyze - Grow<br />All In One Place
                        </h1>
                        <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed mb-12">
                            Get clear insights and grow your business with ease.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center space-y-6 sm:space-y-0 sm:space-x-8">
                            <Link
                                to="/register"
                                className="inline-block bg-gradient-to-br from-green-400 to-blue-500 text-white px-10 py-5 rounded-full text-xl font-bold shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300"
                            >
                                Get Started
                            </Link>
                            <Link
                                to="/login"
                                className="inline-block bg-transparent border-2 border-white text-white px-10 py-5 rounded-full text-xl font-bold shadow-2xl transition-all duration-500 hover:bg-white hover:text-gray-900 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white"
                            >
                                Existing User? Log In
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-900 text-gray-400 p-4 text-center text-sm">
                    <p>&copy; 2025 BizSight. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default HomePage;