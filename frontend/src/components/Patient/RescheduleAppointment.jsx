import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Calendar, Clock, ChevronLeft, Loader2, CheckCircle2, AlertCircle, Stethoscope, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function RescheduleAppointment() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [rescheduling, setRescheduling] = useState(false);
    const [appointment, setAppointment] = useState(null);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [bookedSlots, setBookedSlots] = useState([]);
    const [fetchingSlots, setFetchingSlots] = useState(false);

    // Fetch appointment details
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await api.get(`/appointments/${appointmentId}`);
                if (res.success) {
                    setAppointment(res.data);
                    // Pre-fill date if it's in the future
                    const apptDate = new Date(res.data.appointment_date).toISOString().split('T')[0];
                    if (new Date(apptDate) > new Date()) {
                        setDate(apptDate);
                    }
                } else {
                    toast.error('Appointment not found');
                    navigate('/patient-dashboard/appointments');
                }
            } catch (err) {
                console.error(err);
                toast.error('Failed to load appointment details');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [appointmentId, navigate]);

    // Fetch booked slots when date changes
    useEffect(() => {
        const fetchSlots = async () => {
            if (!date || !appointment?.doctor_id) return;
            setFetchingSlots(true);
            try {
                const res = await api.get(`/appointments/booked-slots/${appointment.doctor_id}?date=${date}`);
                if (res.success) {
                    setBookedSlots(res.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setFetchingSlots(false);
            }
        };
        fetchSlots();
    }, [date, appointment?.doctor_id]);

    const handleReschedule = async () => {
        if (!date || !time) {
            toast.error('Please select both date and time');
            return;
        }

        setRescheduling(true);
        try {
            const res = await api.put(`/appointments/${appointmentId}/reschedule`, {
                date,
                timeSlot: time
            });

            if (res.success) {
                toast.success('Appointment Rescheduled Successfully');
                setTimeout(() => navigate('/patient-dashboard/appointments'), 1500);
            } else {
                toast.error(res.message || 'Rescheduling failed');
            }
        } catch (err) {
            toast.error('An error occurred during rescheduling');
        } finally {
            setRescheduling(false);
        }
    };

    const timeSlots = [
        "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
        "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
        "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
        "04:00 PM", "04:30 PM", "05:00 PM"
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
                <p className="text-slate-500 font-bold">Loading details...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                    <ChevronLeft className="w-6 h-6 text-slate-600" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Reschedule Appointment</h1>
                    <p className="text-slate-500 font-medium">Change your appointment date and time</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Current Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-24 h-24 rounded-[2rem] bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                                <Stethoscope className="w-12 h-12 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">{appointment?.doctorName}</h3>
                                <p className="text-primary-600 font-bold text-sm uppercase tracking-widest">{appointment?.department}</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-slate-50 dark:border-slate-700">
                            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                <Calendar className="w-5 h-5 text-primary-500" />
                                <span className="font-bold text-sm">{new Date(appointment?.appointment_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                <Clock className="w-5 h-5 text-primary-500" />
                                <span className="font-bold text-sm">{appointment?.appointment_time}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reschedule Form */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 space-y-8">
                        {/* Date Selection */}
                        <div className="space-y-4">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Select New Date
                            </label>
                            <input 
                                type="date" 
                                value={date}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => { setDate(e.target.value); setTime(''); }}
                                className="w-full p-6 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary-500 rounded-[2rem] text-lg font-black outline-none transition-all"
                            />
                        </div>

                        {/* Time Selection */}
                        <div className="space-y-4">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Select New Time
                            </label>
                            
                            {!date ? (
                                <div className="p-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50">
                                    <Calendar className="w-8 h-8" />
                                    <p className="font-bold uppercase text-[10px] tracking-widest">Select date first to see slots</p>
                                </div>
                            ) : fetchingSlots ? (
                                <div className="flex items-center justify-center p-10">
                                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {timeSlots.map((slot) => {
                                        const isBooked = bookedSlots.includes(slot);
                                        return (
                                            <button
                                                key={slot}
                                                disabled={isBooked}
                                                onClick={() => setTime(slot)}
                                                className={`p-3 rounded-2xl border-2 font-bold text-xs transition-all ${
                                                    time === slot
                                                        ? 'bg-primary-600 border-primary-600 text-white shadow-lg scale-105'
                                                        : isBooked
                                                            ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/50 text-rose-600 cursor-not-allowed'
                                                            : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50 text-emerald-600 hover:border-emerald-400'
                                                }`}
                                            >
                                                {slot}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="pt-6">
                            <button
                                onClick={handleReschedule}
                                disabled={rescheduling || !date || !time}
                                className="w-full p-6 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-primary-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                {rescheduling ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-6 h-6" />
                                        Confirm Reschedule
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
