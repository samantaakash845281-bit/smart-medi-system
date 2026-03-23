import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
    ChevronLeft, Mail, Phone, Calendar, User, Activity, 
    FileText, Heart, Clock, Loader2, ClipboardList 
} from 'lucide-react';

export default function PatientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPatientDetails = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/admin/patients/${id}`);
                if (res.success) {
                    setPatient(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch patient details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPatientDetails();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Loading patient profile...</p>
            </div>
        );
    }

    if (!patient) return <div className="p-8 text-center text-slate-500">Patient not found.</div>;

    const stats = [
        { label: "Total Visits", value: patient.totalAppointments || 0, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/30" },
        { label: "Active Prescriptions", value: (patient.prescriptions || []).length, icon: FileText, color: "text-primary-600", bg: "bg-primary-50 dark:bg-primary-900/30" },
        { label: "Health Status", value: patient.status || "ACTIVE", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
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
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Patient Record</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-bold opacity-70">Complete medical history and profile overview.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-3xl mb-4 border-4 border-white dark:border-slate-700 shadow-xl">
                                {patient.fullName?.split(' ')?.map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">{patient.fullName}</h2>
                            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Patient ID: #{1000 + (patient.patient_id || patient.id)}</p>
                            
                            <div className="w-full mt-6 space-y-3 text-left">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 lowercase">{patient.email}</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{patient.phone || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                                    <User className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{patient.gender || 'N/A'}, {patient.age || 'N/A'} Yrs</span>
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

                {/* Right Column: History & Prescriptions */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Medical History */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-primary-600" />
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Medical History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-slate-50 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Doctor</th>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Type / Condition</th>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {(patient.medicalHistory || [])?.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                                                {(() => {
                                                    const d = new Date(row.appointment_date || row.date);
                                                    if (isNaN(d.getTime())) return "N/A";
                                                    return d < new Date().setHours(0,0,0,0) ? "Expired" : d.toLocaleDateString();
                                                })()}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{row.doctorName || row.doctor}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                                                {row.specialization || row.condition || 'Consultation'}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                    (row.status || '').toLowerCase() === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {row.status || 'Past'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {(patient.medicalHistory || []).length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-bold">No medical records found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Prescriptions */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                            <Heart className="w-5 h-5 text-red-600" />
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Active Prescriptions</h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(patient.prescriptions || [])?.map((p, i) => {
                                    let medsList = [];
                                    try {
                                        if (typeof p.medicines === 'string' && p.medicines.startsWith('[')) {
                                            medsList = JSON.parse(p.medicines);
                                        } else {
                                            medsList = [{ NAME: p.medicines, DOSAGE: p.dosage }];
                                        }
                                    } catch {
                                        medsList = [{ NAME: p.medicines, DOSAGE: p.dosage }];
                                    }

                                    return (
                                        <div key={i} className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                            <div className="mb-3 space-y-3">
                                                {medsList.map((med, idx) => (
                                                    <div key={idx} className="pb-3 last:pb-0 border-b last:border-0 border-slate-200 dark:border-slate-700/50">
                                                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{med.NAME || med.name || 'Unknown Medicine'}</p>
                                                        {(med.DOSAGE || med.dosage || med.FREQUENCY || med.frequency || med.INSTRUCTIONS || med.instructions) && (
                                                            <div className="flex flex-wrap gap-2 mt-2 items-center">
                                                                {(med.DOSAGE || med.dosage) && <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-1 rounded lowercase">{med.DOSAGE || med.dosage}</span>}
                                                                {(med.FREQUENCY || med.frequency) && <span className="text-[10px] font-black text-slate-600 bg-slate-200/50 px-2 py-1 rounded uppercase tracking-widest">{med.FREQUENCY || med.frequency}</span>}
                                                                {(med.INSTRUCTIONS || med.instructions) && <span className="text-[10px] font-bold text-slate-500 italic block w-full mt-1">"{(med.INSTRUCTIONS || med.instructions).toLowerCase()}"</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                    Dr. {p.doctorName?.replace('Dr. ', '') || 'Unknown'}
                                                </p>
                                                <span className="text-[10px] font-bold text-slate-400">{new Date(p.created_at || p.date || Date.now()).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {(patient.prescriptions || []).length === 0 && (
                                    <div className="col-span-2 text-center py-6 text-slate-500 font-bold opacity-50 italic">
                                        No active prescriptions.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
