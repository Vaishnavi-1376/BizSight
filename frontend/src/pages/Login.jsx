// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormInput from '../components/FormInput';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({
                _id: data._id,
                fullName: data.fullName,
                username: data.username,
                email: data.email,
                mobileNumber: data.mobileNumber
            }));

            navigate('/dashboard');

        } catch (err) {
            setError(err.message || 'An unexpected error occurred during login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        // Changed main background from bg-gray-950 to bg-gray-900 for a slightly lighter feel
        <div className="relative min-h-screen bg-gray-900 text-white flex items-center justify-center overflow-hidden font-sans">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-pink-500 to-red-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-80 h-80 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

            {/* Wrapper for gradient border effect - Still green-to-blue */}
            <div className="relative z-10 p-1.5 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 shadow-2xl">
                {/* Login Form Container (inner part) */}
                <div className="w-full max-w-sm mx-auto p-8 bg-gray-900 rounded-lg backdrop-filter backdrop-blur-sm bg-opacity-90">
                    <h2 className="text-3xl font-bold text-center text-white mb-8">Login to BizSight</h2>
                    {error && <p className="text-red-400 text-center mb-6 text-sm">{error}</p>}
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <FormInput
                            label="Username"
                            id="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                        <FormInput
                            label="Password"
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <button
                            type="submit"
                            // UPDATED: Login button gradient now matches Register page (green-to-blue)
                            className="w-full bg-gradient-to-br from-green-500 to-blue-600 text-white py-3 px-4 rounded-md text-lg font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? 'Logging In...' : 'Login'}
                        </button>
                    </form>
                    <p className="mt-8 text-center text-gray-300 text-base">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors duration-200">
                            Register Now
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;