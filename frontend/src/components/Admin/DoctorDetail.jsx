import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
    ChevronLeft, Mail, Phone, Calendar, Briefcase, Award, 
    TrendingUp, Users, CheckCircle, Clock, Loader2, IndianRupee 
} from 'lucide-react';

export default function DoctorDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDoctorDetails = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/admin/doctors/${id}`);
                if (res.success) {
                    setDoctor(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch doctor details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDoctorDetails();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Loading doctor profile...</p>
            </div>
        );
    }

    if (!doctor) return <div className="p-8 text-center text-slate-500">Doctor not found.</div>;

    const stats = [
        { label: "Total Patients", value: doctor.totalPatients || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/30" },
        { label: "Completed Appts", value: doctor.completedAppointments || 0, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
        { label: "Total Earnings", value: `₹${(doctor.totalEarnings || 0).toLocaleString()}`, icon: IndianRupee, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/30" },
    ];

    return (
        <div className="space-y-6 animate-fade-in-up uppercase tracking-tight">
            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <ChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Doctor Details</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-bold opacity-70">Review profile, schedules, and performance metrics.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-3xl mb-4 border-4 border-white dark:border-slate-700 shadow-xl">
                                {doctor.fullName?.split(' ')?.map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">{doctor.fullName}</h2>
                            <p className="text-primary-600 font-black text-sm uppercase tracking-widest mt-1">{doctor.specialization}</p>
                            
                            <div className="w-full mt-6 space-y-3 text-left">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 lowercase">{doctor.email}</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{doctor.phone || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                                    <Award className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{doctor.experience || 'N/A'} of Experience</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 gap-4">
                        {stats?.map((stat, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-lg font-black text-slate-900 dark:text-white">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Schedule & Appointments */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Availability */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary-600" />
                            Work Schedule
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                                <p className="text-xs font-black text-slate-500 uppercase mb-1">Available Days</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{doctor.available_days}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                                <p className="text-xs font-black text-slate-500 uppercase mb-1">Time Slots</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                    {(() => {
                                        const str = doctor.available_time_slots;
                                        if (!str) return "N/A";
                                        
                                        let startTime, endTime;
                                        if (str.includes(',') && str.includes('-')) {
                                            const slots = str.split(',');
                                            startTime = slots[0].split('-')[0]?.trim();
                                            endTime = slots[slots.length - 1].split('-')[1]?.trim();
                                        } else if (str.includes('-')) {
                                            const parts = str.split('-');
                                            startTime = parts[0]?.trim();
                                            endTime = parts[1]?.trim();
                                        }

                                        if (startTime && endTime) {
                                            return `Morning ${startTime} to ${endTime} Night`;
                                        }
                                        return str;
                                    })()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Appointments */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Recent Appointments</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-slate-50 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Patient</th>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {(doctor.recentAppointments || doctor.recentActivity || [])?.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{row.patientName || row.patient}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                                                {(() => {
                                                    const d = new Date(row.appointment_date || row.date);
                                                    if (isNaN(d.getTime())) return "N/A";
                                                    return d < new Date().setHours(0,0,0,0) ? "Expired" : d.toLocaleDateString();
                                                })()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg border ${
                                                    (row.status || '').toLowerCase() === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    'bg-primary-50 text-primary-700 border-primary-200'
                                                }`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!doctor.recentAppointments && !doctor.recentActivity) && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-slate-500 font-bold">No recent activity.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
