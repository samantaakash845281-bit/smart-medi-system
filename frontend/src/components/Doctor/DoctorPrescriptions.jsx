import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Pill, FileText, Plus, Search, Calendar, Download, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function DoctorPrescriptions() {
    const { searchTerm } = useOutletContext() || {};
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        patientId: '',
        appointmentId: '',
        symptoms: '',
        diagnosis: '',
        medicines: [{ name: '', dosage: '', frequency: '', instructions: '' }],
        tests: '',
        notes: ''
    });

    const [prescriptions, setPrescriptions] = useState([]);

    const fetchPrescriptions = async () => {
        try {
            const res = await api.get('/prescriptions');
            if (res.success) setPrescriptions(res.data);
        } catch (error) {
            console.error("Error fetching prescriptions", error);
        }
    };

    const fetchPatients = async () => {
        try {
            const res = await api.get('/doctor/patients');
            if (res.success) setPatients(res.data);
        } catch (error) {
            console.error("Error fetching patients", error);
        }
    };

    const fetchAppointments = async (patientId) => {
        try {
            const res = await api.get('/doctor/appointments');
            if (res.success) {
                // Filter for confirmed appointments of this patient that don't have prescriptions yet
                const patientAppts = res.data.filter(a => 
                    String(a.patient_id) === String(patientId) && 
                    (a.status === 'confirmed' || a.status === 'completed')
                );
                setAppointments(patientAppts);
            }
        } catch (error) {
            console.error("Error fetching appointments", error);
        }
    };

    useEffect(() => {
        fetchPrescriptions();
        fetchPatients();
    }, []);

    const handlePatientChange = (e) => {
        const pId = e.target.value;
        setFormData({ ...formData, patientId: pId, appointmentId: '' });
        if (pId) fetchAppointments(pId);
    };

    const addMedicine = () => {
        setFormData({
            ...formData,
            medicines: [...formData.medicines, { name: '', dosage: '', frequency: '', instructions: '' }]
        });
    };

    const removeMedicine = (index) => {
        const newMeds = formData.medicines.filter((_, i) => i !== index);
        setFormData({ ...formData, medicines: newMeds });
    };

    const handleMedicineChange = (index, field, value) => {
        const newMeds = [...formData.medicines];
        newMeds[index][field] = value;
        setFormData({ ...formData, medicines: newMeds });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/prescriptions', formData);
            if (res.success) {
                toast.success("Prescription saved successfully");
                setIsModalOpen(false);
                fetchPrescriptions();
                setFormData({
                    patientId: '',
                    appointmentId: '',
                    symptoms: '',
                    diagnosis: '',
                    medicines: [{ name: '', dosage: '', frequency: '', instructions: '' }],
                    tests: '',
                    notes: ''
                });
            }
        } catch (error) {
            toast.error(error.message || "Failed to save prescription");
        } finally {
            setLoading(false);
        }
    };

    const safeSearchTerm = (searchTerm || '').toLowerCase();

    const filteredPrescriptions = (prescriptions || []).filter(rx =>
        (rx.patientName || '').toLowerCase().includes(safeSearchTerm) ||
        String(rx.id).toLowerCase().includes(safeSearchTerm) ||
        (rx.diagnosis || '').toLowerCase().includes(safeSearchTerm)
    );

    return (
        <>
            <div className="space-y-6 animate-fade-in-up pb-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Prescriptions</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Write new prescriptions and manage patient medication history.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-sm shadow-primary-500/30 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Write Prescription
                    </button>
                </div>


                {/* Prescription Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredPrescriptions?.map((rx) => (
                        <div key={rx.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary-50 dark:bg-primary-900/40 p-3 rounded-xl text-primary-600 dark:text-primary-400 shrink-0">
                                        <Pill className="w-6 h-6" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-bold text-slate-900 dark:text-white truncate">{rx.patientName}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">PT-{1000 + rx.patient_id} • <span className="text-primary-600 dark:text-primary-400">#RX-{rx.id}</span></p>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800`}>
                                    Issued
                                </span>
                            </div>

                            <div className="mb-4">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Diagnosis</p>
                                <p className="text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">{rx.diagnosis}</p>
                            </div>

                            <div className="mb-6">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Medications</p>
                                <ul className="space-y-2">
                                    {JSON.parse(rx.medicines || '[]')?.map((med, idx) => (
                                        <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0"></span>
                                            <div>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">{med.name}</span>
                                                <span className="text-xs ml-1">({med.dosage} - {med.frequency})</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(rx.created_at).toLocaleDateString()}
                                </div>
                                <div className="flex gap-2">
                                    <a 
                                        href={`${api.defaults.baseURL.replace('/api', '')}/${rx.pdf_path}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-2 text-slate-400 hover:text-primary-600 bg-slate-50 rounded-lg dark:bg-slate-900/50 dark:hover:bg-slate-700 transition-colors" 
                                        title="View PDF"
                                    >
                                        <FileText className="w-4 h-4" />
                                    </a>
                                    <a 
                                        href={`${api.defaults.baseURL.replace('/api', '')}/${rx.pdf_path}`} 
                                        download 
                                        className="p-2 text-slate-400 hover:text-primary-600 bg-slate-50 rounded-lg dark:bg-slate-900/50 dark:hover:bg-slate-700 transition-colors" 
                                        title="Download PDF"
                                    >
                                        <Download className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {(filteredPrescriptions || []).length === 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-100 dark:border-slate-700 mt-6">
                        <Pill className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No prescriptions found</h3>
                        <p className="text-slate-500 dark:text-slate-400">Try adjusting your search criteria or create a new one.</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-white dark:bg-slate-900 z-[100] overflow-y-auto animate-fade-in">
                    <div className="min-h-screen flex flex-col">
                        {/* Full Screen Header */}
                        <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-6 py-4 flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/40 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                                    <Pill className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">New Prescription</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Fill in the details below to generate a digital prescription.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                            >
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>
                        
                        <div className="flex-1 p-6 md:p-10 bg-slate-50/30 dark:bg-slate-900/20">
                            <div className="max-w-5xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                        
                                <div className="p-6 overflow-y-auto custom-scrollbar">
                                    <form id="prescriptionForm" onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Patient Selection */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Select Patient</label>
                                                <select 
                                                    required
                                                    value={formData.patientId}
                                                    onChange={handlePatientChange}
                                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all"
                                                >
                                                    <option value="">Choose a patient...</option>
                                                    {patients?.map(p => (
                                                        <option key={p.patient_id} value={p.patient_id}>{p.fullName} (PT-{1000 + p.patient_id})</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Appointment Selection */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Select Appointment</label>
                                                <select 
                                                    required
                                                    disabled={!formData.patientId}
                                                    value={formData.appointmentId}
                                                    onChange={(e) => setFormData({...formData, appointmentId: e.target.value})}
                                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all disabled:opacity-50"
                                                >
                                                    <option value="">{formData.patientId ? "Select an appointment..." : "Select patient first"}</option>
                                                    {appointments?.map(a => (
                                                        <option key={a.id} value={a.id}>{new Date(a.appointment_date).toLocaleDateString()} - {a.appointment_time}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Symptoms</label>
                                                <textarea 
                                                    value={formData.symptoms}
                                                    onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                                                    placeholder="Patient symptoms..."
                                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 h-24 transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Diagnosis</label>
                                                <textarea 
                                                    required
                                                    value={formData.diagnosis}
                                                    onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                                                    placeholder="Medical diagnosis..."
                                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 h-24 transition-all"
                                                />
                                            </div>
                                        </div>

                                        {/* Medicines Dynamic List */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Medications</label>
                                                <button 
                                                    type="button" 
                                                    onClick={addMedicine}
                                                    className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                                >
                                                    <Plus className="w-3.5 h-3.5" /> Add Medicine
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {formData.medicines?.map((med, index) => (
                                                    <div key={index} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl relative group border border-slate-100 dark:border-slate-800">
                                                        {formData.medicines.length > 1 && (
                                                            <button 
                                                                type="button" 
                                                                onClick={() => removeMedicine(index)}
                                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                &times;
                                                            </button>
                                                        )}
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                                                            <input 
                                                                required
                                                                placeholder="Medicine Name"
                                                                value={med.name}
                                                                onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                                                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                                            />
                                                            <input 
                                                                required
                                                                placeholder="Dosage (e.g. 500mg)"
                                                                value={med.dosage}
                                                                onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                                                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                                            />
                                                            <input 
                                                                required
                                                                placeholder="Frequency (e.g. 1-0-1)"
                                                                value={med.frequency}
                                                                onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                                                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                                            />
                                                        </div>
                                                        <input 
                                                            placeholder="Special Instructions (Optional)"
                                                            value={med.instructions}
                                                            onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                                                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Recommended Tests</label>
                                                <input 
                                                    value={formData.tests}
                                                    onChange={(e) => setFormData({...formData, tests: e.target.value})}
                                                    placeholder="X-ray, Blood test, etc."
                                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Additional Notes</label>
                                                <input 
                                                    value={formData.notes}
                                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                                    placeholder="Follow up in 2 weeks..."
                                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>
                                    </form>
                                </div>

                                <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 shrink-0">
                                    <button 
                                        type="button"
                                        onClick={() => setIsModalOpen(false)} 
                                        className="px-6 py-2 font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        form="prescriptionForm"
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-2 font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all shadow-lg shadow-primary-500/30 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                                        {loading ? "Saving..." : "Sign & Save Prescription"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

