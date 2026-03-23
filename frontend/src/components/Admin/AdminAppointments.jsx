import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Calendar, Clock, Filter, CheckCircle2, XCircle, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import api from '../../services/api';
import socket from '../../services/socket';
import { usePopup } from '../../context/PopupContext';
import { toast } from 'react-hot-toast';

export default function AdminAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { searchTerm } = useOutletContext() || {};
    const [statusFilter, setStatusFilter] = useState('All');
    const [deletedItem, setDeletedItem] = useState(null);
    const [undoTimer, setUndoTimer] = useState(null);
    const { openPopup, showUndo } = usePopup();

    const fetchAppointments = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const res = await api.get('/admin/appointments');
            if (res.success) {
                setAppointments(res.data);
            } else {
                setError(res.message || 'Failed to fetch appointments');
            }
        } catch (err) {
            console.error('Error fetching appointments:', err);
            setError(err.message || 'Error fetching data');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments(true);

        const handleUpdate = () => {
            setTimeout(() => fetchAppointments(false), 1000);
        };

        socket.on('newAppointment', handleUpdate);
        socket.on('appointmentBooked', handleUpdate);
        socket.on('newPaymentRequest', handleUpdate);
        socket.on('appointmentUpdated', handleUpdate);
        socket.on('appointmentCancelled', handleUpdate);
        socket.on('paymentCompleted', handleUpdate);

        return () => {
            socket.off('newAppointment', handleUpdate);
            socket.off('appointmentBooked', handleUpdate);
            socket.off('newPaymentRequest', handleUpdate);
            socket.off('appointmentUpdated', handleUpdate);
            socket.off('appointmentCancelled', handleUpdate);
            socket.off('paymentCompleted', handleUpdate);
        };
    }, []);

    const handleUpdateStatus = async (id, status) => {
        try {
            const res = await api.put(`/admin/appointments/${id}/status`, { status });
            if (res.success) {
                fetchAppointments(false);
            }
        } catch (err) {
            alert(err.message || "Failed to update status");
        }
    };

    const handleUndo = (itemToRestore, timerId) => {
        clearTimeout(timerId);
        setAppointments(prev => [...prev, itemToRestore]);
        setDeletedItem(null);
        setUndoTimer(null);
    };

    const handleDelete = (id) => {
        openPopup({
            title: 'Delete Appointment?',
            message: 'Are you sure you want to delete this appointment? This action cannot be undone.',
            confirmText: 'Delete',
            type: 'delete',
            onConfirm: () => {
                const item = appointments.find(a => a.id === id);
                setDeletedItem(item);
                
                setAppointments(prev => prev.filter(a => a.id !== id));

                const timer = setTimeout(async () => {
                    try {
                        const res = await api.delete(`/admin/appointments/${id}`);
                        if (!res.success) throw new Error(res.message);
                    } catch (err) {
                        toast.error(err.message || "Failed to delete appointment");
                        setAppointments(prev => [...prev, item]);
                    } finally {
                        setDeletedItem(null);
                        setUndoTimer(null);
                    }
                }, 5000);
                
                setUndoTimer(timer);

                showUndo('Appointment record deleted', () => {
                    console.log("Deleted:", item);
                    handleUndo(item, timer);
                });
            }
        });
    };

    const filteredAppointments = appointments.filter(apt => {
        const safeSearchTerm = (searchTerm || '').toLowerCase();
        const matchesSearch = (
            (apt.patientName && apt.patientName.toLowerCase().includes(safeSearchTerm)) ||
            (apt.doctorName && apt.doctorName.toLowerCase().includes(safeSearchTerm)) ||
            (apt.id && apt.id.toString().includes(safeSearchTerm))
        );
        const matchesStatus = statusFilter === 'All' || apt.status?.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status) => {
        const s = status?.toLowerCase();
        switch (s) {
            case 'confirmed': return 'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800';
            case 'pending': return 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
            case 'rejected':
            case 'cancelled': return 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
            case 'completed': return 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
            default: return 'bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
        }
    };

    if (loading && appointments.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                <p className="text-slate-500 font-medium">Loading appointments...</p>
            </div>
        );
    }

    if (error && appointments.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
                <AlertCircle className="w-10 h-10 text-red-500" />
                <p className="text-red-500 font-medium">{error}</p>
                <button
                    onClick={() => fetchAppointments(true)}
                    className="text-primary-600 hover:underline font-medium"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">All Appointments</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Monitor and manage appointments globally.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4">

                <div className="flex gap-4">
                    <div className="relative min-w-[160px]">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                        >
                            <option value="All">All Statuses</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest dark:text-slate-400">ID</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest dark:text-slate-400">Patient</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest dark:text-slate-400">Doctor & Dept</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest dark:text-slate-400">Date & Time</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest dark:text-slate-400">Status</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest dark:text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 uppercase tracking-tight text-sm">
                            {filteredAppointments?.map((apt) => (
                                <tr key={apt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-primary-600 dark:text-primary-400 font-bold bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded">#{apt.id}</span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                        {apt.patientName}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900 dark:text-white">{apt.doctorName}</div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold opacity-70 uppercase tracking-widest">{apt.department}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900 dark:text-white">
                                            {(() => {
                                                const d = new Date(apt.appointment_date);
                                                if (isNaN(d.getTime())) return "N/A";
                                                return d < new Date().setHours(0,0,0,0) ? "Expired" : d.toLocaleDateString();
                                            })()}
                                        </div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold opacity-70">
                                            {apt.appointment_time}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(apt.status)}`}>
                                            {apt.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {apt.status?.toLowerCase() === 'pending' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                                                    className="p-1.5 text-primary-600 hover:bg-primary-50 dark:text-primary-500 dark:hover:bg-primary-900/30 rounded transition-colors" title="Confirm"
                                                >
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </button>
                                            )}
                                            {['pending', 'confirmed'].includes(apt.status?.toLowerCase()) && (
                                                <button
                                                    onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-900/30 rounded transition-colors" title="Cancel"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(apt.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors" title="Delete"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredAppointments.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 font-bold">
                                        No appointments found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
