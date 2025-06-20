// frontend/src/pages/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormInput from '../components/FormInput';

const Register = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        mobileNumber: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    mobileNumber: formData.mobileNumber
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            setSuccessMessage('Registration successful! Redirecting to login...');
            setFormData({ fullName: '', username: '', email: '', password: '', confirmPassword: '', mobileNumber: '' });
            setTimeout(() => {
                navigate('/login');
            }, 1500);

        } catch (err) {
            setError(err.message || 'An unexpected error occurred during registration.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-gray-900 text-white flex items-center justify-center overflow-hidden font-sans py-12">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-pink-500 to-red-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-80 h-80 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

            {/* Wrapper for gradient border effect */}
            <div className="relative z-10 p-1.5 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 shadow-2xl">
                {/* Register Form Container (inner part) */}
                {/* Reduced padding from p-8 to p-6 */}
                <div className="w-full max-w-sm mx-auto p-6 bg-gray-900 rounded-lg backdrop-filter backdrop-blur-sm bg-opacity-90">
                    {/* Reduced margin-bottom from mb-8 to mb-6 */}
                    <h2 className="text-3xl font-bold text-center text-white mb-6">Create Your BizSight Account</h2>
                    {error && <p className="text-red-400 text-center mb-6 text-sm">{error}</p>}
                    {successMessage && <p className="text-green-400 text-center mb-6 text-sm">{successMessage}</p>}
                    
                    {/* Reduced space-y from space-y-6 to space-y-4 */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <FormInput
                            label="Full Name"
                            id="fullName"
                            type="text"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                        />
                        <FormInput
                            label="Username"
                            id="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                        <FormInput
                            label="Email Address"
                            id="email"
                            type="email"
                            value={formData.email}
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
                        <FormInput
                            label="Confirm Password"
                            id="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                        <FormInput
                            label="Mobile Number"
                            id="mobileNumber"
                            type="text"
                            value={formData.mobileNumber}
                            onChange={handleChange}
                            required
                        />
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-br from-green-500 to-blue-600 text-white py-3 px-4 rounded-md text-lg font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? 'Registering...' : 'Register'}
                        </button>
                    </form>
                    {/* Reduced margin-top from mt-8 to mt-6 */}
                    <p className="mt-6 text-center text-gray-300 text-base">
                        Already have an account?{' '}
                        <Link to="/login" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors duration-200">
                            Login Here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;