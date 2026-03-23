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
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [upiApp, setUpiApp] = useState('');
    const [upiId, setUpiId] = useState('');
    const [processing, setProcessing] = useState(false);
    const [processingApp, setProcessingApp] = useState('');
    const [booked, setBooked] = useState(false);
    const [successData, setSuccessData] = useState(null);

    // New payment states
    const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
    const [selectedBank, setSelectedBank] = useState('');

    const navigate = useNavigate();
    const { openPopup } = usePopup();

    // Fetch doctors when department changes (Demo Mode: use local data)
    useEffect(() => {
        const fetchDoctors = async () => {
            if (!formData.department) return;
            setLoading(true);
            try {
                // First try demo data for instant results
                const filtered = DEMO_DOCTORS.filter(d => d.department === formData.department);
                setDoctors(filtered);

                // Then try to fetch from API in background (silent fall-through)
                const res = await api.get(`/doctors/department/${formData.department}`);
                if (res.success && Array.isArray(res.data) && res.data?.length > 0) {
                    setDoctors(res.data);
                }
            } catch (err) {
                console.warn("API Doctor fetch failed, using demo data");
            } finally {
                setLoading(false);
            }
        };
        fetchDoctors();
    }, [formData.department]);

    // Fetch booked slots (Demo Mode: use sessionStorage)
    useEffect(() => {
        const fetchBookedSlots = () => {
            if (formData.date && formData.doctorId) {
                // 1. Get from demo storage
                const demoData = JSON.parse(sessionStorage.getItem('demoBookings') || '[]');
                const localSlots = demoData
                    .filter(b => b.doctorId === formData.doctorId && b.appointmentDate === formData.date)
                    ?.map(b => b.appointmentTime);

                // 2. Fetch from API
                api.get(`/appointments/booked-slots/${formData.doctorId}?date=${formData.date}`)
                    .then(res => {
                        const apiSlots = res.success && Array.isArray(res.data) ? res.data : [];
                        const uniqueSlots = Array.from(new Set([...localSlots, ...apiSlots]));
                        setBookedSlots(uniqueSlots);

                        // Auto-clear if currently selected slot was just booked
                        if (formData.time && uniqueSlots.includes(formData.time) && !booked) {
                            setFormData(prev => ({ ...prev, time: '' }));
                        }
                    })
                    .catch(() => setBookedSlots(localSlots));
            }
        };
        fetchBookedSlots();

        // Listen for simulated local events
        const handleSimulatedUpdate = () => {
            console.log("Simulated update received");
            fetchBookedSlots();
        };
        window.addEventListener('appointmentBooked', handleSimulatedUpdate);
        socket.on('newAppointment', fetchBookedSlots);
        socket.on('appointmentBooked', fetchBookedSlots);

        return () => {
            window.removeEventListener('appointmentBooked', handleSimulatedUpdate);
            socket.off('newAppointment', fetchBookedSlots);
            socket.off('appointmentBooked', fetchBookedSlots);
        };
    }, [formData.date, formData.doctorId, formData.time, booked]);

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
        let [hours] = time.split(':')?.map(Number);
        if (modifier === 'PM' && hours !== 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        return hours <= currentHour;
    };

    const validateUpiId = (id) => /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(id);

    const handleNext = () => setStep(s => Math.min(s + 1, 5));
    const handleBack = () => setStep(s => Math.max(s - 1, 1));

    const handlePaymentSuccess = async (response, bookingId, bookingData) => {
        try {
            setProcessing(true);
            setProcessingApp('Verifying Payment...');

            const verifyRes = await api.post('/payment/verify-payment', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId
            });

            if (verifyRes.success) {
                setSuccessData({ 
                    ...bookingData, 
                    transactionId: response.razorpay_payment_id,
                    receiptUrl: verifyRes.receiptUrl 
                });
                setBooked(true);
                toast.success('Payment Successful & Booking Confirmed!');
                
                // Real-time update via Socket.io
                socket.emit('paymentSuccess', { ...bookingData, transactionId: response.razorpay_payment_id });
            } else {
                toast.error("Payment verification failed. Please contact support.");
            }
        } catch (err) {
            console.error("Verification Error:", err);
            toast.error("An error occurred during payment verification.");
        } finally {
            setBooking(false);
            setProcessing(false);
        }
    };

    const executePayment = async (method) => {
        try {
            setProcessing(true);
            setBooking(true);

            // 1. Create Appointment in 'pending' status or just get details
            // For simplicity and to match user prompt, we assume the booking is created during verification 
            // OR we create a temporary record.
            // Based on previous code, we book the appointment first but it returns 200.
            // Let's create the appointment first as 'pending' (implied by the user's flow)
            
            const amt = Number(selectedDoctor?.fee) || 500;
            
            // Create Order on Backend
            // We need a bookingId. Let's create the appointment first.
            const bookRes = await api.post('/appointments/book', {
                doctorId: formData.doctorId,
                date: formData.date,
                timeSlot: formData.time,
                amount: amt,
                paymentMethod: method,
                reason: 'Regular Checkup',
                status: 'pending' // Force pending for Razorpay flow
            });

            if (!bookRes.success) {
                throw new Error(bookRes.message || "Booking creation failed");
            }

            const bookingId = bookRes.appointment.id;
            const bookingData = bookRes.appointment;

            // 2. Create Razorpay Order
            const orderRes = await api.post('/payment/create-order', {
                amount: amt,
                bookingId
            });

            if (!orderRes.success) {
                throw new Error("Failed to create payment order");
            }

            // 3. Open Razorpay Checkout
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_your_key", // Use env variable
                amount: orderRes.amount,
                currency: orderRes.currency,
                description: `Appointment with ${selectedDoctor?.fullName?.startsWith('Dr.') ? '' : 'Dr. '}${selectedDoctor?.fullName}`,
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

    const handlePaymentSubmit = (methodOverride = null) => {
        const method = methodOverride || selectedMethod;
        openPopup({
            title: 'Confirm Booking',
            message: `Are you sure you want to schedule this appointment and pay ₹${totalAmount.toFixed(2)}?`,
            confirmText: 'Pay Now',
            onConfirm: () => executePayment(method)
        });
    };

    // Data Guard
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
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                                {processingApp === 'GPAY' ? 'Processing via Google Pay...' :
                                    processingApp === 'PHONEPE' ? 'Processing via PhonePe...' :
                                        processingApp === 'PAYTM' ? 'Processing via Paytm...' : 'Processing Payment...'}
                            </h3>
                            <p className="text-slate-500 font-medium animate-pulse">Please do not refresh or close this page</p>
                        </div>
                    </div>
                </motion.div>
            )}

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
                {/* Header Container */}
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
                            {[1, 2, 3, 4]?.map((s) => (
                                <div key={s} className="flex flex-col items-center gap-1.5 px-3 py-1">
                                    <div className={`h-2.5 w-12 rounded-full transition-all duration-500 ${step >= s ? 'bg-primary-600 shadow-lg shadow-primary-600/30' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= s ? 'text-primary-600' : 'text-slate-400'}`}>Step {s}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className={`${booked ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-6`}>
                        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 min-h-[600px] relative overflow-hidden">
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

                                        <div className="w-full max-w-sm bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 text-left space-y-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Reference</span>
                                                <span className="font-mono font-bold text-slate-900 dark:text-white">{successData?.transactionId}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Doctor</span>
                                                <span className="font-bold text-slate-900 dark:text-white">{successData?.doctorName}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Time</span>
                                                <span className="font-bold text-slate-900 dark:text-white">{successData?.appointmentDate} at {successData?.appointmentTime}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col w-full max-w-sm gap-4">
                                            <button
                                                onClick={() => {
                                                    // PDF Generation via jsPDF
                                                    const doc = new jsPDF();
                                                    const margin = 20;
                                                    let y = 30;

                                                    // Header
                                                    doc.setFontSize(24);
                                                    doc.setTextColor(2, 132, 199); // primary-600
                                                    doc.setFont("helvetica", "bold");
                                                    doc.text("SMARTMEDI HOSPITAL", 105, y, { align: "center" });

                                                    y += 10;
                                                    doc.setFontSize(10);
                                                    doc.setTextColor(100, 116, 139); // slate-500
                                                    doc.text("Care Beyond Excellence • Professional Receipt", 105, y, { align: "center" });

                                                    y += 15;
                                                    doc.setDrawColor(2, 132, 199);
                                                    doc.setLineWidth(1);
                                                    doc.line(margin, y, 210 - margin, y);

                                                    y += 20;
                                                    doc.setFontSize(12);
                                                    doc.setTextColor(30, 41, 59); // slate-800

                                                    // Content Rows
                                                    const rows = [
                                                        ["Receipt ID", successData?.transactionId],
                                                        ["Patient Name", formData.patientName],
                                                        ["Doctor Name", `Dr. ${successData?.doctorName?.replace('Dr. ', '')}`],
                                                        ["Department", successData?.department],
                                                        ["Date", successData?.appointmentDate],
                                                        ["Time", successData?.appointmentTime],
                                                    ];

                                                    rows.forEach(([label, value]) => {
                                                        doc.setFont("helvetica", "bold");
                                                        doc.text(label + ":", margin, y);
                                                        doc.setFont("helvetica", "normal");
                                                        doc.text(String(value), margin + 40, y);
                                                        y += 10;
                                                    });

                                                    y += 5;
                                                    doc.line(margin, y, 210 - margin, y);
                                                    y += 15;

                                                    doc.setFontSize(16);
                                                    doc.setFont("helvetica", "bold");
                                                    doc.text("Amount Paid:", margin, y);
                                                    doc.setTextColor(2, 132, 199);
                                                    doc.text(`INR ${(Number(successData?.amount) || 0).toFixed(2)}`, margin + 40, y);

                                                    y += 15;
                                                    doc.setFontSize(14);
                                                    doc.setTextColor(5, 150, 105); // green-600
                                                    doc.text("STATUS: PAID", 105, y, { align: "center" });

                                                    y += 30;
                                                    doc.setFontSize(10);
                                                    doc.setTextColor(148, 163, 184); // slate-400
                                                    doc.text("Thank you for choosing SmartMedi Hospital.", 105, y, { align: "center" });
                                                    y += 5;
                                                    doc.text("This is a computer-generated receipt.", 105, y, { align: "center" });

                                                    doc.save(`receipt-${successData?.transactionId}.pdf`);
                                                    toast.success("Receipt downloaded successfully!");
                                                }}
                                                className="w-full py-5 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-600/20 flex items-center justify-center gap-3 hover:bg-primary-700 transition-all font-sans"
                                            >
                                                <Download className="w-5 h-5" /> Download PDF Receipt
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setBooked(false);
                                                    setStep(1);
                                                    setFormData({ ...formData, doctorId: null, date: '', time: '' });
                                                }}
                                                className="w-full py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black rounded-2xl"
                                            >
                                                Book Another Appointment
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : !booked && step === 1 && (
                                    <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                                <div className="p-3 bg-primary-50 rounded-2xl text-primary-600"><Stethoscope /></div>
                                                Select Department
                                            </h2>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {DEPARTMENTS?.map((dept) => (
                                                <motion.button type="button" key={dept} whileHover={{ y: -5 }} onClick={() => { setFormData({ ...formData, department: dept }); handleNext(); }} className={`p-6 rounded-[2rem] border-2 transition-all text-left ${formData.department === dept ? 'bg-primary-600 border-primary-600 text-white shadow-xl' : 'bg-slate-50/50 border-transparent hover:border-primary-200'}`}>
                                                    <div className={`p-4 rounded-2xl mb-4 inline-block ${formData.department === dept ? 'bg-white/20' : 'bg-white shadow-sm font-bold'}`}><Activity /></div>
                                                    <h3 className="text-lg font-black leading-tight">{dept}</h3>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {!booked && step === 2 && (
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
                                                {doctors?.map((doc) => (
                                                    <motion.div key={doc.id} whileHover={{ x: 10 }} className={`p-6 rounded-[2rem] border-2 cursor-pointer ${formData.doctorId === doc.id ? 'bg-primary-50/50 border-primary-600' : 'bg-slate-50/50 border-transparent'}`} onClick={() => { setFormData({ ...formData, doctorId: doc.id }); handleNext(); }}>
                                                        <div className="flex items-center gap-6">
                                                            <div className="w-20 h-20 rounded-[1.5rem] bg-primary-600 flex items-center justify-center text-white text-3xl font-black">{doc.name?.charAt(0) || doc.fullName?.charAt(0)}</div>
                                                            <div className="flex-1">
                                                                <h3 className="text-xl font-black text-slate-800 dark:text-white">{doc.name || doc.fullName}</h3>
                                                                <p className="text-primary-600 text-xs font-bold uppercase tracking-widest">{doc.department}</p>
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
                                )}

                                {!booked && step === 3 && (
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
                                                        availableSlots?.map((slot) => {
                                                            const isBooked = bookedSlots.includes(slot.value);
                                                            const isPassed = isSlotPassed(slot.value);
                                                            const isDisabled = isBooked || isPassed;
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    key={slot.value}
                                                                    disabled={isDisabled}
                                                                    onClick={() => setFormData({ ...formData, time: slot.value })}
                                                                    className={`p-4 rounded-2xl border-2 transition-all font-bold text-sm flex items-center justify-between ${formData.time === slot.value
                                                                            ? 'bg-primary-600 border-primary-600 text-white shadow-xl shadow-primary-600/20'
                                                                            : isBooked
                                                                                ? 'bg-red-600/10 border-red-500 text-red-600 cursor-not-allowed'
                                                                                : isPassed
                                                                                    ? 'opacity-30 cursor-not-allowed bg-slate-50 border-transparent'
                                                                                    : 'bg-white border-slate-100 hover:border-primary-200 text-slate-700'
                                                                        }`}
                                                                >
                                                                    <div className="flex flex-col items-start text-left">
                                                                        <span className={`text-sm font-bold ${isBooked ? 'text-red-700' : ''}`}>{slot.display}</span>
                                                                        <span className={`text-[11px] font-black uppercase tracking-wider mt-1 ${isBooked ? 'text-red-600 animate-pulse' : isPassed ? 'text-slate-400' : 'text-green-600 font-black'}`}>
                                                                            {isBooked ? '• ALREADY BOOKED' : isPassed ? 'Passed' : '• Available'}
                                                                        </span>
                                                                    </div>
                                                                    {isBooked ? (
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
                                )}

                                {!booked && step === 4 && (
                                    <motion.div key="step4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                                <button type="button" onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-xl"><ChevronLeft className="w-5 h-5" /></button>
                                                Confirm & Pay
                                            </h2>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                                                <div className="relative space-y-6">
                                                    <div>
                                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Patient</p>
                                                        <h4 className="text-xl font-black">{formData.patientName}</h4>
                                                    </div>
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div>
                                                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Doctor</p>
                                                            <p className="font-bold">Dr. {selectedDoctor?.name || selectedDoctor?.fullName}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Schedule</p>
                                                            <p className="font-bold text-sm">{formData.date}<br />{formData.time}</p>
                                                        </div>
                                                    </div>
                                                    <div className="pt-6 border-t border-white/10">
                                                        <p className="text-3xl font-black text-primary-400">₹{totalAmount.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Select Payment Method</h3>
                                                <div className="space-y-4">
                                                    {[
                                                        { id: 'UPI', name: 'UPI (GPay/Paytm)', icon: <Smartphone className="w-5 h-5" /> },
                                                        { id: 'CARD', name: 'Card Details', icon: <CreditCard className="w-5 h-5" /> },
                                                        { id: 'NETBANKING', name: 'Netbanking', icon: <Landmark className="w-5 h-5" /> }
                                                    ]?.map((method) => (
                                                        <div key={method.id} className="space-y-4">
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedMethod(method.id === selectedMethod ? null : method.id)}
                                                                disabled={booking}
                                                                className={`w-full flex items-center justify-between p-6 rounded-3xl border-2 transition-all group ${selectedMethod === method.id ? 'border-primary-600 bg-primary-50/50' : 'border-slate-50 hover:border-primary-200 dark:border-slate-800 dark:hover:border-primary-800'} ${booking ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className="p-3 bg-white rounded-xl shadow-sm text-primary-600">{method.icon}</div>
                                                                    <span className="font-black text-slate-800 dark:text-white">{method.name}</span>
                                                                </div>
                                                                <ChevronRight className={`w-5 h-5 transition-transform ${selectedMethod === method.id ? 'rotate-90' : ''} text-slate-300`} />
                                                            </button>

                                                            <AnimatePresence>
                                                                {selectedMethod === method.id && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, height: 0 }}
                                                                        animate={{ opacity: 1, height: 'auto' }}
                                                                        exit={{ opacity: 0, height: 0 }}
                                                                        className="overflow-hidden"
                                                                    >
                                                                        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border-2 border-primary-100 dark:border-slate-800 shadow-sm space-y-6">
                                                                            {method.id === 'UPI' && (
                                                                                <div className="space-y-6">
                                                                                    <div className="grid grid-cols-3 gap-3">
                                                                                        {[
                                                                                            { name: 'Google Pay', img: PAYMENT_LOGOS.UPI[0] },
                                                                                            { name: 'PhonePe', img: PAYMENT_LOGOS.UPI[1] },
                                                                                            { name: 'Paytm', img: PAYMENT_LOGOS.UPI[2] }
                                                                                        ]?.map((app) => (
                                                                                            <button
                                                                                                key={app.name}
                                                                                                onClick={() => handlePaymentSubmit('UPI')}
                                                                                                className="flex flex-col items-center gap-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all"
                                                                                            >
                                                                                                <img src={app.img} alt={app.name} className="w-10 h-10 object-contain mx-auto" />
                                                                                                <span className="text-[10px] font-black text-slate-500 uppercase">{app.name.split(' ')[0]}</span>
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                                                                        <p className="text-[10px] font-black uppercase text-slate-400 px-1">Or Pay with UPI ID</p>
                                                                                        <div className="flex gap-2">
                                                                                            <input
                                                                                                type="text"
                                                                                                placeholder="Enter UPI ID (e.g. username@okaxis)"
                                                                                                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:border-primary-400 outline-none transition-all dark:text-white"
                                                                                                value={upiId}
                                                                                                onChange={(e) => setUpiId(e.target.value)}
                                                                                            />
                                                                                            <button
                                                                                                onClick={() => upiId && handlePaymentSubmit('UPI')}
                                                                                                className="px-6 bg-primary-600 text-white rounded-xl font-black text-xs hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
                                                                                            >
                                                                                                PAY
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {method.id === 'CARD' && (
                                                                                <div className="space-y-4 text-left">
                                                                                    <div className="space-y-2">
                                                                                        <p className="text-[10px] font-black uppercase text-slate-400 px-1">Card Number</p>
                                                                                        <div className="relative">
                                                                                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                                                            <input
                                                                                                type="text"
                                                                                                placeholder="0000 0000 0000 0000"
                                                                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:border-primary-400 outline-none transition-all dark:text-white"
                                                                                                value={cardDetails.number}
                                                                                                onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="grid grid-cols-2 gap-4">
                                                                                        <div className="space-y-2">
                                                                                            <p className="text-[10px] font-black uppercase text-slate-400 px-1">Expiry Date</p>
                                                                                            <input
                                                                                                type="text"
                                                                                                placeholder="MM/YY"
                                                                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:border-primary-400 outline-none transition-all dark:text-white"
                                                                                                value={cardDetails.expiry}
                                                                                                onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                                                                                            />
                                                                                        </div>
                                                                                        <div className="space-y-2">
                                                                                            <p className="text-[10px] font-black uppercase text-slate-400 px-1">CVV</p>
                                                                                            <div className="relative">
                                                                                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                                                                <input
                                                                                                    type="password"
                                                                                                    placeholder="***"
                                                                                                    maxLength="3"
                                                                                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:border-primary-400 outline-none transition-all dark:text-white"
                                                                                                    value={cardDetails.cvv}
                                                                                                    onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                                                                                                />
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="space-y-2">
                                                                                        <p className="text-[10px] font-black uppercase text-slate-400 px-1">Cardholder Name</p>
                                                                                        <input
                                                                                            type="text"
                                                                                            placeholder="Full name as on card"
                                                                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:border-primary-400 outline-none transition-all dark:text-white"
                                                                                            value={cardDetails.name}
                                                                                            onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                                                                                        />
                                                                                    </div>
                                                                                    <div className="pt-4">
                                                                                        <button
                                                                                            onClick={() => cardDetails.number && handlePaymentSubmit('CARD')}
                                                                                            disabled={booking}
                                                                                            className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black text-sm hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20 disabled:opacity-50"
                                                                                        >
                                                                                            CONFIRM & PAY ₹{totalAmount.toFixed(2)}
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {method.id === 'NETBANKING' && (
                                                                                <div className="space-y-6">
                                                                                    <div className="grid grid-cols-2 gap-3">
                                                                                        {[
                                                                                            { id: 'SBI', name: 'SBI', img: 'https://img.icons8.com/color/48/state-bank-of-india.png' },
                                                                                            { id: 'HDFC', name: 'HDFC', img: 'https://img.icons8.com/color/48/hdfc-bank.png' },
                                                                                            { id: 'ICICI', name: 'ICICI', img: 'https://img.icons8.com/color/48/icici-bank.png' },
                                                                                            { id: 'AXIS', name: 'AXIS', img: 'https://img.icons8.com/color/48/axis-bank.png' }
                                                                                        ]?.map((bank) => (
                                                                                            <button
                                                                                                key={bank.id}
                                                                                                onClick={() => { setSelectedBank(bank.id); handlePaymentSubmit('NETBANKING'); }}
                                                                                                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${selectedBank === bank.id ? 'border-primary-600 bg-primary-50/50' : 'border-slate-50 hover:border-primary-200 dark:border-slate-800 dark:hover:border-primary-800'}`}
                                                                                            >
                                                                                                <img src={bank.img} alt={bank.name} className="w-8 h-8 object-contain" />
                                                                                                <span className="text-xs font-black text-slate-800 dark:text-white">{bank.name}</span>
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                    <div className="pt-2">
                                                                                        <select 
                                                                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-primary-400 dark:text-white"
                                                                                            onChange={(e) => e.target.value && handlePaymentSubmit('NETBANKING')}
                                                                                        >
                                                                                            <option value="">Select Other Bank</option>
                                                                                            <option value="kotak">Kotak Mahindra Bank</option>
                                                                                            <option value="pnb">Punjab National Bank</option>
                                                                                            <option value="bob">Bank of Baroda</option>
                                                                                        </select>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {!booked && (
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-700">
                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Booking Summary</h4>
                                <div className="space-y-6">
                                    {[
                                        { label: 'Dept', value: formData.department, icon: <Stethoscope className="w-4 h-4" /> },
                                        { label: 'Doctor', value: selectedDoctor?.name || selectedDoctor?.fullName, icon: <User className="w-4 h-4" /> },
                                        { label: 'Schedule', value: formData.date ? `${formData.date} ${formData.time}` : null, icon: <Calendar className="w-4 h-4" />, isBooked: bookedSlots.includes(formData.time) }
                                    ]?.map((item, i) => (
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
                                    <button type="button" onClick={handleNext} disabled={(step === 1 && !formData.department) || (step === 2 && !formData.doctorId) || (step === 3 && (!formData.date || !formData.time || bookedSlots.includes(formData.time))) || (step === 4 && !selectedMethod)} className="flex-[2] py-5 bg-primary-600 text-white font-black rounded-3xl shadow-xl shadow-primary-600/20 active:scale-95 transition-all disabled:opacity-50">Continue</button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
