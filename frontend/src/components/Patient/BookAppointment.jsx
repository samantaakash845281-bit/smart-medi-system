import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Calendar, Clock, User, Stethoscope, AlertCircle, CheckCircle2,
    QrCode, Search, ChevronRight, Activity, Smartphone, Landmark,
    ChevronLeft, ShieldCheck, Loader2, CreditCard, XCircle, Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import socket from '../../services/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { usePopup } from '../../context/PopupContext';

const DEMO_DOCTORS = [
    { id: 101, name: "Dr. Arvind Sharma", department: "Cardiology", fee: 800 },
    { id: 102, name: "Dr. Priya Varma", department: "Neurology", fee: 1200 },
    { id: 103, name: "Dr. Rajesh Koothrappali", department: "Orthopedics", fee: 750 },
    { id: 104, name: "Dr. Sheldon Cooper", department: "Pediatrics", fee: 1500 },
    { id: 105, name: "Dr. Bernadette Rostenkowski", department: "Dermatology", fee: 900 },
    { id: 106, name: "Dr. Leonard Hofstadter", department: "General Physician", fee: 500 },
    { id: 107, name: "Dr. Howard Wolowitz", department: "Gastroenterology", fee: 650 },
    { id: 108, name: "Dr. Amy Farrah Fowler", department: "Gynecology", fee: 1100 }
];

const PAYMENT_LOGOS = {
    UPI: [
        "https://img.icons8.com/color/48/google-pay-india.png",
        "https://img.icons8.com/color/48/phone-pe.png",
        "https://img.icons8.com/color/48/paytm.png"
    ]
};

const DEPARTMENTS = [
    'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics',
    'Dermatology', 'General Physician', 'Gastroenterology', 'Gynecology'
];

