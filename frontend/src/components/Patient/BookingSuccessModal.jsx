import React from 'react';
import { CheckCircle2, Download, X, Calendar, Clock, User, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { BACKEND_URL } from '../../services/api';

export default function BookingSuccessModal({ isOpen, onClose, data }) {
    if (!isOpen) return null;
    const bookingData = data || {
        doctorName: 'Specialist',
        appointmentDate: 'TBD',
        appointmentTime: 'TBD',
        amount: 500,
        transactionId: 'SM-PENDING',
        paymentMethod: 'UPI'
    };

    const handleDownload = () => {
        if (data?.receiptURL) {
            const link = document.createElement('a');
            link.href = `${BACKEND_URL}${data.receiptURL}`;
            link.target = '_blank';
            link.download = `Receipt_${bookingData.transactionId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            // Simulate PDF download with a simple text-based receipt
            const receiptContent = `
SMARTMEDI HOSPITAL - PAYMENT RECEIPT
--------------------------------------
Receipt No: ${bookingData.transactionId}
Date: ${new Date().toLocaleDateString()}
Patient: ${user?.fullName || user?.name || 'Valued Patient'}
Doctor: ${bookingData.doctorName}
Department: ${bookingData.department || 'General Consultation'}
Schedule: ${bookingData.appointmentDate} at ${bookingData.appointmentTime}
--------------------------------------
Description: Professional Consultation
Amount Paid: ₹${parseFloat(bookingData.amount || 500).toFixed(2)}
Status: SUCCESSFUL
--------------------------------------
Thank you for choosing SmartMedi!
            `;
            const blob = new Blob([receiptContent], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Receipt_${bookingData.transactionId}.txt`;
            link.click();
            window.URL.revokeObjectURL(url);
            toast.success("Receipt downloaded (Demo Mode)");
        }
    };

    const user = (() => {
        try {
            return JSON.parse(sessionStorage.getItem('user'));
        } catch (e) {
            return null;
        }
    })();

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                >
                    {/* Invoice Header */}
                    <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-black text-xl italic shadow-lg shadow-primary-600/20">S</div>
                                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">SMARTMEDI <span className="text-primary-600">HOSPITAL</span></h1>
                            </div>
                            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex justify-between items-end text-slate-500 dark:text-slate-400">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Receipt No</p>
                                <p className="text-sm font-mono font-bold text-slate-800 dark:text-white">{bookingData.transactionId || 'SM-DEMO-PAY'}</p>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Date</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'Long', year: 'numeric' })}</p>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Content */}
                    <div className="p-8 space-y-8">
                        {/* Patient & Doctor Info */}
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient Name</p>
                                <p className="font-bold text-slate-800 dark:text-white">{user?.fullName || user?.name || 'Akash Samanta'}</p>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</p>
                                <p className="font-bold text-slate-800 dark:text-white">General Consultation</p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Doctor</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white">{bookingData.doctorName}</p>
                            <p className="text-sm text-slate-500 font-medium">Appointment: {bookingData.appointmentDate} at {bookingData.appointmentTime}</p>
                        </div>

                        {/* Financial Table */}
                        <div className="pt-6 border-t-2 border-dashed border-slate-100 dark:border-slate-800 space-y-4">
                            <div className="flex justify-between items-center text-xs">
                                <p className="text-slate-400 font-bold uppercase tracking-tighter">Description</p>
                                <p className="text-slate-400 font-bold uppercase tracking-tighter">Amount</p>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <p className="text-slate-600 dark:text-slate-300 font-medium italic">Professional Consultation Fee</p>
                                <p className="font-bold text-slate-800 dark:text-white">₹{parseFloat(bookingData.amount || 500).toFixed(2)}</p>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <p className="text-slate-600 dark:text-slate-300 font-medium italic">Service & Platform Charges</p>
                                <p className="font-bold text-teal-600 dark:text-teal-400 opacity-60">FREE</p>
                            </div>
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Payment Method</p>
                                    <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">{bookingData.paymentMethod || 'UPI'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount Paid</p>
                                    <p className="text-3xl font-black text-primary-600 tracking-tighter">₹{parseFloat(bookingData.amount || 500).toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-center gap-2 py-2 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-teal-100 dark:border-teal-900/50">
                                <CheckCircle2 className="w-4 h-4" /> Transaction Successful & Verified
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleDownload}
                                className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:translate-y-[-2px] transition-all active:scale-[0.98] shadow-xl shadow-slate-900/10"
                            >
                                <Download className="w-5 h-5" />
                                DOWNLOAD INVOICE (PDF)
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full py-4 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
                            >
                                DONE
                            </button>
                            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
                                Thank you for choosing SmartMedi
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
