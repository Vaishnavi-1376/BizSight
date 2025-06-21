// frontend/src/components/Html5QrCodeScanner.jsx
import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const Html5QrCodeScanner = ({ onScanSuccess, onScanError }) => {
  const scannerId = useRef(`qr-code-scanner-${Math.random().toString(36).substring(7)}`); // Unique ID for the scanner element
  const html5QrcodeScanner = useRef(null);

  useEffect(() => {
    // Initialize the scanner only once
    if (!html5QrcodeScanner.current) {
      html5QrcodeScanner.current = new Html5QrcodeScanner(
        scannerId.current,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
          // Only show camera selection if multiple cameras are available
          disableFlip: false, // Set to true if you only expect fixed orientation QR codes
        },
        /* verbose= */ false
      );

      // Render the scanner. The results will be passed to onScanSuccess/onScanError.
      html5QrcodeScanner.current.render(onScanSuccess, onScanError);
    }

    // Cleanup function: stop the scanner when the component unmounts
    return () => {
      if (html5QrcodeScanner.current) {
        html5QrcodeScanner.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner:", error);
        });
        html5QrcodeScanner.current = null; // Clear the ref
      }
    };
  }, [onScanSuccess, onScanError]); // Re-run effect if callbacks change

  return (
    <div id={scannerId.current} className="w-full h-auto flex justify-center items-center">
      {/* The scanner will render inside this div */}
    </div>
  );
};

export default Html5QrCodeScanner;