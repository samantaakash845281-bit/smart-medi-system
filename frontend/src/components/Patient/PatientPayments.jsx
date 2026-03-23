import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, CheckCircle, Clock, AlertCircle, FileText, Download, Smartphone, QrCode, XCircle } from 'lucide-react';
import api from '../../services/api';
import socket from '../../services/socket';
import PaymentModal from './PaymentModal';
import PaymentTimer from './PaymentTimer';
import ManualPaymentForm from './ManualPaymentForm';
import BookingSuccessModal from './BookingSuccessModal';

export default function PatientPayments() {
    const [activeTab, setActiveTab] = useState('pending');
    const [payments, setPayments] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Gateway Simulation State
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingItem, setProcessingItem] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState(''); // 'GPay', 'Paytm', 'UPI', 'Credit Card'
    const [showGateway, setShowGateway] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState(null);

    // Timer & Session State
    const [currentSession, setCurrentSession] = useState(null); // The created DB payment instance
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
    const [upiId, setUpiId] = useState('');
    const timerRef = useRef(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [payRes, apptRes] = await Promise.all([
                api.get('/payments/patient'),
                api.get('/patient/appointments')
            ]);
            if (payRes.success) setPayments(payRes.data);
            if (apptRes.success) setAppointments(apptRes.data);
        } catch (err) {
            console.error('Failed to fetch payment info:', err);
            setError('Could not load payment data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const handleUpdate = () => {
            console.log('Patient Payments real-time update');
            fetchData();
        };

        socket.on('paymentCompleted', handleUpdate);
        socket.on('appointmentCancelled', handleUpdate);

        return () => {
            socket.off('paymentCompleted', handleUpdate);
            socket.off('appointmentCancelled', handleUpdate);
        };
    }, []);

    // Timer Effect
    useEffect(() => {
        if (showGateway && currentSession && timeLeft > 0 && !successData && !error.includes('expired')) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft <= 0 && currentSession && !successData) {
            handlePaymentExpiry();
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [showGateway, currentSession, timeLeft, successData]);

    // Cleanup when closing gateway manually
    const handleCloseGateway = () => {
        setShowGateway(false);
        setProcessingItem(null);
        setCurrentSession(null);
        setPaymentMethod('');
        setIsProcessing(false);
        setError('');
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handlePaymentExpiry = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setError('Payment session expired. Please restart the payment.');
        setIsProcessing(false);

        // Update DB
        try {
            await api.put(`/payments/update-status/${currentSession.id}`, { status: 'failed' });
            fetchData();
        } catch (err) {
            console.error('Failed to update expired status:', err);
        }
    };

    // Pending Logic: Get Appointments that don't have a non-failed payment attached.
    // Instead of fixed $150, we use processingItem.amount if available, or fallback.
    // Notice: our seed gave payments some DB values, let's look at the actual pending payments directly.
    const pendingBills = payments.filter(p => p.payment_status?.toLowerCase() === 'pending');
    const paymentHistory = payments.filter(p => p.payment_status?.toLowerCase() !== 'pending');

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);

    const handlePayClick = async (bill) => {
        setIsProcessing(true);
        try {
            const response = await api.post('/payments/auto-pay', {
                payment_id: bill.payment_id
            });

            if (response.success) {
                setSuccessData(response.data);
                setShowSuccessModal(true);
            } else {
                setError(response.message || 'Payment failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Payment failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentMethodSelect = async (method) => {
        setShowPaymentModal(false);
        const bill = selectedBill;

        if (method === 'Gateway') {
            try {
                // Standardized Razorpay Flow
                const response = await api.post('/payment/create-order', {
                    amount: bill.amount,
                    bookingId: bill.appointment_id || bill.id
                });

                if (response.success) {
                    const options = {
                        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
                        amount: response.amount,
                        currency: response.currency,
                        name: "SmartMedi SMMS",
                        description: "Appointment Payment",
                        order_id: response.orderId,
                        handler: async (res) => {
                            try {
                                setIsProcessing(true);
                                const verifyRes = await api.post('/payment/verify-payment', {
                                    razorpay_order_id: res.razorpay_order_id,
                                    razorpay_payment_id: res.razorpay_payment_id,
                                    razorpay_signature: res.razorpay_signature,
                                    bookingId: bill.appointment_id || bill.id
                                });
                                
                                if (verifyRes.success) {
                                    setSuccessData({
                                        transaction_id: res.razorpay_payment_id,
                                        amount: bill.amount,
                                        paymentStatus: 'paid'
                                    });
                                    toast.success("Payment Successful!");
                                    fetchData();
                                } else {
                                    toast.error("Payment verification failed.");
                                }
                            } catch (err) {
                                console.error("Verification Error:", err);
                                toast.error("Verification failed.");
                            } finally {
                                setIsProcessing(false);
                            }
                        },
                        prefill: {
                            name: "Patient", 
                            email: "patient@example.com"
                        },
                        theme: { color: "#0284c7" },
                        modal: {
                            ondismiss: () => {
                                toast.error("Payment cancelled");
                            }
                        }
                    };
                    const rzp = new window.Razorpay(options);
                    rzp.open();
                } else {
                    toast.error(response.message || "Failed to create payment order");
                }
            } catch (err) {
                console.error("Gateway Error:", err);
                toast.error('Failed to initiate gateway payment');
            }
        } else {
            // Manual flow: Redirect or open manual form
            setPaymentMethod(method);
            setCurrentSession(bill);
            setShowGateway(true);
        }
    };

    const handleProcessPayment = async (e) => {
        if (e) e.preventDefault();

        if (paymentMethod === 'UPI' && (!upiId || !upiId.includes('@'))) {
            setError('Please enter a valid UPI ID containing "@"');
            return;
        }

        setIsProcessing(true);
        setError('');

        // Mock Simulation Time (8-12 seconds as requested for QR/UPI, fast for Card)
        const delay = (paymentMethod === 'GPay' || paymentMethod === 'Paytm' || paymentMethod === 'UPI')
            ? Math.floor(Math.random() * (12000 - 8000 + 1) + 8000)
            : 3000;

        setTimeout(async () => {
            try {
                if (timeLeft <= 0) return; // Prevent success if expired mid-processing

                // Update Session to Paid
                const response = await api.put(`/payments/update-status/${currentSession.id}`, { status: 'paid' });

                if (response.success) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setSuccessData({
                        transaction_id: currentSession.transaction_id,
                        amount: currentSession.amount,
                        paymentStatus: 'paid'
                    });
                    fetchData();
                } else {
                    setError('Payment validation failed.');
                }
            } catch (err) {
                setError(err.message || 'Error processing network payment.');
            } finally {
                setIsProcessing(false);
            }
        }, delay);
    };

    // Auto-trigger for QR codes
    useEffect(() => {
        if ((paymentMethod === 'GPay' || paymentMethod === 'Paytm') && showGateway && currentSession && !isProcessing && !error.includes('expire')) {
            handleProcessPayment();
        }
    }, [paymentMethod]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payments & Billing</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your medical bills, consultation fees, and payment history.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                {['pending', 'history']?.map(tab => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); handleCloseGateway(); setSuccessData(null); }}
                        className={`px-4 py-2 text-sm font-bold rounded-xl whitespace-nowrap transition-all duration-200 ${activeTab === tab
                            ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                            }`}
                    >
                        {tab === 'pending' ? `Pending Bills (${pendingBills.length})` : 'Payment History'}
                    </button>
                ))}
            </div>

            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSelect={handlePaymentMethodSelect}
                amount={selectedBill?.amount}
            />

            {/* Gateway Modal Overlay */}
            {showGateway && currentSession && !successData && (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-all duration-300">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in-up">
                        {/* Header & Timer */}
                        <div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-6 relative">
                            {!isProcessing && error.includes('expired') === false && (
                                <button onClick={handleCloseGateway} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            )}
                            <div className="flex items-center gap-3 mb-2">
                                <CreditCard className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Secure Checkout</h3>
                            </div>

                            <div className="mt-4">
                                {paymentMethod === 'Gateway' && (
                                    <PaymentTimer onExpire={handlePaymentExpiry} />
                                )}
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Order Summary */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl mb-6 border border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between text-sm mb-2 text-slate-600 dark:text-slate-400">
                                    <span>Merchant Name:</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">Smart Medi Healthcare Pvt Ltd</span>
                                </div>
                                <div className="flex justify-between text-sm mb-2 text-slate-600 dark:text-slate-400">
                                    <span>Note:</span>
                                    <span className="font-medium text-slate-900 dark:text-white">Appointment Payment ({currentSession.doctorName})</span>
                                </div>
                                <div className="border-t border-slate-200 dark:border-slate-700 mt-3 pt-3 flex justify-between font-bold text-lg text-slate-900 dark:text-white">
                                    <span>Amount to Pay:</span>
                                    <span className="text-primary-600 dark:text-primary-400">₹{parseFloat(currentSession.amount).toFixed(2)}</span>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-6 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-4 rounded-xl flex items-start gap-3 border border-red-200 dark:border-red-800/50">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <p>{error}</p>
                                </div>
                            )}

                            {/* Payment Selection & Flows */}
                            {(paymentMethod === 'UPI' || paymentMethod === 'Bank Transfer') ? (
                                <ManualPaymentForm
                                    method={paymentMethod}
                                    amount={currentSession.amount}
                                    appointmentId={currentSession.appointment_id || currentSession.id}
                                    onSuccess={() => {
                                        setShowGateway(false);
                                        fetchData();
                                    }}
                                    onCancel={() => setShowGateway(false)}
                                />
                            ) : (
                                <div className="space-y-6">
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                                        <p className="text-slate-600 dark:text-slate-400 font-bold">Waiting for Payment Gateway...</p>
                                        <p className="text-xs text-slate-500 mt-2">Completing your transaction with Razorpay. Please do not close this window.</p>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setShowGateway(false)}
                                            className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Unified Back Action */}
                        {paymentMethod && !isProcessing && !error.includes('expired') && (
                            <button onClick={() => setPaymentMethod('')} className="mt-4 w-full py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium">
                                Choose different payment method
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Success State */}
            {successData && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-teal-100 dark:border-teal-900/30 text-center max-w-xl mx-auto my-10 animate-fade-in-up">
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-teal-50 dark:bg-teal-900/30 mb-6">
                        <CheckCircle className="h-10 w-10 text-teal-600 dark:text-teal-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Payment Successful!</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">Your transaction has been securely processed.</p>

                    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 text-left max-w-sm mx-auto mb-8 text-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between py-3 border-b border-slate-200 dark:border-slate-800">
                            <span className="text-slate-500 uppercase font-semibold text-xs tracking-wider">Transaction ID</span>
                            <span className="font-mono text-slate-900 dark:text-white font-bold">{successData.transaction_id}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-slate-200 dark:border-slate-800">
                            <span className="text-slate-500 uppercase font-semibold text-xs tracking-wider">Amount Paid</span>
                            <span className="text-slate-900 dark:text-white font-bold text-lg">₹{parseFloat(successData.amount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-3 font-medium">
                            <span className="text-slate-500 uppercase font-semibold text-xs tracking-wider pt-1">Status</span>
                            <span className="bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 px-3 py-1 rounded-full font-bold uppercase text-[10px] tracking-wider border border-teal-100">{successData.paymentStatus}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => { setSuccessData(null); setShowGateway(false); setActiveTab('history'); fetchData(); }}
                        className="px-8 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20"
                    >
                        View Payment History
                    </button>
                </div>
            )}

            {/* Tab Content */}
            {!showGateway && !successData && (
                <>
                    {activeTab === 'pending' ? (
                        <div className="grid grid-cols-1 gap-4">
                            {pendingBills.length === 0 ? (
                                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm animate-fade-in-up">
                                    <CheckCircle className="mx-auto h-16 w-16 text-slate-200 dark:text-slate-700 mb-4" />
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">All caught up!</h3>
                                    <p className="text-slate-500 mt-2">You have no pending medical bills to pay.</p>
                                </div>
                            ) : (
                                pendingBills?.map((bill) => {
                                    const isExpired = bill.expiry_time && new Date(bill.expiry_time).getTime() < Date.now();
                                    return (
                                        <div key={bill.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-primary-100 dark:border-primary-900/30 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center relative overflow-hidden group hover:shadow-md transition-all duration-300">
                                            <div className="flex items-start gap-5">
                                                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl text-primary-600 border border-primary-100 dark:border-primary-800/50 transition-colors duration-200">
                                                    <AlertCircle className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white text-xl">Consultation: {bill.doctorName}</h3>
                                                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-2 flex flex-col sm:flex-row gap-2 sm:gap-6">
                                                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {new Date(bill.appointment_date).toLocaleDateString()}</span>
                                                        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-[4px] border border-slate-200 dark:border-slate-700">TXN: {bill.transaction_id || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 sm:gap-3">
                                                <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">₹{parseFloat(bill.amount).toFixed(2)}</div>
                                                {isExpired ? (
                                                    <span className="px-5 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl text-sm border border-red-100">Expired</span>
                                                ) : (
                                                    <button
                                                        onClick={() => handlePayClick(bill)}
                                                        className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-all duration-300 shadow-sm shadow-primary-600/10 transform active:scale-95"
                                                    >
                                                        Pay Now
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in-up">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                    <thead className="bg-slate-50 dark:bg-slate-900/80">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Transaction ID</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Service</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Method</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {paymentHistory.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-transparent">
                                                    No payment history found.
                                                </td>
                                            </tr>
                                        ) : (
                                            paymentHistory?.map((payment) => (
                                                <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                    <td className="px-6 py-5 whitespace-nowrap text-sm font-mono font-medium text-slate-600 dark:text-slate-300">
                                                        {payment.transaction_id || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                                                        {new Date(payment.payment_date || payment.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 font-medium">
                                                        {payment.doctorName}
                                                    </td>
                                                    <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">
                                                        ₹{parseFloat(payment.amount).toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                                                        <div className="flex items-center gap-2">
                                                            {payment.payment_method === 'UPI' || payment.payment_method === 'Gateway' ? <Smartphone className="w-4 h-4 text-slate-400" /> : <CreditCard className="w-4 h-4 text-slate-400" />}
                                                            {payment.payment_method}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${payment.payment_status?.toLowerCase() === 'paid' ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400' :
                                                            payment.payment_status?.toLowerCase() === 'verified' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30' :
                                                                'bg-amber-50 text-amber-700 border-amber-200'
                                                            }`}>
                                                            {payment.payment_status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        )}
                </>
            )}

            <BookingSuccessModal 
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    fetchData();
                    setActiveTab('history');
                }}
                data={successData}
            />
        </div>
    );
}
