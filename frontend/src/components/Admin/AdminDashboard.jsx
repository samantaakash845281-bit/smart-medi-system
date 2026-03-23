import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import socket from '../../services/socket';
import { Users, Stethoscope, Calendar, Activity, Loader2 } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import toast from 'react-hot-toast';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalPatients: 0,
        totalDoctors: 0,
        appointmentsToday: 0,
        totalRevenue: 0,
        todayRevenue: 0
    });
    const [recentAppts, setRecentAppts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardData = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        setError(null);
        try {
            const [statsRes, apptsRes] = await Promise.all([
                api.get('/admin/dashboard-stats').catch(err => ({ success: false, error: err })),
                api.get('/admin/appointments').catch(err => ({ success: false, error: err }))
            ]);

            if (statsRes && statsRes.success) {
                setStats(prev => ({
                    ...prev,
                    ...statsRes.data,
                    totalRevenue: Number(statsRes.data?.totalRevenue) || 0,
                    todayRevenue: Number(statsRes.data?.todayRevenue) || 0
                }));
            }

            if (apptsRes && apptsRes.success) {
                setRecentAppts(Array.isArray(apptsRes.data) ? apptsRes.data.slice(0, 5) : []);
            }
        } catch (err) {
            console.error("Critical failure in admin dashboard data fetch:", err);
            setError("Failed to load dashboard data. Please try again later.");
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData(true);

        socket.emit('joinAdminRoom');

        // Real-time updates via Socket.io
        const handleBooking = (data) => {
            // Update local state instantly for the "Recent Appointments" table
            setRecentAppts(prev => [data, ...prev].slice(0, 5));
            // Trigger a silent background fetch for full stats update
            fetchDashboardData(false);
        };

        const handleCancellation = (data) => {
            toast.error('An appointment was cancelled', {
                icon: '❌',
            });
            fetchDashboardData(false);
        };

        const handlePayment = (data) => {
            setTimeout(() => fetchDashboardData(false), 1000);
        };

        const handlePrescription = (data) => {
            fetchDashboardData(false);
        };

        socket.on('appointmentBooked', handleBooking);
        socket.on('appointmentCancelled', handleCancellation);
        socket.on('paymentCompleted', handlePayment);
        socket.on('doctorAdded', () => fetchDashboardData(false));
        socket.on('paymentStatusUpdated', () => fetchDashboardData(false));
        socket.on('newManualPayment', () => fetchDashboardData(false));

        return () => {
            socket.off('appointmentBooked', handleBooking);
            socket.off('appointmentCancelled', handleCancellation);
            socket.off('paymentCompleted', handlePayment);
            socket.off('prescriptionAdded', handlePrescription);
            socket.off('doctorAdded');
            socket.off('paymentStatusUpdated');
            socket.off('newManualPayment');
        };
    }, []);

    const summaryCards = [
        { title: "Total Patients", count: stats.totalPatients || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30", border: "border-blue-200 dark:border-blue-800", path: "/admin-dashboard/patients" },
        { title: "Total Doctors", count: stats.totalDoctors || 0, icon: Stethoscope, color: "text-indigo-600", bg: "bg-indigo-100 dark:bg-indigo-900/30", border: "border-indigo-200 dark:border-indigo-800", path: "/admin-dashboard/doctors" },
        { title: "Appointments Today", count: stats.appointmentsToday || 0, icon: Calendar, color: "text-primary-600", bg: "bg-primary-100 dark:bg-primary-900/30", border: "border-primary-200 dark:border-primary-800", path: "/admin-dashboard/appointments" },
        { title: "Today's Revenue", count: `₹${(Number(stats.todayRevenue) || 0).toLocaleString()}`, icon: Activity, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30", border: "border-emerald-200 dark:border-emerald-800", path: "/admin-dashboard/payments" },
        { title: "Total Revenue", count: `₹${(Number(stats.totalRevenue) || 0).toLocaleString()}`, icon: Activity, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30", border: "border-amber-200 dark:border-amber-800", path: "/admin-dashboard/payments" },
    ];

    const lineChartData = {
        labels: (stats.registrationTrend || [])?.map(t => t.month),
        datasets: [
            {
                fill: true,
                label: 'Patients Registered',
                data: (stats.registrationTrend || [])?.map(t => t.count),
                borderColor: '#0284c7',
                backgroundColor: 'rgba(2, 132, 199, 0.1)',
                tension: 0.4,
            },
        ],
    };

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        scales: {
            y: { 
                beginAtZero: true, 
                ticks: { stepSize: 1 },
                grid: { color: 'rgba(148, 163, 184, 0.1)' } 
            },
            x: { grid: { display: false } }
        }
    };

    const barChartData = {
        labels: (stats.appointmentsByDepartment || [])?.map(d => d.department),
        datasets: [
            {
                label: 'Appointments',
                data: (stats.appointmentsByDepartment || [])?.map(d => d.count),
                backgroundColor: '#38bdf8',
                borderRadius: 4,
            },
        ],
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
            x: { grid: { display: false } }
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Loading overview...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 m-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                    <Activity className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard Overview</h1>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-700">
                        Export Report
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {summaryCards?.map((card, index) => (
                    <div 
                        key={index} 
                        onClick={() => navigate(card.path)}
                        className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all duration-300 group cursor-pointer"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-primary-600 transition-colors uppercase tracking-wider text-[10px]">{card.title}</p>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{card.count}</h3>
                            </div>
                            <div className={`p-3 rounded-xl ${card.bg} border ${card.border} group-hover:scale-110 transition-transform duration-300`}>
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Patient Registration Trend</h3>
                    <div className="h-[300px]">
                        <Line data={lineChartData} options={lineChartOptions} />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Appointments by Department</h3>
                    <div className="h-[300px]">
                        <Bar data={barChartData} options={barChartOptions} />
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Appointments</h3>
                    <Link to="/admin-dashboard/appointments" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">View All</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Patient</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Doctor</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Date & Time</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {recentAppts.length > 0 ? recentAppts?.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors uppercase tracking-tight">
                                    <td className="px-6 py-4 text-sm font-medium">
                                        <span 
                                            onClick={() => navigate(`/admin-dashboard/patients/${row.patient_id}`)}
                                            className="text-slate-900 dark:text-slate-300 cursor-pointer hover:text-primary-600 transition-colors"
                                        >
                                            {row.patientName}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span 
                                            onClick={() => navigate(`/admin-dashboard/doctors/${row.doctor_id}`)}
                                            className="text-slate-500 dark:text-slate-400 cursor-pointer hover:text-primary-600 transition-colors"
                                        >
                                            {row.doctorName}
                                        </span>
                                        <span className="text-slate-400 dark:text-slate-500 ml-1">({row.department})</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                        {(() => {
                                            const d = new Date(row.appointment_date);
                                            if (isNaN(d.getTime())) return "N/A";
                                            return d < new Date().setHours(0,0,0,0) ? "Expired" : d.toLocaleDateString();
                                        })()}, {row.appointment_time}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border ${row.status === 'confirmed' ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400' :
                                            row.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        No appointments found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
