import React, { useState, useEffect, useContext } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Activity, Beaker, FileText, HeartPulse, Stethoscope, Download, Search, Pill, AlertCircle, Calendar, X } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function MedicalHistory() {
    const { user } = useContext(AuthContext);
    const { searchTerm } = useOutletContext() || {};
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openRecordDetails = (record) => {
        setSelectedRecord(record);
        setIsModalOpen(true);
    };

    const fetchHistory = async () => {
        const patientId = user?.id || user?.uid;
        if (!patientId) {
            setLoading(false);
            return;
        }
        
        try {
            // Updated to the requested alias route
            // Since we return a raw array now, we set it directly
            const data = await api.get(`/patient/medical-history/patient/${patientId}`);
            setHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching medical history", error);
            setHistory([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [user?.id, user?.uid]);

    const filteredHistory = (Array.isArray(history) ? history : []).filter(record =>
        (record.title || record.doctorName || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    const handleExport = async () => {
        try {
            const response = await api.get('/reports/patient/history', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `medical-history-${Date.now()}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Medical history downloaded");
        } catch (err) {
            console.error("Export failed:", err);
            toast.error("Failed to export medical history");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <>
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Medical History</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Access your past diagnoses, lab reports, and consultation notes.</p>
                </div>
                <button 
                    onClick={handleExport}
                    className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                    <Download className="w-5 h-5" />
                    Download Full PDF
                </button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Records</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{history.length}</p>
                    </div>
                </div>
            </div>


            {/* Timeline View */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 md:p-8">
                {filteredHistory.length > 0 ? (
                    <div className="relative border-l-2 border-slate-100 dark:border-slate-700 ml-3 md:ml-6 space-y-10 py-2">
                        {filteredHistory?.map((record) => {
                            // Map appointment data to history UI format
                            const type = record.type || 'Consultation';
                            const title = record.title || record.symptoms || 'General Consultation';
                            const action_text = record.action_text || 'View Details';
                            const date = record.appointment_date || record.created_at;

                            const Icon = type === 'Prescription' ? Pill : (type === 'Report' ? FileText : Stethoscope);
                            const color = type === 'Prescription' ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/40' : 
                                         (type === 'Report' ? 'text-purple-500 bg-purple-50 dark:bg-purple-900/40' : 
                                         'text-blue-500 bg-blue-50 dark:bg-blue-900/40');
                            
                            return (
                                <div key={record.appointment_id || record.id} className="relative pl-8 md:pl-10">
                                    {/* Timeline dot */}
                                    <div className={`absolute -left-[26px] top-1 w-12 h-12 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center shadow-sm ${color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div 
                                        onClick={() => openRecordDetails(record)}
                                        className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800 transition-colors group cursor-pointer shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    {new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </span>
                                                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${type === 'Prescription' ? 'bg-primary-50 text-primary-700 border-primary-100 dark:bg-primary-900/30' : 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30'}`}>
                                                    {type}
                                                </span>
                                            </div>
                                            <span className="text-xs font-mono text-slate-400">ID: {record.appointment_id || record.id}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-primary-900 dark:text-white mb-1 group-hover:text-primary-600 transition-colors">
                                            {title}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-3">
                                            Provided by Dr. {record.doctorName}
                                        </p>
                                        <div className="flex gap-4">
                                            <span className="text-xs font-medium text-slate-400 italic">
                                                Status: {record.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {/* Bottom timeline dot */}
                        <div className="absolute -left-[9px] -bottom-2 w-4 h-4 rounded-full border-2 border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"></div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="bg-slate-50 dark:bg-slate-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Activity className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No history records found</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Your medical records will appear here as you visit doctors and complete consultations.</p>
                    </div>
                )}
            </div>
        </div>

            {/* Modal Detail View */}
            {isModalOpen && selectedRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold border-2 border-primary-200 dark:border-primary-800/50">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Record Details</h3>
                                    <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">ID: #{selectedRecord.appointment_id || selectedRecord.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto space-y-6">
                            
                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Stethoscope className="w-3 h-3 text-primary-500"/> Provider</p>
                                    <p className="font-bold text-sm text-slate-900 dark:text-white uppercase">
                                        Dr. {(selectedRecord.doctorName || selectedRecord.doctor || "Medical Specialist").replace('Dr. ', '')}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Calendar className="w-3 h-3 text-blue-500"/> Date</p>
                                    <p className="font-bold text-sm text-slate-900 dark:text-white uppercase">
                                        {new Date(selectedRecord.appointment_date || selectedRecord.created_at || Date.now()).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-emerald-500"/> Condition / Title
                                </h4>
                                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                    <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                                        {selectedRecord.symptoms || selectedRecord.title || selectedRecord.reason || "General Consultation"}
                                    </p>
                                </div>
                            </div>

                            {/* Prescriptions Logic exactly like PatientDetail to parse pure JSON meds */}
                            {selectedRecord.medicines && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Pill className="w-4 h-4 text-purple-500"/> Prescribed Medications
                                    </h4>
                                    <div className="p-4 bg-purple-50/30 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30 space-y-4">
                                        {(() => {
                                            let medsList = [];
                                            try {
                                                if (typeof selectedRecord.medicines === 'string' && selectedRecord.medicines.startsWith('[')) {
                                                    medsList = JSON.parse(selectedRecord.medicines);
                                                } else {
                                                    // Legacy fallback
                                                    medsList = [{ NAME: selectedRecord.medicines, DOSAGE: selectedRecord.dosage }];
                                                }
                                            } catch {
                                                medsList = [{ NAME: selectedRecord.medicines, DOSAGE: selectedRecord.dosage }];
                                            }

                                            return medsList.map((med, idx) => (
                                                <div key={idx} className="pb-4 last:pb-0 border-b border-purple-100/50 dark:border-purple-800/20 last:border-0 relative">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{med.NAME || med.name}</p>
                                                        {(med.DOSAGE || med.dosage) && <span className="text-[10px] w-fit font-black text-purple-600 bg-white dark:bg-slate-800 border-2 border-purple-100 dark:border-purple-900 px-3 py-1 rounded lowercase">{med.DOSAGE || med.dosage}</span>}
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        {(med.FREQUENCY || med.frequency) && <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest opacity-80">{med.FREQUENCY || med.frequency}</p>}
                                                        {(med.INSTRUCTIONS || med.instructions) && <p className="text-xs font-medium text-slate-500 italic opacity-80">"{med.INSTRUCTIONS || med.instructions}"</p>}
                                                    </div>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* Action text / Notes */}
                            {selectedRecord.action_text && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-slate-400"/> Doctor's Notes
                                    </h4>
                                    <div className="p-5 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30 relative">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-200 dark:bg-amber-700 rounded-l-xl"></div>
                                        <p className="text-sm italic font-medium text-amber-900 dark:text-amber-200 leading-relaxed pl-2">
                                            "{selectedRecord.action_text}"
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
