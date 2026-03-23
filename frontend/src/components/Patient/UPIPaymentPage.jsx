import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Clock, User, Stethoscope, Wallet, AlertCircle, CheckCircle2, QrCode, Download, FileText, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const qrCodeImg = (amount) => `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=demo-payment-link-disabled`;

export default function UPIPaymentPage() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const appointment = location.state?.appointment;

    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [expired, setExpired] = useState(false);
    const [transactionId, setTransactionId] = useState('');
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const timerRef = useRef(null);

    useEffect(() => {
        if (!appointment) {
            toast.error("Invalid appointment details");
            navigate('/patient-dashboard/book-appointment');
            return;
        }

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    setExpired(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [appointment, navigate]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleConfirmPayment = async () => {
        if (!transactionId.trim()) {
            toast.error("Please enter UPI Transaction ID");
            return;
        }

        setProcessing(true);
        try {
            const user = JSON.parse(sessionStorage.getItem('user'));
            const res = await api.post('/payments/confirm', {
                patient_id: user?.id,
                doctor_id: appointment.doctorId,
                appointment_id: appointmentId,
                transaction_id: transactionId,
                amount: appointment.amount
            });

            if (res.success) {
                setSuccess(true);
                clearInterval(timerRef.current);
                const successObj = {
                    ...appointment,
                    transactionId: transactionId,
                    amount: appointment.amount,
                    status: 'confirmed'
                };
                setSuccessData(successObj);
                toast.success("Payment Successful!");
            } else {
                toast.error(res.message || "Payment verification failed");
            }
        } catch (err) {
            console.error("Payment error:", err);
            toast.error(err.response?.data?.message || "Error confirming payment");
        } finally {
            setProcessing(false);
        }
    };

    // Success UI is now handled by modal, keep background visible

    return (
        <>
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
                {success ? (
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-12 shadow-2xl border border-slate-100 dark:border-slate-700 text-center space-y-8">
                        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mx-auto">
                            <CheckCircle2 className="w-16 h-16" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white">Payment Successful!</h2>
                            <p className="text-slate-500 font-medium text-lg">Your appointment has been confirmed and scheduled.</p>
                        </div>

                        <div className="max-w-md mx-auto bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 text-left space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
                                <span className="text-slate-400 font-black uppercase tracking-widest text-xs">Transaction ID</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white uppercase">{successData?.transactionId}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-6 pt-2">
                                <div>
                                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mb-1">Doctor</p>
                                    <p className="font-bold text-slate-900 dark:text-white">{successData?.doctorName}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mb-1">Schedule</p>
                                    <p className="font-bold text-slate-900 dark:text-white">{new Date(successData?.appointmentDate).toLocaleDateString()}<br/>{successData?.appointmentTime}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mb-1">Amount Paid</p>
                                    <p className="text-xl font-black text-primary-600">₹{successData?.amount}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mb-1">Status</p>
                                    <span className="px-3 py-1 bg-green-500 text-white text-[10px] font-black uppercase rounded-full">Confirmed</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                            <button 
                                onClick={() => {
                                    const content = `SMART MEDI SYSTEM - PAYMENT RECEIPT\n--------------------------\nDoctor: ${successData?.doctorName}\nDate: ${new Date(successData?.appointmentDate).toLocaleDateString()}\nTime: ${successData?.appointmentTime}\nAmount: ₹${successData?.amount}\nTxn ID: ${successData?.transactionId}\nStatus: Confirmed\n--------------------------\nThank you for choosing SmartMedi!`;
                                    const blob = new Blob([content], { type: 'text/plain' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `receipt-${successData?.transactionId}.txt`;
                                    a.click();
                                }}
                                className="px-8 py-5 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-600/20 flex items-center justify-center gap-3 hover:bg-primary-700 transition-all min-w-[200px]"
                            >
                                <Download className="w-5 h-5" /> Download Receipt
                            </button>
                            <button 
                                onClick={() => navigate('/patient-dashboard')}
                                className="px-8 py-5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black rounded-2xl hover:bg-slate-50 transition-all"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="text-center">
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Secure UPI Payment</h1>
                            <p className="text-slate-500 mt-2">Complete your payment to confirm the appointment.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left: QR Code & Timer */}
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 text-center space-y-6">
                                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xl border ${expired ? 'bg-red-50 text-red-600 border-red-200' : 'bg-orange-50 text-orange-600 border-orange-200 animate-pulse'}`}>
                                    <Clock className="w-6 h-6" />
                                    {expired ? "EXPIRED" : `Expires in: ${formatTime(timeLeft)}`}
                                </div>

                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                    <div className="relative bg-white p-4 rounded-xl border-2 border-slate-100">
                                        <img
                                            src={qrCodeImg(appointment?.amount)}
                                            alt="UPI QR Code"
                                            className={`w-full aspect-square object-contain mx-auto ${expired ? 'grayscale opacity-30' : ''}`}
                                        />
                                        {expired && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-xl">
                                                <div className="text-center p-4">
                                                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-2" />
                                                    <p className="font-bold text-red-700">Payment Session Expired</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">UPI ID</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">smartmedi@upi</p>
                                </div>
                            </div>

                            {/* Right: Details & Input */}
                            <div className="flex flex-col gap-6">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-4">
                                    <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-4">Booking Details</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 flex items-center gap-2"><User className="w-4 h-4" /> Doctor</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{appointment?.doctorName}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 flex items-center gap-2"><Stethoscope className="w-4 h-4" /> Department</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{appointment?.department}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Date</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{new Date(appointment?.appointmentDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 flex items-center gap-2"><Clock className="w-4 h-4" /> Time</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{appointment?.appointmentTime}</span>
                                        </div>
                                        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end">
                                            <span className="font-bold text-slate-900 dark:text-white">Total Amount</span>
                                            <span className="text-3xl font-black text-primary-600">₹{appointment?.amount}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Enter UPI Transaction ID</label>
                                        <input
                                            type="text"
                                            value={transactionId}
                                            onChange={(e) => setTransactionId(e.target.value)}
                                            placeholder="12-digit UPI Ref No."
                                            disabled={expired || processing}
                                            className="w-full p-4 rounded-xl border-2 dark:bg-slate-900 border-slate-100 dark:border-slate-700 focus:border-primary-500 outline-none transition-all font-mono text-lg"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-tighter">Enter the reference ID from your UPI app (Google Pay, PhonePe, etc.)</p>
                                    </div>

                                    {!expired ? (
                                        <button
                                            onClick={handleConfirmPayment}
                                            disabled={processing || !transactionId}
                                            className="w-full py-4 rounded-xl bg-primary-600 text-white font-black text-lg hover:bg-primary-700 shadow-xl shadow-primary-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            {processing ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                <>
                                                    <Wallet className="w-6 h-6" />
                                                    Confirm Payment
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => navigate('/patient-dashboard/book-appointment')}
                                            className="w-full py-4 rounded-xl bg-slate-900 text-white font-black text-lg hover:bg-black transition-all"
                                        >
                                            Book Again
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
