import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, UserCheck, Calendar, TrendingUp, Loader2, PieChart, Download } from 'lucide-react';

export default function AdminReports() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/reports');
                if (res.success) {
                    setStats(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch report stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();

        // Simulated local events
        const handleSimulatedUpdate = () => {
            setTimeout(() => fetchStats(), 1000);
        };
        window.addEventListener('appointmentBooked', handleSimulatedUpdate);
        window.addEventListener('paymentCompleted', handleSimulatedUpdate);

        return () => {
            window.removeEventListener('appointmentBooked', handleSimulatedUpdate);
            window.removeEventListener('paymentCompleted', handleSimulatedUpdate);
        };
    }, []);

    const handleExport = async () => {
        try {
            const response = await api.get('/reports/admin/financial', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `admin-stats-report-${Date.now()}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export failed:", err);
            alert("Failed to export status report");
        }
    };

    if (loading) {
        return (
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                <p className="text-slate-500 font-medium">Generating reports...</p>
            </div>
        );
    }

    const cards = [
        { title: 'Total Patients', value: stats?.totalPatients || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: 'Total Doctors', value: stats?.totalDoctors || 0, icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { title: 'Total Appointments', value: stats?.totalAppointments || 0, icon: Calendar, color: 'text-primary-600', bg: 'bg-primary-50' },
        { title: 'Growth Ratio', value: '+12%', icon: TrendingUp, color: 'text-primary-600', bg: 'bg-primary-50' },
    ];

    return (
        <div className="space-y-6 animate-fade-in-up uppercase tracking-tight">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">Admin Reports & Analytics</h1>
                <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-primary-700 transition-all active:scale-95"
                >
                    <Download className="w-4 h-4" /> Export Summary
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards?.map((card, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center mb-4`}>
                            <card.icon className={`w-6 h-6 ${card.color}`} />
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">{card.value}</div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{card.title}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest">Appointments by Status</h2>
                    <div className="space-y-4">
                        {stats?.appointmentsByStatus?.map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase">{item.status}</span>
                                    <span className="text-sm font-black text-slate-900 dark:text-white">{item.count}</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                    <div
                                        className="bg-primary-500 h-2 rounded-full"
                                        style={{ width: `${(item.count / stats.totalAppointments) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest">Recent Activity</h2>
                    <div className="space-y-4">
                        {stats?.recentAppointments?.map((apt, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border border-transparent hover:border-slate-100">
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600">
                                    {apt.patientName?.[0]}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">{apt.patientName}</div>
                                    <div className="text-[10px] text-slate-500 font-bold">BOOKED WITH {apt.doctorName}</div>
                                </div>
                                <div className={`text-[10px] font-black px-2 py-0.5 rounded border ${apt.status === 'confirmed' ? 'text-primary-600 border-primary-200' : 'text-amber-600 border-amber-200'}`}>
                                    {apt.status.toUpperCase()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
