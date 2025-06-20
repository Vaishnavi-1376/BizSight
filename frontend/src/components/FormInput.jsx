// frontend/src/components/FormInput.jsx
import React from 'react';

const FormInput = ({ label, id, type, value, onChange, placeholder, required, labelClasses = '', inputClasses = '' }) => {
    return (
        // mb-4 is already set for spacing between inputs
        <div className="mb-4">
            <label htmlFor={id} className={`block text-lg font-medium text-gray-200 mb-2 ${labelClasses}`}>
                {label}
            </label>
            <input
                type={type}
                id={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                // Changed p-3 to p-2 for smaller input fields
                className={`w-full p-2 border border-gray-600 rounded-lg shadow-inner bg-gray-700 text-white 
                           focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 
                           transition-all duration-200 ease-in-out ${inputClasses}`}
            />
        </div>
    );
};

export default FormInput;