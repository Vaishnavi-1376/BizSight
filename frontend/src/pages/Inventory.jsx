// frontend/src/pages/Inventory.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// axios is usually imported if you're using it, but you're using 'fetch' directly, which is fine.
// If you intended to use axios, make sure it's installed (npm install axios) and imported.

// Modal component for editing products (remains the same as before, but add category)
const EditProductModal = ({ product, onClose, onSave }) => {
    const [name, setName] = useState(product.name);
    const [price, setPrice] = useState(product.price);
    const [stock, setStock] = useState(product.stock);
    const [category, setCategory] = useState(product.category); // New state for category
    const [error, setError] = useState('');

    const productCategories = ['Food', 'Clothes', 'Electronics', 'Books', 'Home Goods', 'Sports', 'Other'];

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        const parsedPrice = parseFloat(price);
        const parsedStock = parseInt(stock, 10);

        if (!name.trim() || isNaN(parsedPrice) || parsedPrice <= 0 || isNaN(parsedStock) || parsedStock < 0 || !category.trim()) {
            setError('Please enter valid product name, price (positive), stock (non-negative), and select a category.');
            return;
        }

        onSave(product._id, { name: name.trim(), price: parsedPrice, stock: parsedStock, category: category.trim() });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-700 relative">
                <h2 className="text-2xl font-bold text-white mb-6">Edit Product</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="editProductName" className="block text-sm font-medium text-gray-300 mb-1">Product Name</label>
                        <input
                            type="text"
                            id="editProductName"
                            className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="editProductPrice" className="block text-sm font-medium text-gray-300 mb-1">Price (₹)</label>
                        <input
                            type="number"
                            id="editProductPrice"
                            className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            step="0.01"
                            min="0"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="editProductStock" className="block text-sm font-medium text-gray-300 mb-1">Stock</label>
                        <input
                            type="number"
                            id="editProductStock"
                            className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            min="0"
                            step="1"
                            required
                        />
                    </div>
                    {/* NEW: Category field for editing */}
                    <div>
                        <label htmlFor="editProductCategory" className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                        <select
                            id="editProductCategory"
                            className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            required
                        >
                            <option value="">-- Select Category --</option>
                            {productCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 text-3xl leading-none"
                    aria-label="Close"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};


const Inventory = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedFile, setSelectedFile] = useState(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'
    const [products, setProducts] = useState([]); // To display current inventory
    const [loadingProducts, setLoadingProducts] = useState(true);

    // State for manual product entry form
    const [manualProductName, setManualProductName] = useState('');
    const [manualProductPrice, setManualProductPrice] = useState('');
    const [manualProductStock, setManualProductStock] = useState('');
    const [manualProductCategory, setManualProductCategory] = useState(''); // New state for category
    const [manualEntryMessage, setManualEntryMessage] = useState('');
    const [manualEntryMessageType, setManualEntryMessageType] = useState('');

    // State for editing
    const [editingProduct, setEditingProduct] = useState(null); // Holds the product object being edited, or null

    const productCategories = ['Food', 'Clothes', 'Electronics', 'Books', 'Home Goods', 'Sports', 'Other']; // Define categories

    const user = JSON.parse(localStorage.getItem('user'));
    const userName = user ? user.username : 'User';

    // --- Fetch Current Inventory ---
    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch('http://localhost:5000/api/inventory', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch inventory.');
            }

            const data = await response.json();
            setProducts(data);
        } catch (err) {
            setMessage(`Error fetching inventory: ${err.message}`);
            setMessageType('error');
            console.error("Error fetching inventory:", err);
        } finally {
            setLoadingProducts(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [navigate]);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
        setMessage(''); // Clear previous messages
        setManualEntryMessage(''); // Clear manual entry messages
    };

    const handleUpload = async (event) => {
        event.preventDefault();
        if (!selectedFile) {
            setMessage('Please select a file to upload.');
            setMessageType('error');
            return;
        }

        const formData = new FormData();
        // --- IMPORTANT CHANGE 1: Match the field name 'productsFile' with your backend multer configuration ---
        // Your backend (inventoryRoutes.js) uses `upload.single('productsFile')`.
        // The frontend `formData.append` key MUST match this.
        formData.append('productsFile', selectedFile); // Changed from 'inventoryFile' to 'productsFile'

        setMessage('Uploading...');
        setMessageType('');
        setManualEntryMessage('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch('http://localhost:5000/api/inventory/upload-csv', { // <-- IMPORTANT CHANGE 2: Corrected URL
                method: 'POST',
                headers: {
                    // 'Content-Type': 'multipart/form-data', // Do NOT set Content-Type header manually for FormData.
                    // The browser will set it correctly (with boundary) when you provide a FormData object.
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setMessageType('success');
                setSelectedFile(null); // Clear selected file
                fetchProducts(); // Refresh inventory list
            } else {
                setMessage(data.message || 'File upload failed.');
                setMessageType('error');
                if (data.details && data.details.initialParseErrors) {
                    data.details.initialParseErrors.forEach(err => console.error("CSV Parse Error:", err));
                    setMessage(prev => prev + ' Check console for CSV parsing issues.');
                }
                if (data.details && data.details.itemProcessingErrors) {
                    data.details.itemProcessingErrors.forEach(err => console.error("Product Processing Error:", err));
                    setMessage(prev => prev + ' Check console for product processing issues.');
                }
            }
        } catch (error) {
            setMessage(`Upload failed: ${error.message}`);
            setMessageType('error');
            console.error('Upload error:', error);
        }
    };

    // --- Handle Manual Product Submission ---
    const handleManualSubmit = async (event) => {
        event.preventDefault();
        setManualEntryMessage('');
        setManualEntryMessageType('');
        setMessage(''); // Clear CSV message

        if (!manualProductName || !manualProductPrice || !manualProductStock || !manualProductCategory) { // category required
            setManualEntryMessage('All fields (name, price, stock, category) are required.');
            setManualEntryMessageType('error');
            return;
        }

        const price = parseFloat(manualProductPrice);
        const stock = parseInt(manualProductStock, 10);

        if (isNaN(price) || price <= 0) {
            setManualEntryMessage('Price must be a positive number.');
            setManualEntryMessageType('error');
            return;
        }
        if (isNaN(stock) || stock < 0) {
            setManualEntryMessage('Stock must be a non-negative integer.');
            setManualEntryMessageType('error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch('http://localhost:5000/api/inventory', { // Assuming this hits the addProduct route (router.post('/'))
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: manualProductName.trim(),
                    price: price,
                    stock: stock,
                    category: manualProductCategory.trim() // Send the category
                })
            });

            const data = await response.json();

            if (response.ok) {
                setManualEntryMessage(data.message);
                setManualEntryMessageType('success');
                // Clear form fields
                setManualProductName('');
                setManualProductPrice('');
                setManualProductStock('');
                setManualProductCategory(''); // Clear category
                fetchProducts(); // Refresh inventory list
            } else {
                setManualEntryMessage(data.message || 'Failed to add product.');
                setManualEntryMessageType('error');
            }
        } catch (error) {
            setManualEntryMessage(`Error adding product: ${error.message}`);
            setManualEntryMessageType('error');
            console.error('Manual entry error:', error);
        }
    };

    // --- Handle Product Deletion ---
    const handleDelete = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            return;
        }

        setMessage('Deleting product...');
        setMessageType('');
        setManualEntryMessage(''); // Clear other messages

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`http://localhost:5000/api/inventory/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setMessageType('success');
                fetchProducts(); // Refresh inventory list
            } else {
                setMessage(data.message || 'Failed to delete product.');
                setMessageType('error');
            }
        } catch (error) {
            setMessage(`Error deleting product: ${error.message}`);
            setMessageType('error');
            console.error('Delete error:', error);
        }
    };

    // --- Handle Edit Click (opens modal) ---
    const handleEditClick = (product) => {
        setEditingProduct(product); // Set the product to be edited
        setMessage(''); // Clear any general messages
        setManualEntryMessage(''); // Clear any manual entry messages
    };

    // --- Handle Update Product (saves changes from modal) ---
    const handleUpdateProduct = async (productId, updatedData) => {
        setMessage('Updating product...');
        setMessageType('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`http://localhost:5000/api/inventory/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedData)
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setMessageType('success');
                setEditingProduct(null); // Close the modal
                fetchProducts(); // Refresh inventory list
            } else {
                setMessage(data.message || 'Failed to update product.');
                setMessageType('error');
            }
        } catch (error) {
            setMessage(`Error updating product: ${error.message}`);
            setMessageType('error');
            console.error('Update error:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 p-6 flex flex-col shadow-lg">
                <div className="text-2xl font-bold text-white mb-8">BizSight.</div>
                <nav className="space-y-4">
                    <a href="/dashboard" className={`block p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${location.pathname === '/dashboard' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Dashboard</a>
                    <a href="/inventory" className={`block p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${location.pathname === '/inventory' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Inventory</a>
                    <a href="/sales" className={`block p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${location.pathname === '/sales' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Sales</a>
                    <a href="/reports" className={`block p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${location.pathname === '/reports' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Reports</a>
                    <a href="/settings" className={`block p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${location.pathname === '/settings' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Settings</a>
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Navbar */}
                <header className="flex items-center justify-end p-6 bg-gray-800 shadow-lg">
                    <div className="flex items-center space-x-4">
                        <span className="text-lg text-gray-300">[{userName}]</span>
                        <button onClick={handleLogout} className="text-gray-300 hover:text-red-400 transition-colors duration-200 focus:outline-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </header>

                {/* Inventory Content */}
                <main className="flex-1 overflow-y-auto p-8">
                    <h1 className="text-3xl font-bold text-white mb-8">Inventory Management</h1>

                    {/* File Upload Section */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
                        <h2 className="text-xl font-semibold text-gray-300 mb-4">Upload Inventory CSV</h2>
                        <p className="text-sm text-gray-400 mb-4">
                            CSV must contain columns: <code className="bg-gray-700 p-1 rounded">name</code>, <code className="bg-gray-700 p-1 rounded">price</code>, <code className="bg-gray-700 p-1 rounded">stock</code>, <code className="bg-gray-700 p-1 rounded">category</code>.
                        </p>
                        <form onSubmit={handleUpload}>
                            <input
                                type="file"
                                accept=".csv" // Only allow CSV for now
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0 file:text-sm file:font-semibold
                                            file:bg-green-500 file:text-white hover:file:bg-green-600 mb-4"
                                // --- IMPORTANT: Ensure this input's name matches the backend's expected field ---
                                // While not explicitly set here, the formData.append needs the key.
                                // It's good practice to also add a name attribute to the input for clarity.
                                name="productsFile"
                            />
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                disabled={!selectedFile}
                            >
                                Upload CSV
                            </button>
                        </form>
                        {message && (
                            <p className={`mt-4 text-center ${messageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                {message}
                            </p>
                        )}
                    </div>

                    {/* Current Inventory Display */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8"> {/* Added mb-8 for spacing */}
                        <h2 className="text-xl font-semibold text-gray-300 mb-4">Current Inventory</h2>
                        {loadingProducts ? (
                            <div className="text-gray-400">Loading products...</div>
                        ) : products.length === 0 ? (
                            <div className="text-gray-400">No products found. Upload a CSV or add products manually.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead className="bg-gray-700">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Product Name
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Price (₹)
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Stock
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Category {/* New column */}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                                        {products.map((product) => (
                                            <tr key={product._id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">
                                                    {product.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    {product.price.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    {product.stock}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    {product.category} {/* Display category */}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium space-x-3">
                                                    <button
                                                        onClick={() => handleEditClick(product)}
                                                        className="text-indigo-400 hover:text-indigo-600"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product._id)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Manual Product Entry Section */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-300 mb-4">Add New Product Manually</h2>
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="productName" className="block text-sm font-medium text-gray-400 mb-1">Product Name</label>
                                <input
                                    type="text"
                                    id="productName"
                                    className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                                    value={manualProductName}
                                    onChange={(e) => setManualProductName(e.target.value)}
                                    placeholder="e.g., Gaming Mouse"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="productPrice" className="block text-sm font-medium text-gray-400 mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        id="productPrice"
                                        className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                                        value={manualProductPrice}
                                        onChange={(e) => setManualProductPrice(e.target.value)}
                                        placeholder="e.g., 50.00"
                                        step="0.01"
                                        min="0"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="productStock" className="block text-sm font-medium text-gray-400 mb-1">Stock</label>
                                    <input
                                        type="number"
                                        id="productStock"
                                        className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                                        value={manualProductStock}
                                        onChange={(e) => setManualProductStock(e.target.value)}
                                        placeholder="e.g., 100"
                                        min="0"
                                        step="1"
                                        required
                                    />
                                </div>
                            </div>
                            {/* NEW: Category field for manual add */}
                            <div>
                                <label htmlFor="productCategory" className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                                <select
                                    id="productCategory"
                                    className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                                    value={manualProductCategory}
                                    onChange={(e) => setManualProductCategory(e.target.value)}
                                    required
                                >
                                    <option value="">-- Select Category --</option>
                                    {productCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Add Product
                            </button>
                        </form>
                        {manualEntryMessage && (
                            <p className={`mt-4 text-center ${manualEntryMessageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                {manualEntryMessage}
                            </p>
                        )}
                    </div>
                </main>
            </div>

            {/* Edit Product Modal */}
            {editingProduct && (
                <EditProductModal
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)} // Close modal
                    onSave={handleUpdateProduct} // Call update function
                />
            )}
        </div>
    );
};

export default Inventory;