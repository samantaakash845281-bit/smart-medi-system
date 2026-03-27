import React, { useState, useEffect } from 'react';
import { Pill, FileText, Download, Calendar, Activity } from 'lucide-react';
import api from '../../services/api';
import socket from '../../services/socket';

export default function PatientPrescriptions() {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPrescriptions = async () => {
        try {
            const res = await api.get('/prescriptions');
            if (res.success) setPrescriptions(res.data);
        } catch (error) {
            console.error("Error fetching prescriptions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrescriptions();

        const handleAdd = () => {
            fetchPrescriptions();
        };

        socket.on('prescriptionAdded', handleAdd);

        return () => {
            socket.off('prescriptionAdded', handleAdd);
        };
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Prescriptions</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">View and download your medical prescriptions.</p>
            </div>

            {prescriptions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {prescriptions?.map((rx) => (
                        <div key={rx.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-100 dark:border-slate-700 font-urbanist">
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary-50 dark:bg-primary-900/40 p-3 rounded-xl text-primary-600 dark:text-primary-400 shrink-0">
                                        <Pill className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">{rx.doctorName}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{rx.specialization}</p>
                                    </div>
                                </div>
                                <span className="bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider">
                                    RX-{rx.id}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Diagnosis</p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">{rx.diagnosis}</p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <Activity className="w-3 h-3" /> Medications
                                    </p>
                                    <ul className="space-y-2">
                                        {JSON.parse(rx.medicines || '[]').slice(0, 3)?.map((med, idx) => (
                                            <li key={idx} className="flex justify-between items-center text-sm">
                                                <span className="text-slate-700 dark:text-slate-300 font-medium">{med.name}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                                                    {med.dosage} • {med.frequency}
                                                </span>
                                            </li>
                                        ))}
                                        {JSON.parse(rx.medicines || '[]').length > 3 && (
                                            <li className="text-xs text-primary-600 font-bold italic">+{JSON.parse(rx.medicines || '[]').length - 3} more medications...</li>
                                        )}
                                    </ul>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(rx.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                                <div className="flex gap-2">
                                    <a 
                                        href={`${api.defaults.baseURL.replace('/api', '')}/${rx.pdf_path}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-2 text-slate-400 hover:text-primary-600 bg-slate-50 rounded-lg dark:bg-slate-900/50 dark:hover:bg-slate-700 transition-all hover:scale-110"
                                        title="View Prescription"
                                    >
                                        <FileText className="w-4 h-4" />
                                    </a>
                                    <a 
                                        href={`${api.defaults.baseURL.replace('/api', '')}/${rx.pdf_path}`} 
                                        download 
                                        className="p-2 text-white bg-primary-600 rounded-lg shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all hover:scale-110"
                                        title="Download PDF"
                                    >
                                        <Download className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-16 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="bg-slate-50 dark:bg-slate-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Pill className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No prescriptions yet</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Your prescriptions will appear here once your consulting doctor issues them after an appointment.</p>
                </div>
            )}
        </div>
    );
}
