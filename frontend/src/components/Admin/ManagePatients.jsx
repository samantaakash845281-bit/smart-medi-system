import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Search, Edit2, Trash2, Eye, Activity, Loader2, User } from 'lucide-react';
import api from '../../services/api';
import socket from '../../services/socket';
import { usePopup } from '../../context/PopupContext';
import { toast } from 'react-hot-toast';

export default function ManagePatients() {
    const navigate = useNavigate();
    const { searchTerm } = useOutletContext() || {};
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletedItem, setDeletedItem] = useState(null);
    const [undoTimer, setUndoTimer] = useState(null);
    const { openPopup, showUndo } = usePopup();

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/patients');
            if (res.success) {
                setPatients(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch patients", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();

        // Real-time updates
        socket.emit('joinAdminRoom');
        
        socket.on('newUserRegistered', (newUser) => {
            setPatients(prev => [{ ...newUser, status: 'ACTIVE' }, ...prev]);
            toast.success(`New patient registered: ${newUser.fullName}`, {
                icon: '👤',
                duration: 5000
            });
        });

        return () => {
            socket.off('newUserRegistered');
        };
    }, []);

    const handleUndo = (itemToRestore, timerId) => {
        clearTimeout(timerId);
        setPatients(prev => [...prev, itemToRestore]);
        setDeletedItem(null);
        setUndoTimer(null);
    };

    const handleDelete = (id) => {
        openPopup({
            title: 'Delete Patient?',
            message: 'Are you sure you want to delete this patient record? All active history will be removed.',
            confirmText: 'Delete',
            type: 'delete',
            onConfirm: () => {
                const item = patients.find(p => p.id === id);
                setDeletedItem(item);
                
                setPatients(prev => prev.filter(p => p.id !== id));

                const timer = setTimeout(async () => {
                    try {
                        const res = await api.delete(`/admin/patients/${id}`);
                        if (!res.success) throw new Error(res.message);
                    } catch (err) {
                        toast.error(err.message || 'Failed to permanently delete patient');
                        setPatients(prev => [...prev, item]); // Revert on fail
                    } finally {
                        setDeletedItem(null);
                        setUndoTimer(null);
                    }
                }, 5000);
                
                setUndoTimer(timer);

                showUndo('Patient record deleted', () => {
                    console.log("Deleted:", item);
                    handleUndo(item, timer);
                });
            }
        });
    };

    const filteredPatients = patients.filter(patient => {
        const safeSearchTerm = (searchTerm || '').toLowerCase();
        return (patient.fullName && patient.fullName.toLowerCase().includes(safeSearchTerm)) ||
            (patient.id && String(patient.id).includes(safeSearchTerm)) ||
            (patient.phone && patient.phone.includes(safeSearchTerm));
    });

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
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Patient Records</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage and view all registered patients across the hospital.</p>
                </div>
            </div>


            {/* Patients Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest dark:text-slate-400">ID</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest dark:text-slate-400">Name & Status</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest dark:text-slate-400">Contact</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest dark:text-slate-400">Joined On</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest dark:text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 uppercase tracking-tight text-sm">
                            {filteredPatients?.map((patient) => (
                                <tr key={patient.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-primary-600 dark:text-primary-400 font-bold bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded">
                                            #{1000 + patient.id}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div 
                                            onClick={() => navigate(`/admin-dashboard/patients/${patient.id}`)}
                                            className="font-bold text-slate-900 dark:text-white cursor-pointer hover:text-primary-600 transition-colors"
                                        >
                                            {patient.fullName}
                                        </div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold opacity-70 border inline-block px-1 rounded">
                                            {patient.status || 'ACTIVE'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                                        {patient.phone || patient.email}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                                        {patient.created_at ? new Date(patient.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => navigate(`/admin-dashboard/patients/${patient.id}`)}
                                                className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(patient.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Delete Record"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!loading && filteredPatients.length === 0 && (
                        <div className="px-6 py-20 text-center flex flex-col items-center gap-4">
                            <User className="w-12 h-12 text-slate-200" />
                            <p className="text-slate-500 font-bold">No patients registered in the system.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