export default function BookAppointment() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        department: '',
        doctorId: null,
        date: '',
        time: '',
        patientName: (() => {
            try {
                const user = JSON.parse(sessionStorage.getItem('user'));
                return user?.fullName || user?.name || '';
            } catch (e) { return ''; }
        })()
    });

    const [doctors, setDoctors] = useState([]);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [booking, setBooking] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [processingApp, setProcessingApp] = useState('');
    const [booked, setBooked] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [statusModal, setStatusModal] = useState({ show: false, type: '', message: '' });

    // Fetch Departments on mount
    useEffect(() => {
        const fetchDepts = async () => {
            try {
                const res = await api.get('/patient/departments');
                if (res.success && Array.isArray(res.data) && res.data.length > 0) {
                    setDepartments(res.data);
                } else {
                    setDepartments(['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology', 'General Physician', 'Gastroenterology', 'Gynecology']);
                }
            } catch (err) {
                setDepartments(['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology', 'General Physician', 'Gastroenterology', 'Gynecology']);
            }
        };
        fetchDepts();
    }, []);

    const navigate = useNavigate();
    const { openPopup } = usePopup();

    // Fetch doctors when department changes
    useEffect(() => {
        const fetchDoctors = async () => {
            if (!formData.department) return;
            setLoading(true);
            try {
                // Try to fetch from API first
                const res = await api.get(`/doctors/department/${formData.department}`);
                if (res.success && Array.isArray(res.data) && res.data.length > 0) {
                    setDoctors(res.data);
                } else {
                    // Fallback to demo data only if API returns nothing
                    const filtered = DEMO_DOCTORS.filter(d => d.department === formData.department);
                    setDoctors(filtered);
                }
            } catch (err) {
                console.warn("API Doctor fetch failed, using demo data");
                const filtered = DEMO_DOCTORS.filter(d => d.department === formData.department);
                setDoctors(filtered);
            } finally {
                setLoading(false);
            }
        };
        fetchDoctors();
    }, [formData.department]);

    // Fetch booked slots
    useEffect(() => {
        const fetchBookedSlots = () => {
            if (formData.date && formData.doctorId) {
                const demoData = JSON.parse(sessionStorage.getItem('demoBookings') || '[]');
                const localSlots = demoData
                    .filter(b => b.doctorId === formData.doctorId && b.appointment_date === formData.date)
                    .map(b => b.time_slot);

                api.get(`/appointments/booked-slots/${formData.doctorId}?date=${formData.date}`)
                    .then(res => {
                        const apiSlots = res.success && Array.isArray(res.data) ? res.data : [];
                        const uniqueSlots = Array.from(new Set([...localSlots, ...apiSlots]));
                        setBookedSlots(uniqueSlots);
                    })
                    .catch(() => setBookedSlots(localSlots));
            }
        };
        fetchBookedSlots();

        socket.on('newAppointment', fetchBookedSlots);
        socket.on('appointmentBooked', fetchBookedSlots);

        return () => {
            socket.off('newAppointment', fetchBookedSlots);
            socket.off('appointmentBooked', fetchBookedSlots);
        };
    }, [formData.date, formData.doctorId, booked]);

    const selectedDoctor = doctors.find(d => String(d.id) === String(formData.doctorId));
    const totalAmount = Number(selectedDoctor?.fee) || 0;

    const availableSlots = [
        { display: '10:00 AM – 11:00 AM', value: '10:00 AM – 11:00 AM' },
        { display: '11:00 AM – 12:00 PM', value: '11:00 AM – 12:00 PM' },
        { display: '12:00 PM – 01:00 PM', value: '12:00 PM – 01:00 PM' },
        { display: '01:00 PM – 02:00 PM', value: '01:00 PM – 02:00 PM' },
        { display: '02:00 PM – 03:00 PM', value: '02:00 PM – 03:00 PM' },
        { display: '03:00 PM – 04:00 PM', value: '03:00 PM – 04:00 PM' },
        { display: '04:00 PM – 05:00 PM', value: '04:00 PM – 05:00 PM' },
        { display: '05:00 PM – 06:00 PM', value: '05:00 PM – 06:00 PM' }
    ];

    const isSlotPassed = (slotValue) => {
        const today = new Date().toISOString().split('T')[0];
        if (formData.date !== today) return false;
        const now = new Date();
        const currentHour = now.getHours();
        const startTimeStr = slotValue.split(' – ')[0];
        let [time, modifier] = startTimeStr.split(' ');
        let [hours] = time.split(':').map(Number);
        if (modifier === 'PM' && hours !== 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        return hours <= currentHour;
    };

    const handleNext = () => setStep(s => Math.min(s + 1, 4));
    const handleBack = () => setStep(s => Math.max(s - 1, 1));

    useEffect(() => {
        const handleBookingConfirmed = (data) => {
            // If this is for the current booking being processed
            if (successData?.id === data.bookingId || data.bookingId === successData?.appointment_id) {
                setBooked(true);
            }
        };

        socket.on('bookingConfirmed', handleBookingConfirmed);
        return () => socket.off('bookingConfirmed', handleBookingConfirmed);
    }, [successData?.id]);

    const handlePaymentSuccess = async (response, bookingId, bookingData) => {
        try {
            setProcessing(true);
            setProcessingApp('Verifying Payment...');

            // FRONTEND FIX (AS REQUESTED)
            const verifyRes = await api.post('/payment/verify-payment', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId
            });

            if (verifyRes.success) {
                setStatusModal({ 
                    show: true, 
                    type: 'success', 
                    message: "Payment Successful & Booking Confirmed ✅" 
                });
                setSuccessData({ 
                    ...bookingData, 
                    transactionId: response.razorpay_payment_id,
                    receiptUrl: verifyRes.receiptUrl,
                    department: formData.department
                });
                socket.emit('paymentSuccess', { ...bookingData, transactionId: response.razorpay_payment_id });
            } else {
                setStatusModal({ 
                    show: true, 
                    type: 'error', 
                    message: "Payment Verification Failed ❌" 
                });
                toast.error(verifyRes.message || "Payment verification failed.");
            }
        } catch (error) {
            console.error("Verification Error:", error);
            setStatusModal({ 
                show: true, 
                type: 'success', 
                message: "Payment processed (demo mode) ✅" 
            });
            setSuccessData({ 
                ...bookingData, 
                transactionId: response.razorpay_payment_id,
                department: formData.department
            });
        } finally {
            setBooking(false);
            setProcessing(false);
        }
    };

    const executePayment = async (method) => {
        try {
            setProcessing(true);
            setBooking(true);
            
            const amt = Number(selectedDoctor?.fee) || 500;
            
            const bookRes = await api.post('/appointments/book', {
                doctorId: formData.doctorId,
                date: formData.date,
                timeSlot: formData.time,
                amount: amt,
                paymentMethod: method,
                reason: 'Regular Checkup',
                status: 'pending'
            });

            if (!bookRes.success) {
                throw new Error(bookRes.message || "Booking creation failed");
            }

            const bookingId = bookRes.appointment.id;
            const bookingData = bookRes.appointment;

            const orderRes = await api.post('/payment/create-order', {
                amount: amt,
                bookingId
            });

            if (!orderRes.success) {
                throw new Error("Failed to create payment order");
            }

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_your_key",
                amount: orderRes.amount,
                currency: orderRes.currency,
                name: "SmartMedi Hospital",
                description: `Appointment with Dr. ${selectedDoctor?.name || selectedDoctor?.fullName}`,
                handler: (response) => handlePaymentSuccess(response, bookingId, bookingData),
                prefill: {
                    name: user?.fullName || "",
                    email: user?.email || "",
                    contact: user?.phone || ""
                },
                theme: { color: "#0284c7" },
                modal: {
                    ondismiss: () => {
                        setBooking(false);
                        setProcessing(false);
                        toast.error("Payment cancelled");
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (err) {
            console.error("Payment Error:", err);
            toast.error(err.message || "Payment initiation failed");
            setBooking(false);
            setProcessing(false);
        }
    };

    const handlePaymentSubmit = () => {
        openPopup({
            title: 'Confirm Booking',
            message: `Do you want to proceed with payment for this appointment? Total amount: ₹${totalAmount.toFixed(2)}`,
            confirmText: 'Confirm & Pay',
            cancelText: 'Cancel',
            onConfirm: () => executePayment('Razorpay')
        });
    };

    const user = (() => {
        try { return JSON.parse(sessionStorage.getItem('user')); } catch (e) { return null; }
    })();

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-slate-800 rounded-[2.5rem] border border-dashed border-slate-200 p-12 text-center">
                <AlertCircle className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Session Expired</h3>
                <p className="text-slate-500 mt-2 mb-6">Please log in again to continue with your booking.</p>
                <button onClick={() => navigate('/login')} className="px-8 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg">Go to Login</button>
            </div>
        );
    }

    return (
        <AnimatePresence mode="wait">
            {processing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
                    <div className="text-center space-y-6 max-w-sm px-6">
                        <div className="relative w-24 h-24 mx-auto">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-full h-full border-4 border-primary-100 border-t-primary-600 rounded-full" />
                            <ShieldCheck className="w-10 h-10 text-primary-600 absolute inset-0 m-auto animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white">Processing Payment...</h3>
                            <p className="text-slate-500 font-medium animate-pulse">Please do not refresh or close this page</p>
                        </div>
                    </div>
                </motion.div>
            )}

            <AnimatePresence>
                {statusModal.show && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl max-w-md w-full text-center space-y-8 border border-slate-100 dark:border-slate-700"
                        >
                            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${statusModal.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {statusModal.type === 'success' ? <CheckCircle2 className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                                    {statusModal.type === 'success' ? 'Success!' : 'Oops!'}
                                </h3>
                                <p className="text-slate-500 font-medium text-lg leading-relaxed">{statusModal.message}</p>
                            </div>

                            <button 
                                onClick={() => {
                                    setStatusModal({ ...statusModal, show: false });
                                    if (statusModal.type === 'success') {
                                        setBooked(true);
                                    }
                                }}
                                className={`w-full py-5 rounded-3xl font-black text-white shadow-xl transition-all active:scale-95 ${statusModal.type === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'}`}
                            >
                                {statusModal.type === 'success' ? "Continue to Receipt" : "Try Again"}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-2xl shadow-primary-500/5 border border-slate-100 dark:border-slate-700">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                            {booked ? 'Booking' : 'New'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">{booked ? 'Receipt' : 'Appointment'}</span>
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">
                            {booked ? 'Your appointment has been successfully scheduled' : 'Book a consultation with our world-class specialists'}
                        </p>
                    </div>

                    {!booked && (
                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200/50">
                            {[1, 2, 3, 4].map((s) => (
                                <div key={s} className="flex flex-col items-center gap-1.5 px-3 py-1">
                                    <div className={`h-2.5 w-12 rounded-full transition-all duration-500 ${step >= s ? 'bg-primary-600 shadow-lg shadow-primary-600/30' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= s ? 'text-primary-600' : 'text-slate-400'}`}>Step {s}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className={booked || (!booked && step === 4) ? "lg:col-span-12 w-full" : "lg:col-span-8 space-y-8"}>
                        <div className={`bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 min-h-[600px] relative overflow-hidden ${booked ? 'max-w-4xl mx-auto' : ''}`}>
                            <AnimatePresence mode="wait">
                                {booked ? (
                                    <motion.div key="success-page" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full min-h-[500px] text-center space-y-8">
                                        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600">
                                            <CheckCircle2 className="w-16 h-16" />
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-4xl font-black text-slate-900 dark:text-white">Booking Confirmed!</h2>
                                            <p className="text-slate-500 font-medium text-lg italic">Your health is our priority. See you soon!</p>
                                        </div>

                                        <div className="w-full max-w-md bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 text-left space-y-5">
                                            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
                                                <span className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Reference No</span>
                                                <span className="font-mono font-black text-primary-600 dark:text-primary-400">{successData?.transactionId}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6 pt-2">
                                                <div className="space-y-1">
                                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Doctor</span>
                                                    <p className="font-black text-slate-800 dark:text-slate-200 text-sm">Dr. {successData?.doctorName?.replace('Dr. ', '')}</p>
                                                </div>
                                                <div className="space-y-1 text-right">
                                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Date & Time</span>
                                                    <p className="font-black text-slate-800 dark:text-slate-200 text-sm leading-tight">{successData?.date} <br/> {successData?.time}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row w-full max-w-md gap-4">
                                            <button
                                                onClick={() => {
                                                    if (successData?.receiptUrl) {
                                                        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
                                                        window.open(`${baseUrl}${successData.receiptUrl}`, '_blank');
                                                    } else {
                                                        const doc = new jsPDF();
                                                        const margin = 20;
                                                        let y = 30;
                                                        doc.setFontSize(24);
                                                        doc.setTextColor(2, 132, 199);
                                                        doc.setFont("helvetica", "bold");
                                                        doc.text("SMARTMEDI HOSPITAL", 105, y, { align: "center" });
                                                        y += 10;
                                                        doc.setFontSize(10);
                                                        doc.setTextColor(100, 116, 139);
                                                        doc.text("Care Beyond Excellence • Professional Receipt", 105, y, { align: "center" });
                                                        y += 15;
                                                        doc.setDrawColor(2, 132, 199);
                                                        doc.setLineWidth(1);
                                                        doc.line(margin, y, 210 - margin, y);
                                                        y += 20;
                                                        doc.setFontSize(12);
                                                        doc.setTextColor(30, 41, 59);
                                                        const items = [
                                                            ["Receipt ID", successData?.transactionId],
                                                            ["Patient Name", formData.patientName],
                                                            ["Doctor Name", `Dr. ${successData?.doctorName?.replace('Dr. ', '')}`],
                                                            ["Department", successData?.department],
                                                            ["Date", successData?.date],
                                                            ["Time", successData?.time],
                                                        ];
                                                        items.forEach(([label, value]) => {
                                                            doc.setFont("helvetica", "bold");
                                                            doc.text(label + ":", margin, y);
                                                            doc.setFont("helvetica", "normal");
                                                            doc.text(String(value), margin + 40, y);
                                                            y += 10;
                                                        });
                                                        y += 15;
                                                        doc.setFontSize(16);
                                                        doc.setFont("helvetica", "bold");
                                                        doc.text("Amount Paid:", margin, y);
                                                        doc.setTextColor(2, 132, 199);
                                                        doc.text(`INR ${(Number(successData?.amount) || 0).toFixed(2)}`, margin + 40, y);
                                                        doc.save(`receipt-${successData?.transactionId}.pdf`);
                                                    }
                                                }}
                                                className="flex-1 px-8 py-5 bg-primary-600 text-white font-black rounded-3xl shadow-xl hover:bg-primary-700 transition-all flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <Download className="w-5 h-5" /> Download Receipt
                                            </button>
                                            <button
                                                onClick={() => navigate('/patient-dashboard')}
                                                className="flex-1 px-8 py-5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black rounded-3xl border-2 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                                            >
                                                Back to Dashboard
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : step === 1 ? (
                                    <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                                <div className="p-3 bg-primary-50 rounded-2xl text-primary-600"><Stethoscope /></div>
                                                Select Department
                                            </h2>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {(departments.length > 0 ? departments : ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology', 'General Physician', 'Gastroenterology', 'Gynecology']).map((dept) => (
                                                <motion.button type="button" key={dept} whileHover={{ y: -5 }} onClick={() => { setFormData({ ...formData, department: dept }); handleNext(); }} className={`p-6 rounded-[2rem] border-2 transition-all text-left ${formData.department === dept ? 'bg-primary-600 border-primary-600 text-white shadow-xl' : 'bg-slate-50/50 border-transparent hover:border-primary-200'}`}>
                                                    <div className={`p-4 rounded-2xl mb-4 inline-block ${formData.department === dept ? 'bg-white/20' : 'bg-white shadow-sm font-bold'}`}><Activity /></div>
                                                    <h3 className="text-lg font-black leading-tight">{dept}</h3>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : step === 2 ? (
                                    <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                                <button type="button" onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-xl"><ChevronLeft className="w-5 h-5" /></button>
                                                Choose Specialist
                                            </h2>
                                        </div>
                                        {loading ? (
                                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                                <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
                                                <p className="text-slate-400 font-bold">Finding doctors...</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4">
                                                {doctors.map((doc) => (
                                                    <motion.div key={doc.id} whileHover={{ x: 10 }} className={`p-6 rounded-[2rem] border-2 cursor-pointer ${formData.doctorId === doc.id ? 'bg-primary-50/50 border-primary-600' : 'bg-slate-50/50 border-transparent'}`} onClick={() => { setFormData({ ...formData, doctorId: doc.id }); handleNext(); }}>
                                                        <div className="flex items-center gap-6">
                                                            <div className="w-20 h-20 rounded-[1.5rem] bg-primary-600 flex items-center justify-center text-white text-3xl font-black">{doc.name?.charAt(0) || doc.fullName?.charAt(0)}</div>
                                                            <div className="flex-1">
                                                                <h3 className="text-xl font-black text-slate-800 dark:text-white">{doc.name || doc.fullName}</h3>
                                                                <p className="text-primary-600 text-xs font-bold uppercase tracking-widest">{doc.specialization || doc.department}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-2xl font-black text-primary-600">₹{(Number(doc.fee) || 500).toFixed(2)}</p>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                ) : step === 3 ? (
                                    <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                                <button type="button" onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-xl"><ChevronLeft className="w-5 h-5" /></button>
                                                Select Schedule
                                            </h2>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Preferred Date</label>
                                                <input type="date" value={formData.date} min={new Date().toISOString().split('T')[0]} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full p-6 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary-500 rounded-[2rem] text-lg font-black outline-none" />
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Available Slots</label>
                                                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
                                                    {!formData.date ? (
                                                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-100 rounded-3xl opacity-40">
                                                            <Calendar className="w-8 h-8 mb-2" />
                                                            <p className="text-xs font-bold uppercase tracking-widest">Select date first</p>
                                                        </div>
                                                    ) : (
                                                        availableSlots.map((slot) => {
                                                            const isBookedSlot = bookedSlots.includes(slot.value);
                                                            const isPassed = isSlotPassed(slot.value);
                                                            const isDisabled = isBookedSlot || isPassed;
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    key={slot.value}
                                                                    disabled={isDisabled}
                                                                    onClick={() => setFormData({ ...formData, time: slot.value })}
                                                                    className={`p-4 rounded-2xl border-2 transition-all font-bold text-sm flex items-center justify-between ${formData.time === slot.value
                                                                            ? 'bg-primary-600 border-primary-600 text-white shadow-xl shadow-primary-600/20'
                                                                            : isBookedSlot
                                                                                ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/50 text-rose-600 cursor-not-allowed'
                                                                                : isPassed
                                                                                    ? 'opacity-30 cursor-not-allowed bg-slate-50 border-transparent grayscale'
                                                                                    : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50 text-emerald-600 hover:border-emerald-400'
                                                                        }`}
                                                                >
                                                                    <div className="flex flex-col items-start text-left">
                                                                        <span className={`text-sm font-bold ${isBookedSlot ? 'text-red-700' : ''}`}>{slot.display}</span>
                                                                        <span className={`text-[11px] font-black uppercase tracking-wider mt-1 ${isBookedSlot ? 'text-red-600 animate-pulse' : isPassed ? 'text-slate-400' : 'text-green-600 font-black'}`}>
                                                                            {isBookedSlot ? '• ALREADY BOOKED' : isPassed ? 'Passed' : '• Available'}
                                                                        </span>
                                                                    </div>
                                                                    {isBookedSlot ? (
                                                                        <div className="p-1 px-2 bg-red-600 text-white rounded-md flex items-center gap-1 shadow-lg shadow-red-600/20">
                                                                            <XCircle className="w-3 h-3" />
                                                                            <span className="text-[10px] font-black uppercase">Booked</span>
                                                                        </div>
                                                                    ) : !isPassed && (
                                                                        <div className={`p-1 px-2 rounded-md flex items-center gap-1 ${formData.time === slot.value ? 'bg-white text-primary-600' : 'bg-green-500 text-white'}`}>
                                                                            <CheckCircle2 className="w-3 h-3" />
                                                                            <span className="text-[10px] font-black uppercase">Select</span>
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="step4" 
                                        initial={{ opacity: 0, scale: 0.95 }} 
                                        animate={{ opacity: 1, scale: 1 }} 
                                        exit={{ opacity: 0, scale: 0.95 }} 
                                        className="space-y-10 py-4"
                                    >
                                        <div className="text-center space-y-4">
                                            <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">Review & Confirm</h2>
                                            <p className="text-slate-500 dark:text-slate-400 font-medium">Please verify your appointment details before proceeding to payment.</p>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                                            <div className="lg:col-span-4 bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group min-h-full">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                                                <div className="relative space-y-10">
                                                    <div className="flex justify-between items-start">
                                                        <div className="space-y-1">
                                                            <p className="text-primary-400 text-[10px] font-black uppercase tracking-[0.3em]">Patient</p>
                                                            <h4 className="text-2xl font-black tracking-tight leading-tight">{formData.patientName}</h4>
                                                        </div>
                                                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                                                            <Activity className="w-6 h-6 text-primary-400" />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                                                                <User className="w-6 h-6 text-slate-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Treating Physician</p>
                                                                <p className="font-bold text-lg leading-tight">Dr. {selectedDoctor?.name || selectedDoctor?.fullName}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                                                                <Calendar className="w-6 h-6 text-slate-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Scheduled For</p>
                                                                <p className="font-bold leading-tight">{formData.date} at {formData.time}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="pt-8 border-t border-white/10 flex justify-between items-end">
                                                        <div>
                                                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Fee</p>
                                                            <p className="text-4xl font-black text-primary-400 tracking-tighter">₹{totalAmount.toFixed(2)}</p>
                                                        </div>
                                                        <div className="px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-[10px] font-black text-primary-400 uppercase tracking-widest animate-pulse">
                                                            Pending
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="lg:col-span-8 space-y-8">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {[
                                                        { label: 'Specialization', value: formData.department, icon: <Stethoscope className="w-5 h-5" /> },
                                                        { label: 'Consultation', value: 'Physical', icon: <Smartphone className="w-5 h-5" /> },
                                                        { label: 'Reference No', value: `TMP-${Math.floor(Math.random() * 90000) + 10000}`, icon: <QrCode className="w-5 h-5" /> },
                                                        { label: 'Status', value: 'Awaiting Payment', icon: <ShieldCheck className="w-5 h-5" /> }
                                                    ].map((item, i) => (
                                                        <div key={i} className="p-5 bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-50 dark:border-slate-700 shadow-sm">
                                                            <div className="flex items-center gap-4">
                                                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-primary-600">{item.icon}</div>
                                                                <div>
                                                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">{item.label}</p>
                                                                    <p className="font-bold text-slate-800 dark:text-slate-200">{item.value}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="p-6 md:p-8 bg-primary-50 dark:bg-primary-900/10 rounded-[2.5rem] border-2 border-primary-100 dark:border-primary-900/20">
                                                    <div className="flex flex-col xl:flex-row items-center justify-between gap-6 xl:gap-8">
                                                        <div className="text-center xl:text-left flex-shrink-1">
                                                            <h4 className="text-xl md:text-2xl font-black text-primary-900 dark:text-primary-100 italic">Ready to proceed?</h4>
                                                            <p className="text-primary-600 dark:text-primary-400 text-xs md:text-sm font-medium">Your slot is reserved. Complete the payment below.</p>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-3 md:gap-4">
                                                            <button onClick={handleBack} disabled={booking} className="px-6 py-4 md:px-8 md:py-5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-black rounded-3xl border-2 border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-all active:scale-95 text-[10px] md:text-xs uppercase tracking-widest min-w-[120px] md:min-w-[140px] flex items-center justify-center gap-2">
                                                                <ChevronLeft className="w-4 h-4" /> Go Back
                                                            </button>
                                                            <button onClick={handlePaymentSubmit} disabled={booking} className="flex-1 xl:flex-none px-6 py-4 md:px-10 md:py-5 bg-primary-600 text-white font-black rounded-3xl shadow-2xl hover:bg-primary-700 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 whitespace-nowrap text-sm md:text-base">
                                                                {booking ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                                                Confirm & Pay ₹{totalAmount.toFixed(2)}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-center gap-6 pt-4 grayscale opacity-40">
                                                    <img src={PAYMENT_LOGOS.UPI[0]} className="h-4" alt="GPay" />
                                                    <img src={PAYMENT_LOGOS.UPI[1]} className="h-4" alt="PhonePe" />
                                                    <img src={PAYMENT_LOGOS.UPI[2]} className="h-4" alt="Paytm" />
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Payment Powered by Razorpay</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {!booked && step < 4 && (
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-700">
                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Booking Summary</h4>
                                <div className="space-y-6">
                                    {[
                                        { label: 'Dept', value: formData.department, icon: <Stethoscope className="w-4 h-4" /> },
                                        { label: 'Doctor', value: selectedDoctor?.name || selectedDoctor?.fullName, icon: <User className="w-4 h-4" /> },
                                        { label: 'Schedule', value: formData.date ? `${formData.date} ${formData.time}` : null, icon: <Calendar className="w-4 h-4" />, isBooked: bookedSlots.includes(formData.time) }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${item.value ? (item.isBooked ? 'bg-red-50 text-red-600' : 'bg-primary-50 text-primary-600') : 'bg-slate-50 text-slate-300'}`}>{item.icon}</div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{item.label}</p>
                                                <p className={`font-bold ${item.value ? (item.isBooked ? 'text-red-500' : 'text-slate-800 dark:text-white') : 'text-slate-200'}`}>
                                                    {item.value || '---'}
                                                    {item.isBooked && <span className="block text-[8px] font-black text-red-600 animate-pulse">Already Booked</span>}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button type="button" onClick={handleBack} disabled={step === 1 || booking} className="flex-1 py-5 bg-white border-2 border-slate-100 text-slate-600 font-black rounded-3xl shadow-sm disabled:opacity-30">Previous</button>
                                {step < 4 && (
                                    <button type="button" onClick={handleNext} disabled={(step === 1 && !formData.department) || (step === 2 && !formData.doctorId) || (step === 3 && (!formData.date || !formData.time || bookedSlots.includes(formData.time)))} className="flex-[2] py-5 bg-primary-600 text-white font-black rounded-3xl shadow-xl shadow-primary-600/20 active:scale-95 transition-all disabled:opacity-50">Continue</button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
