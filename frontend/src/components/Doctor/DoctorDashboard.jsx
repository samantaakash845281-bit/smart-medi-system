import React, { useContext, useState, useEffect } from 'react';
import { Users, Calendar, Activity, Pill, ShieldCheck, Download } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import socket from '../../services/socket';
import toast from 'react-hot-toast';

export default function DoctorDashboard() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalPatients: 0, upcomingAppointments: 0, todayAppointments: 0, prescriptions: 0 });
    const [todayAppts, setTodayAppts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const [statsRes, apptsRes] = await Promise.all([
                api.get('/doctor/dashboard-stats'),
                api.get('/doctor/appointments?date=today')
            ]);

            if (statsRes.success) setStats(statsRes.data);
            if (apptsRes.success) {
                setTodayAppts(Array.isArray(apptsRes.data) ? apptsRes.data : []);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            socket.emit('joinDoctorRoom', user?.id);
        }
        
        fetchDashboardData(true);

        const handleBooking = (data) => {
            // Check if the appointment is for this doctor
            if (data?.doctor_id === user?.id || data?.doctorId === user?.id) {
                // Instantly update local todayAppts if the booking is for today
                const today = new Date().toISOString().split('T')[0];
                if (data.appointment_date === today || data.date === today) {
                    setTodayAppts(prev => [data, ...prev]);
                }
                // Fetch full background sync
                fetchDashboardData(false);
            }
        };

        const handleCancellation = (data) => {
            toast.error('An appointment was cancelled', {
                icon: '❌'
            });
            fetchDashboardData(false);
        };

        const handlePayment = (data) => {
            setTimeout(() => fetchDashboardData(false), 1000);
        };

        socket.on('appointmentBooked', handleBooking);
        socket.on('appointmentCancelled', handleCancellation);
        socket.on('paymentCompleted', handlePayment);

        return () => {
            socket.off('appointmentBooked', handleBooking);
            socket.off('appointmentCancelled', handleCancellation);
            socket.off('paymentCompleted', handlePayment);
        };
    }, [user?.id]);

    const handleExport = async () => {
        try {
            const response = await api.get('/reports/doctor/summary', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `performance-summary-${Date.now()}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export failed:", err);
            toast.error("Failed to export summary report");
        }
    };

    const summaryCards = [
        { title: "Total Patients", count: stats?.totalPatients || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30", border: "border-blue-200 dark:border-blue-800", path: "/doctor-dashboard/patients" },
        { title: "Today's Appointments", count: stats?.todayAppointments || 0, icon: Calendar, color: "text-primary-600", bg: "bg-primary-100 dark:bg-primary-900/30", border: "border-primary-200 dark:border-primary-800", path: "/doctor-dashboard/appointments" },
        { title: "Upcoming (Pending)", count: stats?.upcomingAppointments || 0, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-100 dark:bg-indigo-900/30", border: "border-indigo-200 dark:border-indigo-800", path: "/doctor-dashboard/appointments" },
        { title: "Notifications", count: Array.isArray(todayAppts) ? todayAppts.filter(a => a?.status === 'Pending').length : 0, icon: Pill, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30", border: "border-amber-200 dark:border-amber-800", path: "/doctor-dashboard/appointments" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight capitalize">Welcome, Dr. {(user?.name || user?.fullName || 'Doctor').split(' ').pop()}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Here's your schedule for today.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleExport}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 shadow-sm transition-all hover:bg-slate-50 active:scale-95 flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" /> Export Summary
                    </button>
                    <Link to="/doctor-dashboard/profile" className="px-4 py-2 bg-primary-600 border border-transparent rounded-lg text-sm font-medium text-white shadow-sm transition hover:bg-primary-700">
                        My Profile
                    </Link>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {summaryCards?.map((card, index) => (
                    <div 
                        key={index} 
                        onClick={() => navigate(card.path)}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all duration-300 group cursor-pointer"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-primary-600 transition-colors uppercase tracking-wider text-[10px]">{card.title}</p>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{card.count}</h3>
                            </div>
                            <div className={`p-3 rounded-xl ${card.bg} border ${card.border} transition-transform duration-300 group-hover:scale-110`}>
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today's Appointments List */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Today's Schedule</h3>
                            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 text-xs font-bold rounded-full">
                                {todayAppts.length} Appointments
                            </span>
                        </div>
                        <Link to="/doctor-dashboard/appointments" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1">
                            Manage All <Activity className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {/* Highlight Next Appointment */}
                        {Array.isArray(todayAppts) && todayAppts.length > 0 && todayAppts.find(a => a?.status === 'confirmed') && (
                            <div className="px-6 py-4 bg-primary-50/30 dark:bg-primary-900/10 border-b border-primary-100 dark:border-primary-900/20">
                                <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-2">Next Upcoming</p>
                                {(() => {
                                    const next = todayAppts.find(a => a?.status === 'confirmed');
                                    return (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-primary-600 rounded-xl flex flex-col items-center justify-center text-white shadow-lg shadow-primary-600/20">
                                                    <span className="text-xs font-bold uppercase">{next?.appointment_time ? (next.appointment_time.includes(':') ? `${next.appointment_time.split(':')[0]}:${next.appointment_time.split(':')[1].substring(0,2)}` : next.appointment_time) : '00:00'}</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{next?.patientName || "Unknown Patient"}</h4>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{next?.department || "General"} | Status: {next?.status || "Confirmed"}</p>
                                                </div>
                                            </div>
                                            <Link to={`/doctor-dashboard/appointments`} className="px-4 py-2 bg-white dark:bg-slate-800 text-primary-600 border border-primary-200 dark:border-primary-800 rounded-lg text-xs font-bold hover:bg-primary-50 transition-colors shadow-sm">
                                                Check In
                                            </Link>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {Array.isArray(todayAppts) && todayAppts.length > 0 ? todayAppts?.map((apt, i) => (
                            <div key={apt?.id || i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 text-sm font-semibold text-slate-600 dark:text-slate-400 text-center">
                                        {apt?.appointment_time}
                                    </div>
                                    <div className={`h-10 w-1 rounded-full ${apt?.status === 'confirmed' ? 'bg-primary-500' : apt?.status === 'completed' ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors tracking-tight">{apt?.patientName || "Unknown"}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {apt?.department || "General"}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold uppercase text-slate-500 mb-1 flex items-center justify-end gap-1">
                                        <ShieldCheck className="w-3 h-3 text-primary-500" />
                                        {apt?.payment_status || 'Paid'}
                                    </p>
                                    <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border ${apt?.status === 'confirmed' ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800' :
                                        apt?.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                                            'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
                                        }`}>
                                        {apt?.status || "Pending"}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="px-6 py-16 text-center">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200 dark:border-slate-700">
                                    <Calendar className="w-10 h-10 text-slate-300" />
                                </div>
                                <h4 className="text-slate-900 dark:text-white font-bold">No confirmed appointments</h4>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-[250px] mx-auto">You don't have any paid appointments scheduled for today yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6 flex flex-col h-full">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex-1">

                        <h3 className="text-sm font-semibold text-slate-500 tracking-wider uppercase mb-4 dark:text-slate-400">Recently Viewed</h3>
                        <div className="space-y-4">
                            {Array.isArray(stats?.recentlyViewedPatients) && stats.recentlyViewedPatients.length > 0 ? stats.recentlyViewedPatients?.map((patient, i) => (
                                <div key={patient?.id || i} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors">
                                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold">
                                        {patient?.name ? patient.name.charAt(0) : '?'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{patient?.name || "Unknown Patient"}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">ID: PT-{1000 + (patient?.id || 0)}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">No recent patients</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
