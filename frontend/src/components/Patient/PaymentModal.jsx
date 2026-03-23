import React from 'react';

const PaymentModal = ({ isOpen, onClose, onSelect, amount }) => {
    if (!isOpen) return null;

    const paymentMethods = [
        { id: 'Gateway', name: 'Net Banking / Card (Razorpay)', icon: '💳' },
        { id: 'UPI', name: 'UPI Payment (QR Code)', icon: '📱' },
        { id: 'Bank Transfer', name: 'Bank Transfer', icon: '🏦' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Select Payment Method</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-center">
                    <p className="text-sm text-blue-600 font-medium">Amount to Pay</p>
                    <p className="text-3xl font-extrabold text-blue-700">₹{amount}</p>
                </div>

                <div className="space-y-3">
                    {paymentMethods?.map((method) => (
                        <button
                            key={method.id}
                            onClick={() => onSelect(method.id)}
                            className="w-full flex items-center p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                        >
                            <span className="text-2xl mr-4">{method.icon}</span>
                            <span className="flex-grow text-left font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">{method.name}</span>
                            <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    ))}
                </div>

                <p className="mt-6 text-center text-xs text-gray-400">
                    Secure encrypted payments powered by SmartMedi
                </p>
            </div>
        </div>
    );
};

export default PaymentModal;
