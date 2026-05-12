// src/pages/LicenseError.jsx
import React from 'react';

const LicenseError = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
            <div className="max-w-lg w-full bg-white p-8 rounded-2xl shadow-xl text-center border-t-4 border-red-500">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Akses Aplikasi Dikunci</h1>
                <p className="text-gray-600 mb-6">
                    Maaf, aplikasi ini mendeteksi bahwa lisensi yang digunakan tidak valid atau telah ditangguhkan oleh Administrator.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 text-left mb-6 border border-gray-200">
                    <p className="font-semibold mb-1">Kemungkinan Penyebab:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Masa aktif lisensi telah habis.</li>
                        <li>Domain tidak terdaftar di server lisensi.</li>
                        <li>Terdapat tunggakan pembayaran.</li>
                    </ul>
                </div>
                <button 
                    onClick={() => window.location.reload()}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                    Coba Muat Ulang
                </button>
            </div>
        </div>
    );
};

export default LicenseError;