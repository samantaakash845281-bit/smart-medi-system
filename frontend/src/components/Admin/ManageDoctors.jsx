import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Search, Edit2, Trash2, MoreVertical, CheckCircle2, XCircle, Loader2, Eye } from 'lucide-react';
import { usePopup } from '../../context/PopupContext';
import { toast } from 'react-hot-toast';

export default function ManageDoctors() {
    const navigate = useNavigate();
    const { searchTerm } = useOutletContext() || {};
    const [doctors, setDoctors] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [deletedItem, setDeletedItem] = useState(null);
    const [undoTimer, setUndoTimer] = useState(null);
    const { openPopup, showUndo } = usePopup();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        specialization: 'Cardiology',
        available_days: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
        available_time_slots: '10:00 AM - 05:00 PM'
    });

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/doctors');
            if (res.success) {
                setDoctors(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch doctors", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingDoctor) {
                await api.put(`/admin/doctors/${editingDoctor.id}`, formData);
            } else {
                await api.post('/admin/doctors', formData);
            }
            setIsModalOpen(false);
            setEditingDoctor(null);
            setFormData({
                fullName: '', email: '', password: '',
                specialization: 'Cardiology',
                available_days: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
                available_time_slots: '10:00 AM - 05:00 PM'
            });
            fetchDoctors();
        } catch (error) {
            alert(error.message || "Failed to save doctor");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (doctor) => {
        setEditingDoctor(doctor);
        setFormData({
            fullName: doctor.fullName,
            email: doctor.email,
            password: '', // Don't show password
            specialization: doctor.specialization || 'Cardiology',
            available_days: doctor.available_days || 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            available_time_slots: doctor.available_time_slots || '10:00 AM - 05:00 PM'
        });
        setIsModalOpen(true);
    };

    const handleUndo = (itemToRestore, timerId) => {
        clearTimeout(timerId);
        setDoctors(prev => [...prev, itemToRestore]);
        setDeletedItem(null);
        setUndoTimer(null);
    };

    const handleDelete = (id) => {
        openPopup({
            title: 'Delete Doctor?',
            message: 'Are you sure you want to delete this doctor? All scheduled appointments will be affected.',
            confirmText: 'Delete',
            type: 'delete',
            onConfirm: () => {
                const item = doctors.find(d => d.id === id);
                setDeletedItem(item);
                
                setDoctors(prev => prev.filter(d => d.id !== id));
                
                const timer = setTimeout(async () => {
                    try {
                        const res = await api.delete(`/admin/doctors/${id}`);
                        if (!res.success) throw new Error(res.message);
                    } catch (error) {
                        toast.error(error.message || 'Failed to delete doctor');
                        setDoctors(prev => [...prev, item]);
                    } finally {
                        setDeletedItem(null);
                        setUndoTimer(null);
                    }
                }, 5000);
                
                setUndoTimer(timer);
                
                showUndo('Doctor record deleted', () => {
                    console.log("Deleted:", item);
                    handleUndo(item, timer);
                });
            }
        });
    };

    const filteredDoctors = doctors.filter(doctor => {
        const safeSearchTerm = (searchTerm || '').toLowerCase();
        return (doctor.fullName && doctor.fullName.toLowerCase().includes(safeSearchTerm)) ||
            (doctor.email && doctor.email.toLowerCase().includes(safeSearchTerm)) ||
            (doctor.specialization && doctor.specialization.toLowerCase().includes(safeSearchTerm));
    });

    return (
        <>
            <div className="space-y-6 animate-fade-in-up">
                {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manage Doctors</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">View, add, edit, and remove doctors from the system.</p>
                </div>
                <button
                    onClick={() => navigate('/admin-dashboard/add-doctor')}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-sm shadow-primary-500/30 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Doctor
                </button>
            </div>


            {/* Doctors Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Doctor</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Contact</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Specialization</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Join Date</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-500" />
                                    </td>
                                </tr>
                            ) : filteredDoctors?.map((doctor) => (
                                <tr key={doctor.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
                                                {doctor.fullName ? doctor.fullName.split(' ')?.map(n => n[0]).join('').substring(0, 2) : 'DR'}
                                            </div>
                                            <div 
                                                onClick={() => navigate(`/admin-dashboard/doctors/${doctor.id}`)}
                                                className="font-medium text-slate-900 dark:text-white cursor-pointer hover:text-primary-600 transition-colors"
                                            >
                                                {doctor.fullName}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-600 dark:text-slate-400">{doctor.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-slate-900 dark:text-white">{doctor.specialization}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                        {doctor.created_at ? new Date(doctor.created_at).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => navigate(`/admin-dashboard/doctors/${doctor.id}`)}
                                                className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(doctor)}
                                                className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(doctor.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && filteredDoctors.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        No doctors found matching "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                                    <input
                                        name="fullName"
                                        required
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                                    <input
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        type="email"
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                                    />
                                </div>
                                {!editingDoctor && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                                        <input
                                            name="password"
                                            required
                                            value={formData.password}
                                            onChange={handleChange}
                                            type="password"
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Specialization</label>
                                    <select
                                        name="specialization"
                                        value={formData.specialization}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                                    >
                                        <option value="Cardiology">Cardiology</option>
                                        <option value="Neurology">Neurology</option>
                                        <option value="Pediatrics">Pediatrics</option>
                                        <option value="Orthopedics">Orthopedics</option>
                                        <option value="Dermatology">Dermatology</option>
                                        <option value="General Physician">General Physician</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                    Cancel
                                </button>
                                <button
                                    disabled={submitting}
                                    type="submit"
                                    className="px-4 py-2 font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm shadow-primary-500/30 flex items-center gap-2"
                                >
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingDoctor ? 'Update Doctor' : 'Add Doctor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
