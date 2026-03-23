import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';

const AppointmentSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect if visited directly without state
    if (!location.state) {
        return <Navigate to="/patient-dashboard/appointments" replace />;
    }

    const { date, time, doctorId } = location.state;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto mt-16 p-10 bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700 text-center"
        >
            <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                >
                    <CheckCircle className="w-12 h-12 text-primary-500" />
                </motion.div>
                <motion.div
                    className="absolute inset-0 border-4 border-primary-500 rounded-full"
                    initial={{ scale: 0.8, opacity: 1 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                />
            </div>

            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Payment Successful</h1>
            <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                Your appointment has been confirmed.
            </p>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl mb-8 flex justify-center gap-6 divide-x divide-slate-200 dark:divide-slate-700 border border-slate-100 dark:border-slate-800">
                <div className="px-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
                    <p className="font-bold text-slate-900 dark:text-white">{date}</p>
                </div>
                <div className="px-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Time</p>
                    <p className="font-bold text-slate-900 dark:text-white">{time}</p>
                </div>
            </div>

            <button
                onClick={() => navigate('/patient-dashboard/appointments')}
                className="w-full py-5 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 shadow-2xl shadow-primary-500/20 transition-all flex items-center justify-center gap-3 group"
            >
                View My Appointments
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
        </motion.div>
    );
};

export default AppointmentSuccess;
