import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Video, XCircle, MoreVertical, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import socket from '../../services/socket';
import { usePopup } from '../../context/PopupContext';
import { toast } from 'react-hot-toast';

export default function PatientAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { openPopup } = usePopup();
    const [filter, setFilter] = useState('All');

    const fetchAppointments = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const res = await api.get('/appointments');
            if (res.success) {
                setAppointments(Array.isArray(res.data) ? res.data : []);
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments(true);

        const handleUpdate = () => {
            console.log('Patient Appointments real-time update');
            fetchAppointments(false);
        };

        socket.on('newAppointment', handleUpdate);
        socket.on('appointmentConfirmed', handleUpdate);
        socket.on('appointmentBooked', handleUpdate); // Fallback
        socket.on('appointmentCancelled', handleUpdate);
        socket.on('paymentCompleted', handleUpdate);
        socket.on('appointmentStatusUpdated', handleUpdate);
        socket.on('appointmentUpdated', handleUpdate);

        return () => {
            socket.off('newAppointment', handleUpdate);
            socket.off('appointmentConfirmed', handleUpdate);
            socket.off('appointmentBooked', handleUpdate);
            socket.off('appointmentCancelled', handleUpdate);
            socket.off('paymentCompleted', handleUpdate);
            socket.off('appointmentStatusUpdated', handleUpdate);
            socket.off('appointmentUpdated', handleUpdate);
        };
    }, []);

    const filteredAppts = (Array.isArray(appointments) ? appointments : []).filter(apt => {
        if (!apt) return false;
        if (filter === 'All') return true;
        return apt.status?.toLowerCase() === (filter || "").toLowerCase();
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse">Loading your appointments...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Appointments</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">View your upcoming visits and past appointment history.</p>
                </div>
                <a
                    href="/patient-dashboard/book-appointment"
                    className="bg-primary-600 text-white px-5 py-2.5 rounded-[10px] font-bold hover:bg-primary-700 transition-all duration-200 shadow-sm shadow-primary-600/10 transform active:scale-95"
                >
                    Book New Visit
                </a>
            </div>

            {/* Filter Tabs */}
            <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                {['All', 'Pending', 'Confirmed', 'Rejected', 'Cancelled']?.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-4 py-2 text-sm font-bold rounded-[10px] whitespace-nowrap transition-all duration-200 ${filter === tab
                            ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Appointment Cards */}
            <div className="grid grid-cols-1 gap-6">
                {(Array.isArray(filteredAppts) && filteredAppts.length > 0) ? filteredAppts?.map((appt) => (
                    <div key={appt?.id} className="bg-white dark:bg-slate-800 rounded-[10px] p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between hover:shadow-md transition-all duration-200 group">

                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center flex-1">
                            {/* Date Block */}
                            <div className="w-full md:w-32 h-24 bg-primary-50 dark:bg-primary-900/20 rounded-[10px] flex flex-col items-center justify-center shrink-0 border border-primary-100 dark:border-primary-900/50 transition-colors duration-200">
                                {(() => {
                                    const d = new Date(appt?.appointment_date);
                                    if (isNaN(d.getTime())) return <span className="text-xl font-black text-slate-400">N/A</span>;
                                    if (d < new Date().setHours(0,0,0,0)) return <span className="text-xl font-black text-red-600 dark:text-red-400">Expired</span>;
                                    return (
                                        <>
                                            <span className="text-primary-600 dark:text-primary-400 font-bold text-sm uppercase tracking-wider">
                                                {d.toLocaleDateString(undefined, { month: 'short' })}
                                            </span>
                                            <span className="text-3xl font-black text-primary-700 dark:text-primary-500 my-1">
                                                {d.toLocaleDateString(undefined, { day: '2-digit' })}
                                            </span>
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Details */}
                            <div className="flex-1 space-y-3">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                                        {appt?.doctorName || "Unknown Doctor"}
                                    </h3>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${appt?.status?.toLowerCase() === 'pending' ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30' :
                                        appt?.status?.toLowerCase() === 'confirmed' ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400' :
                                            'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                        {appt?.status || "Pending"}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
                                    <div className="flex items-center gap-1.5 font-bold text-primary-600">
                                        <Activity className="w-4 h-4" />
                                        {appt?.department || "General"}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        {appt?.appointment_time || "N/A"}
                                    </div>
                                </div>

                                <div className="flex items-start gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span className="line-clamp-1">In-person Visit • {appt?.location || 'Hospital Clinic'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex md:flex-col gap-3 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-700 pt-4 md:pt-0 md:pl-6">
                            {appt?.status?.toLowerCase() === 'pending' ? (
                                <div className="flex gap-2 w-full md:flex-col">
                                    <a
                                        href={`/patient-dashboard/payment/${appt?.id}`}
                                        className="flex-1 md:flex-none justify-center px-4 py-2.5 font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-[10px] transition-all duration-200 shadow-sm shadow-primary-600/10 transform active:scale-95 whitespace-nowrap text-center"
                                    >
                                        Pay Now
                                    </a>
                                    <button
                                        onClick={() => {
                                            openPopup({
                                                title: 'Cancel Booking?',
                                                message: 'Are you sure you want to cancel this appointment? This action cannot be undone.',
                                                confirmText: 'Yes, Cancel',
                                                cancelText: 'No, Keep it',
                                                type: 'delete',
                                                onConfirm: async () => {
                                                    try {
                                                        await api.put(`/payments/cancel/${appt?.id}`);
                                                        toast.success('Appointment cancelled');
                                                        fetchAppointments(false);
                                                    } catch (err) {
                                                        toast.error('Failed to cancel appointment');
                                                    }
                                                }
                                            });
                                        }}
                                        className="flex-1 md:flex-none justify-center px-4 py-2.5 font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:border-red-800 rounded-[10px] transition-all duration-200 whitespace-nowrap transform active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : appt?.status?.toLowerCase() === 'confirmed' ? (
                                <button
                                    onClick={() => navigate(`/patient-dashboard/reschedule/${appt?.id}`)}
                                    className="flex-1 md:flex-none justify-center px-4 py-2.5 font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-[10px] transition-all duration-200 shadow-sm shadow-primary-600/10 transform active:scale-95 whitespace-nowrap"
                                >
                                    Reschedule
                                </button>
                            ) : (
                                <button className="w-full justify-center px-4 py-2.5 font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-600 dark:text-slate-300 rounded-[10px] transition-all duration-200 flex items-center gap-2 transform active:scale-95">
                                    <Calendar className="w-4 h-4" /> Book Again
                                </button>
                            )}
                        </div>
                    </div>
                )) : (
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-100 dark:border-slate-700">
                        <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No appointments found</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">You don't have any {(filter || "all").toLowerCase()} appointments.</p>
                        {filter !== 'All' && (
                            <button onClick={() => setFilter('All')} className="text-primary-600 hover:underline">View all appointments</button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
