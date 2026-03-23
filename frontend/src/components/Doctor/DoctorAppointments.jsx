import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Calendar, Clock, Video, FileText, CheckCircle2, ChevronRight, Search, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import socket from '../../services/socket';
import { toast } from 'react-hot-toast';
import { usePopup } from '../../context/PopupContext';

export default function DoctorAppointments() {
    const { searchTerm } = useOutletContext();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [reschedulingAppt, setReschedulingAppt] = useState(null);
    const [rescheduleData, setRescheduleData] = useState({ date: '', timeSlot: '' });
    const [deletedItem, setDeletedItem] = useState(null);
    const [undoTimer, setUndoTimer] = useState(null);
    const navigate = useNavigate();
    const { openPopup, showUndo } = usePopup();

    const timeSlots = [
        "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
        "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
        "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM"
    ];

    // Calendar Helpers
    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

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
            console.log('Appointments list real-time update');
            fetchAppointments(false);
        };

        socket.on('newAppointment', handleUpdate);
        socket.on('appointmentBooked', handleUpdate); // Fallback
        socket.on('appointmentCancelled', handleUpdate);
        socket.on('paymentCompleted', handleUpdate);
        
        return () => {
            socket.off('newAppointment', handleUpdate);
            socket.off('appointmentBooked', handleUpdate);
            socket.off('appointmentCancelled', handleUpdate);
            socket.off('paymentCompleted', handleUpdate);
        };
    }, []);

    const executeStatusUpdate = async (id, newStatus) => {
        setUpdatingId(id);
        try {
            const res = await api.put(`/doctor/appointment-status/${id}`, { status: newStatus });
            if (!res.success) throw new Error(res.message);
            fetchAppointments(false);
        } catch (error) {
            toast.error(error.message || 'Failed to update status');
            fetchAppointments(false); // revert on failure
        } finally {
            setUpdatingId(null);
        }
    };

    const handleUndo = (itemToRestore, timerId) => {
        clearTimeout(timerId);
        setAppointments(prev => prev.map(a => a.id === itemToRestore.id ? itemToRestore : a));
        setDeletedItem(null);
        setUndoTimer(null);
    };

    const handleStatusUpdate = (id, newStatus) => {
        const actionMap = {
            'confirmed': 'Accept',
            'rejected': 'Reject',
            'cancelled': 'Cancel',
            'completed': 'Complete'
        };
        const actionText = actionMap[newStatus] || 'Update';

        openPopup({
            title: `${actionText} Appointment?`,
            message: `Are you sure you want to mark this appointment as ${newStatus}?`,
            confirmText: actionText,
            type: (newStatus === 'rejected' || newStatus === 'cancelled') ? 'delete' : 'confirm',
            onConfirm: () => {
                const appt = appointments.find(a => a.id === id);
                if (!appt) return;

                setDeletedItem(appt);
                
                // Optimistic update
                setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));

                const timer = setTimeout(async () => {
                    executeStatusUpdate(id, newStatus);
                    setDeletedItem(null);
                    setUndoTimer(null);
                }, 5000);
                
                setUndoTimer(timer);

                showUndo(`Appointment marked as ${newStatus}`, () => {
                    console.log("Deleted / Updated:", appt);
                    handleUndo(appt, timer);
                });
            }
        });
    };

    const handleStartConsult = async (appointmentId) => {
        setUpdatingId(appointmentId);
        try {
            const res = await api.put(`/doctor/appointments/${appointmentId}/start-consult`);
            if (res.success) {
                toast.success('Consultation started');
                navigate(`/doctor-dashboard/consult/${appointmentId}`);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to start consultation');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleRescheduleClick = (appt) => {
        setReschedulingAppt(appt);
        setRescheduleData({
            date: new Date(appt.appointment_date).toISOString().split('T')[0],
            timeSlot: appt.appointment_time
        });
        setShowRescheduleModal(true);
    };

    const handleRescheduleSubmit = async (e) => {
        e.preventDefault();
        if (!reschedulingAppt) return;

        setUpdatingId(reschedulingAppt.id);
        try {
            const res = await api.put(`/doctor/appointments/${reschedulingAppt.id}/reschedule`, {
                date: rescheduleData.date,
                timeSlot: rescheduleData.timeSlot
            });

            if (res.success) {
                toast.success('Appointment rescheduled');
                setShowRescheduleModal(false);
                fetchAppointments(false);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to reschedule');
        } finally {
            setUpdatingId(null);
        }
    };

    const filterByDate = (appt) => {
        if (!selectedDate) return true;
        const apptDate = new Date(appt.appointment_date).toISOString().split('T')[0];
        return apptDate === selectedDate;
    };

    const safeSearchTerm = (searchTerm || "").toLowerCase();

    const pendingAppts = (Array.isArray(appointments) ? appointments : []).filter(a =>
        a && a.status === 'pending' &&
        filterByDate(a) &&
        (a.patientName?.toLowerCase().includes(safeSearchTerm))
    );
    const upcomingAppts = (Array.isArray(appointments) ? appointments : []).filter(a =>
        a && a.status === 'confirmed' &&
        filterByDate(a) &&
        (a.patientName?.toLowerCase().includes(safeSearchTerm))
    );
    const completedAppts = (Array.isArray(appointments) ? appointments : []).filter(a =>
        a && (a.status === 'completed' || a.status === 'rejected' || a.status === 'cancelled') &&
        filterByDate(a) &&
        (a.patientName?.toLowerCase().includes(safeSearchTerm))
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse">Loading appointments...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Appointments</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your daily schedule and upcoming patient consultations.</p>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column - Search & Upcoming List */}
                <div className="lg:col-span-2 space-y-6">

                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-500" />
                            Pending Requests
                        </h2>

                        <div className="space-y-4 mb-10">
                            {(Array.isArray(pendingAppts) && pendingAppts.length > 0) ? pendingAppts?.map((appt) => (
                                <div key={appt?.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border-2 border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/10 transition-colors group">
                                    <div className="w-24 shrink-0 flex flex-col justify-center border-r border-slate-200 dark:border-slate-700">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{appt?.appointment_time || "N/A"}</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {(() => {
                                                const d = new Date(appt?.appointment_date);
                                                if (isNaN(d.getTime())) return "N/A";
                                                return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                            })()}
                                        </span>
                                    </div>

                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-900 dark:text-white">{appt?.patientName || "Unknown Patient"}</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{appt?.department || "General"}</p>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Status: <span className="text-amber-600 font-medium uppercase">{appt?.status || "Pending"}</span></p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-primary-500" /> Payment: {appt?.payment_status || 'Paid'}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            disabled={updatingId === appt?.id}
                                            onClick={() => handleStatusUpdate(appt?.id, 'confirmed')}
                                            className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            disabled={updatingId === appt?.id}
                                            onClick={() => handleStatusUpdate(appt?.id, 'rejected')}
                                            className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-slate-400 py-4 text-sm border border-dashed rounded-xl">No pending requests</p>
                            )}
                        </div>

                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary-500" />
                            Confirmed Schedule
                        </h2>

                        <div className="space-y-4">
                            {(Array.isArray(upcomingAppts) && upcomingAppts.length > 0) ? upcomingAppts?.map((appt) => (
                                <div key={appt?.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800 transition-colors group bg-slate-50 dark:bg-slate-900/50">
                                    <div className="w-24 shrink-0 flex flex-col justify-center border-r border-slate-200 dark:border-slate-700">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{appt?.appointment_time || "N/A"}</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {(() => {
                                                const d = new Date(appt?.appointment_date);
                                                if (isNaN(d.getTime())) return "N/A";
                                                return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                            })()}
                                        </span>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">{appt?.patientName || "Unknown Patient"}</h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{appt?.department || "General"}</p>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Status: <span className="text-primary-600 font-medium uppercase">{appt?.status || "Confirmed"}</span></p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-primary-500" /> Payment: {appt?.payment_status || 'Paid'}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1 ${appt?.type === 'Video Consult'
                                                ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
                                                : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                                                }`}>
                                                {appt?.type === 'Video Consult' ? <Video className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                {appt?.type || "Visit"}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                                            <span className="font-medium">Reason: </span>{appt?.reason || "Checkup"}
                                        </p>
                                    </div>

                                    <div className="flex sm:flex-col justify-end gap-2 shrink-0">
                                        <button
                                            onClick={() => handleStartConsult(appt?.id)}
                                            disabled={updatingId === appt?.id}
                                            className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors text-center shadow-sm disabled:opacity-50"
                                        >
                                            Start Consult
                                        </button>
                                        <button
                                            onClick={() => handleRescheduleClick(appt)}
                                            disabled={updatingId === appt?.id}
                                            className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors text-center disabled:opacity-50"
                                        >
                                            Reschedule
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-slate-500 py-8">No upcoming appointments found.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Mini Calendar & Completed */}
                <div className="space-y-6 text-slate-900 dark:text-white">
                    {/* Mini Calendar */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex flex-col">
                                <h3 className="font-bold text-slate-900 dark:text-white capitalize">
                                    {currentMonth?.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </h3>
                                {selectedDate && (
                                    <button
                                        onClick={() => setSelectedDate(null)}
                                        className="text-[10px] text-primary-600 font-bold hover:underline text-left mt-0.5"
                                    >
                                        Clear Filter
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-1">
                                <button onClick={prevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"><ChevronRight className="w-5 h-5 rotate-180 text-slate-500" /></button>
                                <button onClick={nextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"><ChevronRight className="w-5 h-5 text-slate-500" /></button>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                            <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-sm">
                            {/* Empty slots for days before the 1st of the month */}
                            {Array.from({ length: (getFirstDayOfMonth(currentMonth) + 6) % 7 })?.map((_, i) => (
                                <div key={`empty-${i}`} className="py-2" />
                            ))}

                            {/* Days of the month */}
                            {Array.from({ length: getDaysInMonth(currentMonth) })?.map((_, i) => {
                                const day = i + 1;
                                const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const isToday = new Date().toISOString().split('T')[0] === dateStr;
                                const isSelected = selectedDate === dateStr;

                                const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const isPast = cellDate < today;

                                // Check if this day has any appointments
                                const hasAppts = Array.isArray(appointments) && appointments.some(a => {
                                    const d = new Date(a?.appointment_date);
                                    if (isNaN(d.getTime())) return false;
                                    return d.toISOString().split('T')[0] === dateStr;
                                });

                                return (
                                    <button
                                        key={day}
                                        disabled={isPast}
                                        onClick={() => !isPast && setSelectedDate(isSelected ? null : dateStr)}
                                        className={`
                                            py-2 rounded-lg font-medium transition-all relative group
                                            ${isSelected
                                                ? 'bg-primary-600 text-white font-bold shadow-md shadow-primary-500/20'
                                                : isToday
                                                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 border border-primary-200 dark:border-primary-800'
                                                    : isPast 
                                                        ? 'opacity-30 cursor-not-allowed text-slate-400'
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                                            }
                                        `}
                                    >
                                        {day}
                                        {hasAppts && !isSelected && (
                                            <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isToday ? 'bg-primary-600' : 'bg-slate-400 group-hover:bg-primary-400'}`} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Completed Appointments */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-primary-500" />
                            {selectedDate ? 'Appointments on ' + (() => {
                                const d = new Date(selectedDate);
                                if (isNaN(d.getTime())) return "Selected Date";
                                return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                            })() : 'Recent Completed'}
                        </h2>
                        <div className="space-y-3">
                            {(() => {
                                const currentList = (selectedDate ? (Array.isArray(appointments) ? appointments.filter(a => {
                                    const d = new Date(a?.appointment_date);
                                    if (isNaN(d.getTime())) return false;
                                    return d.toISOString().split('T')[0] === selectedDate;
                                }) : []) : (Array.isArray(completedAppts) ? completedAppts : []));
                                
                                return currentList.length > 0 ? currentList.slice(0, 5)?.map((appt) => (
                                    <div key={appt?.id} className="flex gap-3 items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${appt?.status === 'confirmed' ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                            <FileText className={`w-5 h-5 ${appt?.status === 'confirmed' ? 'text-primary-600' : 'text-slate-500 dark:text-slate-400'}`} />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{appt?.patientName || "Unknown Patient"}</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {(() => {
                                                    const d = new Date(appt?.appointment_date);
                                                    if (isNaN(d.getTime())) return "N/A";
                                                    return d < new Date().setHours(0,0,0,0) ? "Expired" : d.toLocaleDateString();
                                                })()} • {appt?.appointment_time || "N/A"}
                                            </p>
                                        </div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500">
                                            {appt?.status || "Record"}
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-center text-slate-400 py-4 text-xs">No records found</p>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>
            {/* Reschedule Modal */}
            {showRescheduleModal && reschedulingAppt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Reschedule Appointment</h3>
                            <button onClick={() => setShowRescheduleModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <ChevronRight className="w-6 h-6 rotate-90" />
                            </button>
                        </div>

                        <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4">
                            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-900/30 mb-4">
                                <p className="text-sm text-primary-700 dark:text-primary-300 font-medium">Patient: <span className="font-bold">{reschedulingAppt?.patientName || "Unknown"}</span></p>
                                <p className="text-xs text-primary-600/70 dark:text-primary-400/70 mt-0.5">
                                    Current: {(() => {
                                        const d = new Date(reschedulingAppt?.appointment_date);
                                        if (isNaN(d.getTime())) return "Unknown Date";
                                        return d.toLocaleDateString();
                                    })()} at {reschedulingAppt?.appointment_time || "N/A"}
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">New Date</label>
                                <input
                                    type="date"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    value={rescheduleData?.date}
                                    onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">New Time Slot</label>
                                <select
                                    required
                                    value={rescheduleData?.timeSlot}
                                    onChange={(e) => setRescheduleData({ ...rescheduleData, timeSlot: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all appearance-none"
                                >
                                    {(Array.isArray(timeSlots) ? timeSlots : [])?.map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowRescheduleModal(false)}
                                    className="flex-1 px-4 py-3 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updatingId === reschedulingAppt?.id}
                                    className="flex-1 px-4 py-3 font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {updatingId === reschedulingAppt?.id ? <Clock className="w-4 h-4 animate-spin" /> : 'Confirm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
