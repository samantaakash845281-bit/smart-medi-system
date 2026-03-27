import React, { useContext, useState, useEffect } from 'react';
import { Calendar, Activity, Pill, Clock, Loader2, FileText } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import socket from '../../services/socket';
import toast from 'react-hot-toast';

export default function PatientDashboard() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState({ upcomingAppointments: 0, activePrescriptions: 0, labReports: 0, pastVisits: 0 });
    const [nextAppt, setNextAppt] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const [statsRes, apptsRes, presRes] = await Promise.all([
                api.get('/patient/dashboard-stats'),
                api.get('/patient/appointments'),
                api.get('/patient/prescriptions')
            ]);
            if (statsRes.success) setStats(statsRes.data);
            if (apptsRes.success) {
                // Filter for upcoming non-cancelled appointments.
                // We use setHours(0,0,0,0) on both to compare just the date part.
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const upcoming = (Array.isArray(apptsRes.data) ? apptsRes.data : [])
                    .filter(a => {
                        if (!a?.appointment_date || a.status === 'cancelled') return false;
                        const apptDate = new Date(a.appointment_date);
                        apptDate.setHours(0, 0, 0, 0);
                        return apptDate >= today;
                    })
                    .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))[0];
                setNextAppt(upcoming || null);
            }
            if (presRes.success) setPrescriptions(Array.isArray(presRes.data) ? presRes.data.slice(0, 2) : []);
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            socket.emit('joinPatientRoom', user?.id);
        }

        fetchData(true);

        const handleBooking = (data) => {
            // Check if this booking belongs to the current patient
            if (data?.patient_id === user?.id || data?.patientId === user?.id) {
                // Instantly update next appointment if empty or newer
                if (!nextAppt || new Date(data.appointment_date) < new Date(nextAppt.appointment_date)) {
                    setNextAppt(data);
                }
                // Background fetch for full stats
                fetchData(false);
            }
        };

        const handlePrescription = (data) => {
            fetchData(false);
        };

        const handlePayment = (data) => {
            fetchData(false);
        };

        const handleCancellation = (data) => {
            fetchData(false);
        };

        socket.on('appointmentBooked', handlePayment);
        socket.on('prescriptionAdded', handlePrescription);
        socket.on('paymentCompleted', handlePayment);
        socket.on('appointmentCancelled', handleCancellation);
        socket.on('appointmentStatusUpdated', handlePayment); // Refresh data on status change
        socket.on('appointmentUpdated', () => fetchData(false));

        return () => {
            socket.off('appointmentBooked', handlePayment);
            socket.off('prescriptionAdded', handlePrescription);
            socket.off('paymentCompleted', handlePayment);
            socket.off('appointmentCancelled', handleCancellation);
            socket.off('appointmentStatusUpdated', handlePayment);
            socket.off('appointmentUpdated');
        };
    }, [user?.id]);

    const summaryCards = [
        { title: "Upcoming Appointments", count: stats?.upcomingAppointments || 0, icon: Calendar, color: "text-primary-600", bg: "bg-primary-50 dark:bg-primary-900/30", border: "border-primary-100 dark:border-primary-800", path: "/patient-dashboard/appointments" },
        { title: "Active Prescriptions", count: stats?.activePrescriptions || 0, icon: Pill, color: "text-primary-600", bg: "bg-primary-50 dark:bg-primary-900/30", border: "border-primary-100 dark:border-primary-800", path: "/patient-dashboard/prescriptions" },
        { title: "Lab Reports", count: stats?.labReports || 0, icon: Activity, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-900/30", border: "border-teal-100 dark:border-teal-800", path: "/patient-dashboard/history" },
        { title: "Past Visits", count: stats?.pastVisits || 0, icon: Clock, color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-800/50", border: "border-slate-200 dark:border-slate-700", path: "/patient-dashboard/appointments" },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight capitalize">Welcome back, {(user?.fullName || user?.name || 'Patient').split(' ')[0]}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Here is the latest update on your health.</p>
                </div>
                <Link to="/patient-dashboard/book-appointment" className="px-4 py-2 bg-primary-600 border border-transparent rounded-[10px] text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-primary-700 hover:shadow-md transform active:scale-95">
                    Book Appointment
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {summaryCards?.map((card, index) => (
                    <div 
                        key={index} 
                        onClick={() => navigate(card.path)}
                        className="bg-white dark:bg-slate-800 rounded-[10px] p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.title}</p>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{card.count}</h3>
                            </div>
                            <div className={`p-3 rounded-xl ${card.bg} border ${card.border}`}>
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Next Appointment Card */}
                <div className="bg-white dark:bg-slate-800 rounded-[10px] p-6 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative group">
                    <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-primary-50/50 to-transparent dark:from-primary-900/10 group-hover:w-full transition-all duration-700 ease-out z-0"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Next Appointment</h3>
                            {nextAppt && nextAppt.appointment_date && (
                                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full dark:bg-indigo-900/30 dark:text-indigo-400">
                                    {(() => {
                                        const d = new Date(nextAppt.appointment_date);
                                        if (isNaN(d.getTime())) return 'Upcoming';
                                        return d.toDateString() === new Date().toDateString() ? 'Today' : 'Upcoming';
                                    })()}
                                </span>
                            )}
                        </div>
                        {nextAppt ? (
                            <>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex flex-col items-center justify-center text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
                                        <span className="text-xs font-black uppercase">{nextAppt?.appointment_date ? new Date(nextAppt.appointment_date).toLocaleDateString(undefined, { month: 'short' }) : '---'}</span>
                                        <span className="text-xl font-black">{nextAppt?.appointment_date ? new Date(nextAppt.appointment_date).getDate() : '--'}</span>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">{nextAppt?.doctorName || "Pending Assignment"}</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{nextAppt?.department || "General"} | {nextAppt?.time_slot || "Time TBD"}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-[10px] flex-1 border border-slate-200 dark:border-slate-800 transition-colors duration-200">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">Date</p>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                                            {(() => {
                                                const d = new Date(nextAppt.appointment_date);
                                                if (isNaN(d.getTime())) return "N/A";
                                                return d < new Date().setHours(0,0,0,0) ? "Expired" : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                                            })()}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-[10px] flex-1 border border-slate-200 dark:border-slate-800 transition-colors duration-200">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">Time</p>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{nextAppt.appointment_time}</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="py-8 text-center bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                <p className="text-slate-500 text-sm font-medium">No upcoming appointments</p>
                                <Link to="/patient-dashboard/book-appointment" className="text-primary-600 text-xs font-bold mt-2 inline-block hover:underline">Book one now</Link>
                            </div>
                        )}
                        <div className="mt-6 flex gap-3">
                            <Link to="/patient-dashboard/appointments" className="flex-1 text-center px-4 py-2.5 bg-primary-600 border border-transparent rounded-[10px] text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-primary-700 hover:shadow-md transform active:scale-95">Manage</Link>
                            <Link to="/patient-dashboard/book-appointment" className="flex-1 text-center px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[10px] text-sm font-bold text-slate-700 dark:text-slate-300 shadow-sm transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-700 transform active:scale-95">New</Link>
                        </div>
                    </div>
                </div>

                {/* Active Prescriptions */}
                <div className="bg-white dark:bg-slate-800 rounded-[10px] p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Prescriptions</h3>
                        <Link to="/patient-dashboard/prescriptions" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">View All</Link>
                    </div>
                    <div className="space-y-4">
                        {Array.isArray(prescriptions) && prescriptions.length > 0 ? prescriptions?.map((med, i) => (
                            <div key={med?.id || i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 hover:border-primary-200 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-primary-600">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{med?.medicine_name || "Prescription"}</h4>
                                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{med?.doctorName || 'Unknown'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">{med?.created_at ? new Date(med.created_at).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="py-8 text-center bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                <p className="text-slate-500 text-sm font-medium">No recent prescriptions</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
