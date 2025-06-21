// frontend/src/pages/Sales.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// REMOVE THIS LINE: import { QrReader } from 'react-qr-reader';
// ADD THIS LINE:
import Html5QrCodeScanner from '../components/Html5QrCodeScanner'; // Adjust path if you put it elsewhere

const Sales = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [sales, setSales] = useState([]);
    const [loadingSales, setLoadingSales] = useState(true);

    // State for Sales CSV upload
    const [selectedSalesFile, setSelectedSalesFile] = useState(null);
    const [salesUploadMessage, setSalesUploadMessage] = useState('');
    const [salesUploadMessageType, setSalesUploadMessageType] = useState('');

    // State for Manual Sale Entry
    const [manualSaleProductId, setManualSaleProductId] = useState('');
    const [manualSaleQuantity, setManualSaleQuantity] = useState(1);
    const [manualSaleDate, setManualSaleDate] = useState('');
    const [manualSaleTime, setManualSaleTime] = useState('');
    const [manualSaleMessage, setManualSaleMessage] = useState('');
    const [manualSaleMessageType, setManualSaleMessageType] = useState('');

    // State for QR Code Scanner
    const [qrScanResult, setQrScanResult] = useState('');
    const [showQrScanner, setShowQrScanner] = useState(false);
    const [qrScanError, setQrScanError] = useState('');

    const user = JSON.parse(localStorage.getItem('user'));
    const userName = user ? user.username : 'User';

    // --- Fetch All Products for Sales Entry (for dropdown) ---
    const fetchAllProducts = async () => {
        setLoadingProducts(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await fetch('http://localhost:5000/api/inventory', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch products for sales entry.');
            }
            const data = await response.json();
            setProducts(data);
        } catch (err) {
            console.error('Error fetching products:', err.message);
            setManualSaleMessage(`Error fetching products: ${err.message}`);
            setManualSaleMessageType('error');
        } finally {
            setLoadingProducts(false);
        }
    };

    // --- Fetch All Sales ---
    const fetchSales = async () => {
        setLoadingSales(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await fetch('http://localhost:5000/api/sales', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch sales history.');
            }
            const data = await response.json();
            setSales(data);
        } catch (err) {
            console.error('Error fetching sales:', err.message);
            setSalesUploadMessage(`Error fetching sales history: ${err.message}`);
            setSalesUploadMessageType('error');
        } finally {
            setLoadingSales(false);
        }
    };

    useEffect(() => {
        fetchAllProducts();
        fetchSales();
        const now = new Date();
        setManualSaleDate(now.toISOString().split('T')[0]);
        setManualSaleTime(now.toTimeString().split(' ')[0].substring(0, 5));
    }, [navigate]);

    // --- Handle Sales CSV Upload ---
    const handleSalesFileChange = (event) => {
        setSelectedSalesFile(event.target.files[0]);
        setSalesUploadMessage('');
        setManualSaleMessage('');
        setQrScanResult('');
        setQrScanError('');
    };

    const handleSalesUpload = async (event) => {
        event.preventDefault();
        if (!selectedSalesFile) {
            setSalesUploadMessage('Please select a file to upload.');
            setSalesUploadMessageType('error');
            return;
        }

        const formData = new FormData();
        formData.append('salesFile', selectedSalesFile);

        setSalesUploadMessage('Uploading sales CSV...');
        setSalesUploadMessageType('');
        setManualSaleMessage('');
        setQrScanResult('');
        setQrScanError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch('http://localhost:5000/api/sales/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setSalesUploadMessage(data.message);
                setSalesUploadMessageType('success');
                setSelectedSalesFile(null);
                fetchSales();
                fetchAllProducts();
            } else {
                let errorMessage = data.message || 'Sales CSV upload failed.';
                if (data.details) {
                    if (data.details.initialParseErrors && data.details.initialParseErrors.length > 0) {
                        errorMessage += ' Check console for CSV parsing issues.';
                        data.details.initialParseErrors.forEach(err => console.error("CSV Parse Error:", err));
                    }
                    if (data.details.failedSalesCount > 0 && data.details.salesProcessingErrors) {
                        errorMessage += ' Check console for individual sale processing issues.';
                        data.details.salesProcessingErrors.forEach(err => console.error("Sale Processing Error:", err));
                    }
                }
                setSalesUploadMessage(errorMessage);
                setSalesUploadMessageType('error');
            }
        } catch (error) {
            setSalesUploadMessage(`Upload failed: ${error.message}`);
            setSalesUploadMessageType('error');
            console.error('Sales CSV upload error:', error);
        }
    };

    // --- Handle Manual Sale Submission ---
    const handleManualSaleSubmit = async (event) => {
        event.preventDefault();
        setManualSaleMessage('');
        setManualSaleMessageType('');
        setSalesUploadMessage('');
        setQrScanResult('');
        setQrScanError('');

        if (!manualSaleProductId || parseInt(manualSaleQuantity) <= 0) {
            setManualSaleMessage('Please select a product and enter a positive quantity.');
            setManualSaleMessageType('error');
            return;
        }

        const product = products.find(p => p._id === manualSaleProductId);
        const qty = parseInt(manualSaleQuantity, 10);

        if (!product) {
            setManualSaleMessage('Selected product not found in inventory.');
            setManualSaleMessageType('error');
            return;
        }
        if (product.stock < qty) {
            setManualSaleMessage(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${qty}.`);
            setManualSaleMessageType('error');
            return;
        }

        const combinedDateTime = manualSaleDate && manualSaleTime ?
                                  new Date(`${manualSaleDate}T${manualSaleTime}:00`) :
                                  new Date();

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch('http://localhost:5000/api/sales/manual-entry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: manualSaleProductId,
                    quantity: qty,
                    saleDate: combinedDateTime.toISOString()
                })
            });

            const data = await response.json();

            if (response.ok) {
                setManualSaleMessage(data.message);
                setManualSaleMessageType('success');
                setManualSaleProductId('');
                setManualSaleQuantity(1);
                const now = new Date();
                setManualSaleDate(now.toISOString().split('T')[0]);
                setManualSaleTime(now.toTimeString().split(' ')[0].substring(0, 5));
                setQrScanResult('');

                fetchSales();
                fetchAllProducts();
            } else {
                setManualSaleMessage(data.message || 'Failed to record sale.');
                setManualSaleMessageType('error');
            }
        } catch (error) {
            setManualSaleMessage(`Error recording sale: ${error.message}`);
            setManualSaleMessageType('error');
            console.error('Manual sale entry error:', error);
        }
    };

    // --- QR Scanner Handlers (now use new Html5QrCodeScanner component) ---
    const handleScanSuccess = (decodedText, decodedResult) => {
        // Prevent multiple scans from rapidly filling the input
        if (decodedText && decodedText !== qrScanResult) {
            setQrScanResult(decodedText);
            setManualSaleProductId(decodedText);
            setQrScanError('');
            setManualSaleQuantity(1); // Default to 1 for scanned items

            const scannedProduct = products.find(p => p._id === decodedText);
            if (!scannedProduct) {
                setManualSaleMessage('Scanned product not found in inventory. Please check the QR code or add the product.');
                setManualSaleMessageType('error');
            } else {
                setManualSaleMessage(`Product "${scannedProduct.name}" scanned successfully.`);
                setManualSaleMessageType('success');
            }
        }
    };

    const handleScanError = (errorMessage) => {
        // Only update error if it's not a 'QR code not found' message
        if (errorMessage && !errorMessage.includes('No QR code found')) {
            setQrScanError(`Scanner Error: ${errorMessage}`);
            console.warn(`QR Scanner Error: ${errorMessage}`);
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

                {/* Sales Content */}
                <main className="flex-1 overflow-y-auto p-8">
                    <h1 className="text-3xl font-bold text-white mb-8">Sales Management (Offline Store)</h1>

                    {/* Sales CSV Upload Section */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
                        <h2 className="text-xl font-semibold text-gray-300 mb-4">Upload Sales Data (CSV)</h2>
                        <p className="text-sm text-gray-400 mb-4">
                            CSV must contain columns: <code className="bg-gray-700 p-1 rounded">productName</code>, <code className="bg-gray-700 p-1 rounded">quantity</code>.
                            Optional columns: <code className="bg-gray-700 p-1 rounded">priceAtSale</code>, <code className="bg-gray-700 p-1 rounded">saleDate</code> (YYYY-MM-DD).
                        </p>
                        <form onSubmit={handleSalesUpload}>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleSalesFileChange}
                                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0 file:text-sm file:font-semibold
                                            file:bg-green-500 file:text-white hover:file:bg-green-600 mb-4"
                            />
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                disabled={!selectedSalesFile}
                            >
                                Upload Sales CSV
                            </button>
                        </form>
                        {salesUploadMessage && (
                            <p className={`mt-4 text-center ${salesUploadMessageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                {salesUploadMessage}
                            </p>
                        )}
                    </div>

                    {/* Manual Sale Entry Section with QR */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
                        <h2 className="text-xl font-semibold text-gray-300 mb-4">Record New Sale (Manual or QR Scan)</h2>

                        <div className="mb-6">
                            <button
                                onClick={() => {
                                    setShowQrScanner(!showQrScanner);
                                    setQrScanError('');
                                    setQrScanResult('');
                                    setManualSaleProductId('');
                                }}
                                className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                {showQrScanner ? 'Hide QR Scanner' : 'Scan Product QR Code'}
                            </button>
                        </div>

                        {showQrScanner && (
                            <div className="relative w-full max-w-sm mx-auto mb-6 p-4 border border-gray-700 rounded-lg bg-gray-700">
                                <h3 className="text-lg font-medium text-gray-300 mb-2">Point camera at QR code:</h3>
                                {/* Use the new Html5QrCodeScanner component here */}
                                <Html5QrCodeScanner
                                    onScanSuccess={handleScanSuccess}
                                    onScanError={handleScanError}
                                />
                                {qrScanResult && (
                                    <p className="mt-2 text-center text-green-400 font-semibold">
                                        Scanned ID: {qrScanResult.length > 20 ? qrScanResult.substring(0, 17) + '...' : qrScanResult}
                                    </p>
                                )}
                                {qrScanError && (
                                    <p className="mt-2 text-center text-red-400">{qrScanError}</p>
                                )}
                                <p className="mt-2 text-sm text-gray-400">
                                    {qrScanResult ? "Product ID loaded into form." : "Awaiting QR code scan..."}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleManualSaleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="manualSaleProduct" className="block text-sm font-medium text-gray-400 mb-1">Product</label>
                                {loadingProducts ? (
                                    <p className="text-gray-400">Loading products...</p>
                                ) : (
                                    <select
                                        id="manualSaleProduct"
                                        className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                                        value={manualSaleProductId}
                                        onChange={(e) => {
                                            setManualSaleProductId(e.target.value);
                                            setQrScanResult('');
                                        }}
                                        required
                                        disabled={showQrScanner && qrScanResult}
                                    >
                                        <option value="">-- Select a product --</option>
                                        {products.map(product => (
                                            <option key={product._id} value={product._id}>
                                                {product.name} (Stock: {product.stock}, Price: ₹{product.price.toFixed(2)}, Category: {product.category})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="manualSaleQuantity" className="block text-sm font-medium text-gray-400 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        id="manualSaleQuantity"
                                        className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                                        value={manualSaleQuantity}
                                        onChange={(e) => setManualSaleQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="hidden">
                                    <label htmlFor="manualSaleDummy" className="block text-sm font-medium text-gray-400 mb-1">Sales Channel (Always Offline Store)</label>
                                    <input
                                        type="text"
                                        id="manualSaleDummy"
                                        className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white"
                                        value="Offline Store"
                                        readOnly
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="manualSaleDate" className="block text-sm font-medium text-gray-400 mb-1">Sale Date</label>
                                    <input
                                        type="date"
                                        id="manualSaleDate"
                                        className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                                        value={manualSaleDate}
                                        onChange={(e) => setManualSaleDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="manualSaleTime" className="block text-sm font-medium text-gray-400 mb-1">Sale Time</label>
                                    <input
                                        type="time"
                                        id="manualSaleTime"
                                        className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                                        value={manualSaleTime}
                                        onChange={(e) => setManualSaleTime(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors text-lg"
                            >
                                Record Sale
                            </button>
                        </form>
                        {manualSaleMessage && (
                            <p className={`mt-4 text-center ${manualSaleMessageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                {manualSaleMessage}
                            </p>
                        )}
                    </div>

                    {/* Sales History Section */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-300 mb-4">Sales History</h2>
                        {loadingSales ? (
                            <p className="text-gray-400">Loading sales history...</p>
                        ) : sales.length === 0 ? (
                            <p className="text-gray-400">No sales recorded yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead className="bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sale ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date & Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Items Sold</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                                        {sales.map(sale => (
                                            <tr key={sale._id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">
                                                    {sale._id.substring(0, 8)}...
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    {new Date(sale.saleDate).toLocaleDateString()} {new Date(sale.saleDate).toLocaleTimeString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-300">
                                                    <ul className="list-disc list-inside">
                                                        {sale.items.map((item, index) => (
                                                            <li key={index}>
                                                                {item.quantity} x {item.productName || (item.product ? item.product.name : 'Unknown Product')} (Category: {item.product ? item.product.category : 'N/A'}, Price: ₹{item.priceAtSale.toFixed(2)})
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-200">
                                                    ₹{sale.totalAmount.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Sales;