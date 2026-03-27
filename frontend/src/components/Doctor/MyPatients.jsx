import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Eye, Filter, Calendar, Activity, Phone, Mail, Loader2, User, X, MessageSquare, ClipboardList, Thermometer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import socket from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

export default function MyPatients() {
    const { searchTerm } = useOutletContext() || {};
    const { user } = useAuth();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [history, setHistory] = useState({ prescriptions: [], reports: [], notes: [] });
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [fetchingHistory, setFetchingHistory] = useState(false);

    useEffect(() => {
        const fetchPatients = async () => {
            if (!user?.id) return;
            try {
                // Fetch from the requested alias route
                const data = await api.get(`/doctor/patients/doctor/${user?.id}`);
                setPatients(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch patients", err);
                setPatients([]);
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();

        const handleUpdate = () => {
            console.log('Doctor Patients real-time update');
            fetchPatients();
        };

        socket.on('appointmentBooked', handleUpdate);

        return () => {
            socket.off('appointmentBooked', handleUpdate);
        };
    }, []);

    const handleHistoryClick = async (patient) => {
        setSelectedPatient(patient);
        setFetchingHistory(true);
        setShowHistoryModal(true);
        try {
            const res = await api.get(`/doctor/patients/${patient.id}/history`);
            if (res.success) {
                setHistory(res.data);
            }
        } catch (error) {
            toast.error('Failed to fetch patient history');
        } finally {
            setFetchingHistory(false);
        }
    };

    const handleAddNoteClick = (patient) => {
        setSelectedPatient(patient);
        setNote('');
        setShowNoteModal(true);
    };

    const handleNoteSubmit = async (e) => {
        e.preventDefault();
        if (!note.trim()) return;
        setSubmitting(true);
        try {
            const res = await api.post(`/doctor/patients/${selectedPatient.id}/notes`, { note });
            if (res.success) {
                toast.success('Note added successfully');
                setShowNoteModal(false);
            }
        } catch (error) {
            toast.error('Failed to add note');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredPatients = (Array.isArray(patients) ? patients : []).filter(patient => {
        const safeSearchTerm = (searchTerm || '').toLowerCase();
        return (patient.fullName || '').toLowerCase().includes(safeSearchTerm) ||
            String(patient.id || '').includes(safeSearchTerm) ||
            (patient.email && patient.email.toLowerCase().includes(safeSearchTerm));
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800';
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
            default: return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Loading patient records...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Patients</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">View and manage the patients assigned to you.</p>
                </div>
            </div>


            {/* Patient Grid / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPatients?.map((patient) => (
                    <div key={patient.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow group relative overflow-hidden">

                        {/* Status line top */}
                        <div className={`absolute top-0 left-0 w-full h-1 ${patient.status === 'active' ? 'bg-primary-500' : 'bg-slate-300'}`}></div>

                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-lg">
                                    {patient.fullName ? patient.fullName.split(' ')?.map(n => n[0]).join('') : 'PT'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{patient.fullName}</h3>
                                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">ID: PT-{1000 + patient.id}</span>
                                </div>
                            </div>
                            <div className="flex bg-slate-50 dark:bg-slate-900/50 rounded-lg p-1">
                                <button
                                    onClick={() => handleHistoryClick(patient)}
                                    className="p-1.5 text-slate-400 hover:text-primary-600 rounded transition-colors"
                                    title="View Details & History"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleHistoryClick(patient)}
                                    className="p-1.5 text-slate-400 hover:text-primary-600 rounded transition-colors"
                                    title="View Medical Records"
                                >
                                    <Activity className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-start justify-between">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Email</span>
                                <span className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[150px]">{patient.email}</span>
                            </div>
                            <div className="flex items-start justify-between">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Current Status</span>
                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-lg border ${getStatusColor(patient.status)}`}>{patient.status}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Joined On</span>
                                <span className="text-slate-900 dark:text-white font-medium flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-primary-500" />
                                    {new Date(patient.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <a href={`tel:${patient.phone}`} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 dark:text-slate-300 dark:bg-slate-900/50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <Phone className="w-4 h-4" /> Call
                            </a>
                             <button
                                onClick={() => handleAddNoteClick(patient)}
                                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                            >
                                <MessageSquare className="w-4 h-4" /> Add Note
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {patients.length === 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-100 dark:border-slate-700">
                    <User className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No patients yet</h3>
                    <p className="text-slate-500 dark:text-slate-400">You haven't been assigned any patients yet.</p>
                </div>
            )}

            {patients.length > 0 && filteredPatients.length === 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-100 dark:border-slate-700">
                    <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No matches found</h3>
                    <p className="text-slate-500 dark:text-slate-400">We couldn't find any patients matching "{searchTerm}"</p>
                </div>
            )}
            {/* Add Note Modal */}
            {showNoteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add Patient Note</h3>
                            <button onClick={() => setShowNoteModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleNoteSubmit} className="p-6 space-y-4">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Adding a private note for <span className="font-bold text-slate-900 dark:text-white">{selectedPatient?.fullName}</span>. This will only be visible to you and other consulting doctors.</p>
                            <textarea
                                required
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Enter clinical notes, observations or reminders..."
                                rows="5"
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                            ></textarea>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowNoteModal(false)} className="flex-1 px-4 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Note'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedPatient?.fullName}'s Records</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Comprehensive Medical Timeline</p>
                            </div>
                            <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                            {fetchingHistory ? (
                                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                    <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                                    <p className="text-slate-500 font-medium">Retrieving medical archives...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Notes Section */}
                                    <section className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4 text-primary-500" />
                                            Clinical Notes
                                        </h4>
                                        <div className="space-y-3">
                                            {history.notes?.map(n => (
                                                <div key={n.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{n.note}"</p>
                                                    <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        <span>{n.doctorName}</span>
                                                        <span>{(() => {
                                                            const d = new Date(n.appointment_date || n.date || n.created_at);
                                                            if (isNaN(d.getTime())) return "N/A";
                                                            return d < new Date().setHours(0,0,0,0) ? "Expired" : d.toLocaleDateString();
                                                        })()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {history.notes.length === 0 && <p className="text-xs text-slate-400 italic bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">No clinical notes recorded yet.</p>}
                                        </div>
                                    </section>

                                    {/* Prescriptions Section */}
                                    <section className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                            <ClipboardList className="w-4 h-4 text-emerald-500" />
                                            Prescription History
                                        </h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            {history.prescriptions?.map(p => {
                                                let meds = [];
                                                try {
                                                    meds = typeof p.medicines === 'string' ? JSON.parse(p.medicines) : p.medicines;
                                                } catch (e) {
                                                    meds = [];
                                                }
                                                return (
                                                    <div key={p.id} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
                                                        <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-700/50">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600"><Thermometer className="w-4 h-4" /></div>
                                                                <h5 className="text-sm font-bold text-slate-900 dark:text-white">Diagnosis: {p.diagnosis || 'N/A'}</h5>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(p.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {Array.isArray(meds) && meds?.map((m, i) => (
                                                                <div key={i} className="text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                                                                    <div className="font-bold text-slate-900 dark:text-white">{m.name}</div>
                                                                    <div className="text-slate-500">{m.dosage} - {m.frequency}</div>
                                                                    {m.instructions && <div className="text-[10px] text-primary-600 dark:text-primary-400 italic mt-1">Note: {m.instructions}</div>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {p.tests && (
                                                            <div className="pt-2">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Recommended Tests</p>
                                                                <p className="text-xs text-slate-600 dark:text-slate-300">{p.tests}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {history.prescriptions.length === 0 && <div className="text-xs text-slate-400 italic bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">No prescriptions issued yet.</div>}
                                        </div>
                                    </section>

                                    {/* Reports Section */}
                                    <section className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-indigo-500" />
                                            Lab Reports
                                        </h4>
                                        <div className="space-y-3">
                                            {history.reports?.map(r => (
                                                <div key={r.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                                    <div>
                                                        <h5 className="text-sm font-bold text-slate-900 dark:text-white">{r.report_type}</h5>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(r.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                    <a href={r.report_file} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary-600 hover:underline">Download</a>
                                                </div>
                                            ))}
                                            {history.reports.length === 0 && <p className="text-xs text-slate-400 italic bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">No lab reports uploaded yet.</p>}
                                        </div>
                                    </section>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
