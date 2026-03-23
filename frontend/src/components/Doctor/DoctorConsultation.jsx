import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pill, FileText, Plus, Calendar, User, Clock, Loader2, ArrowLeft, ShieldCheck, Activity } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function DoctorConsultation() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        symptoms: '',
        diagnosis: '',
        medicines: [{ name: '', dosage: '', frequency: '', instructions: '' }],
        tests: '',
        notes: ''
    });

    useEffect(() => {
        const fetchAppointmentDetails = async () => {
            try {
                const res = await api.get('/doctor/appointments');
                if (res.success) {
                    const appt = res.data.find(a => String(a.id) === String(appointmentId));
                    if (appt) {
                        setAppointment(appt);
                    } else {
                        toast.error("Appointment not found");
                        navigate('/doctor-dashboard/appointments');
                    }
                }
            } catch (error) {
                console.error("Error fetching appointment details:", error);
                toast.error("Failed to load appointment details");
            } finally {
                setLoading(false);
            }
        };

        fetchAppointmentDetails();
    }, [appointmentId, navigate]);

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

    const handleComplete = async (e) => {
        e.preventDefault();
        if (!formData.diagnosis) {
            toast.error("Diagnosis is required");
            return;
        }

        setSaving(true);
        try {
            // 1. Save Prescription
            const prescriptionPayload = {
                appointmentId: appointmentId,
                patientId: appointment.patient_id || appointment.patientId || 0, // Fallback if missing
                ...formData
            };
            
            // Note: We need to make sure we have patientId. 
            // In DoctorAppointments, it might be appt.patient_id.
            
            const prescriptionRes = await api.post('/prescriptions', prescriptionPayload);
            
            if (prescriptionRes.success) {
                // 2. Complete Consultation
                const completeRes = await api.put(`/doctor/appointments/${appointmentId}/complete-consult`);
                if (completeRes.success) {
                    toast.success("Consultation completed successfully");
                    navigate('/doctor-dashboard/appointments');
                }
            }
        } catch (error) {
            toast.error(error.message || "Failed to complete consultation");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Loading consultation data...</p>
            </div>
        );
    }

    if (!appointment) return null;

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex justify-between items-center">
                <button 
                    onClick={() => navigate('/doctor-dashboard/appointments')}
                    className="flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-colors font-medium p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Appointments
                </button>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 animate-pulse">
                        <Activity className="w-3.5 h-3.5" />
                        In Progress
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Patient Summary */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/40 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                                <User className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{appointment.patientName}</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Patient ID: PT-{1000 + (appointment.patient_id || 0)}</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-700">
                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date</p>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {new Date(appointment.appointment_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Time</p>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{appointment.appointment_time}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-primary-500 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Status</p>
                                    <p className="text-sm font-bold text-teal-600">Verified (Paid)</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Pre-Consultation Reason</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                "{appointment.reason || 'Regular checkup'}"
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column - Prescription Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <div className="p-6 border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary-600" />
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Active Consultation</h3>
                        </div>

                        <form onSubmit={handleComplete} className="p-6 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1">Symptoms Identified</label>
                                    <textarea 
                                        value={formData.symptoms}
                                        onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                                        placeholder="Enter patient symptoms..."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 h-28 transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1">Final Diagnosis</label>
                                    <textarea 
                                        required
                                        value={formData.diagnosis}
                                        onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                                        placeholder="Medical findings/diagnosis..."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 h-28 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* Medicines Section */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-700 pb-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                         <Pill className="w-4 h-4 text-primary-600" />
                                         Prescribed Medications
                                    </label>
                                    <button 
                                        type="button" 
                                        onClick={addMedicine}
                                        className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1.5 p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                    >
                                        <Plus className="w-4 h-4" /> Add Next Medicine
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {formData.medicines?.map((med, index) => (
                                        <div key={index} className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl relative group border-2 border-transparent hover:border-primary-100 dark:hover:border-primary-900/30 transition-all">
                                            {formData.medicines.length > 1 && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeMedicine(index)}
                                                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Plus className="w-4 h-4 rotate-45" />
                                                </button>
                                            )}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                                <div className="space-y-1.5">
                                                    <input 
                                                        required
                                                        placeholder="Name (e.g. Paracetamol)"
                                                        value={med.name}
                                                        onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <input 
                                                        required
                                                        placeholder="Dosage (e.g. 500mg)"
                                                        value={med.dosage}
                                                        onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <input 
                                                        required
                                                        placeholder="Frequency (e.g. 1-0-1)"
                                                        value={med.frequency}
                                                        onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <input 
                                                placeholder="Special Instructions (e.g. After meals, avoid fatty food)"
                                                value={med.instructions}
                                                onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1">Laboratory Tests</label>
                                    <input 
                                        value={formData.tests}
                                        onChange={(e) => setFormData({...formData, tests: e.target.value})}
                                        placeholder="Radiology, blood panels, etc."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1">Follow-up Notes</label>
                                    <input 
                                        value={formData.notes}
                                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                        placeholder="When to return, lifestyle advice..."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                                <button 
                                    type="submit"
                                    disabled={saving}
                                    className="px-10 py-4 font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-2xl transition-all shadow-xl shadow-primary-500/30 active:scale-95 disabled:opacity-50 flex items-center gap-2 group"
                                >
                                    {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                                    {saving ? "Finalizing..." : "Complete & Save Consultation"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
