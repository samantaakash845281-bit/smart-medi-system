import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CreditCard, DollarSign, Search, Calendar, ChevronDown, CheckCircle, XCircle, Download, Activity, Eye, Image as ImageIcon } from 'lucide-react';
import api, { BACKEND_URL } from '../../services/api';
import socket from '../../services/socket';

export default function AdminPaymentManagement() {
    const { searchTerm } = useOutletContext() || {};
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');

    const [selectedProof, setSelectedProof] = useState(null);

    const fetchTransactions = async () => {
        try {
            const response = await api.get('/payments/all');
            if (response.success) {
                setPayments(response.data);
            } else {
                setError('Failed to fetch transactions');
            }
        } catch (err) {
            setError(err.message || 'Error communicating with server');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();

        const handleUpdate = () => {
            console.log('Admin Payments real-time update');
            setTimeout(() => fetchTransactions(), 1000);
        };

        socket.on('paymentCompleted', handleUpdate);
        socket.on('paymentStatusUpdated', handleUpdate);
        socket.on('newManualPayment', handleUpdate);

        return () => {
            socket.off('paymentCompleted', handleUpdate);
            socket.off('paymentStatusUpdated', handleUpdate);
            socket.off('newManualPayment', handleUpdate);
        };
    }, []);

    const updatePaymentStatus = async (id, newStatus) => {
        try {
            const response = await api.put(`/payments/update-status/${id}`, { status: newStatus });
            if (response.success) {
                setPayments(payments?.map(p => p.id === id ? { ...p, payment_status: newStatus } : p));
            } else {
                alert(response.message || `Failed to mark as ${newStatus}`);
            }
        } catch (err) {
            alert(err.message || 'Error updating status');
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/reports/admin/financial', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `financial-report-${Date.now()}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export failed:", err);
            alert("Failed to export financial report");
        }
    };

    // Filter Logic
    const filteredPayments = payments.filter(p => {
        const safeSearchTerm = (searchTerm || '').toLowerCase();
        const matchesSearch = p.patientName?.toLowerCase().includes(safeSearchTerm) ||
            p.doctorName?.toLowerCase().includes(safeSearchTerm) ||
            p.transaction_id?.toLowerCase().includes(safeSearchTerm);

        const matchesStatus = statusFilter === 'All Status' || p.payment_status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const totalRevenue = payments.reduce((sum, p) =>
        (p.payment_status?.toLowerCase() === 'paid' || p.payment_status?.toLowerCase() === 'verified') ? sum + parseFloat(p.amount) : sum, 0
    );

    const pendingReview = payments.filter(p => 
        p.payment_status?.toLowerCase() === 'pending' || p.payment_status?.toLowerCase() === 'paid'
    ).length;

    const todayTransactions = payments.filter(p => 
        new Date(p.payment_date).toDateString() === new Date().toDateString()
    ).length;

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-96 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p className="text-slate-500 font-medium animate-pulse">Fetching financial records...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up pb-10">
            {/* Proof Modal */}
            {selectedProof && (
                <div className="fixed inset-0 bg-slate-900/90 z-[60] flex items-center justify-center p-4 backdrop-blur-md transition-all duration-300">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-scale-in">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-primary-600" />
                                Payment Proof Verification
                            </h3>
                            <button onClick={() => setSelectedProof(null)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors group">
                                <XCircle className="w-6 h-6 text-slate-400 group-hover:text-red-500" />
                            </button>
                        </div>
                        <div className="p-6 overflow-auto max-h-[70vh] flex justify-center bg-slate-200/50 dark:bg-slate-950/50">
                            <img
                                src={selectedProof.startsWith('http') ? selectedProof : `${BACKEND_URL}${selectedProof}`}
                                alt="Payment Proof"
                                className="max-w-full h-auto rounded-xl shadow-2xl border-4 border-white dark:border-slate-700 transform hover:scale-[1.02] transition-transform duration-300"
                                onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Proof+Not+Found'; }}
                            />
                        </div>
                        <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedProof(null)}
                                className="px-8 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg active:scale-95"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header & Stats */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Payment Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Audit transactions, verify payments, and manage refunds globally.</p>
                </div>
                <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-200 dark:shadow-none transition-all active:scale-95"
                >
                    <Download className="w-4 h-4" /> Export Financial Report
                </button>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm border border-red-100 dark:border-red-900/30 flex items-center gap-3">
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 dark:bg-primary-900/10 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl text-primary-600 dark:text-primary-400 w-fit relative z-10">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div className="mt-4 relative z-10">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Revenue</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 italic">₹{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/10 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400 w-fit relative z-10">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div className="mt-4 relative z-10">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Today's Revenue</p>
                        <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 italic">
                            ₹{payments.reduce((sum, p) => 
                                ((p.payment_status?.toLowerCase() === 'paid' || p.payment_status?.toLowerCase() === 'verified') && 
                                 new Date(p.payment_date || p.created_at).toDateString() === new Date().toDateString()) 
                                ? sum + parseFloat(p.amount) : sum, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 dark:bg-amber-900/10 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400 w-fit relative z-10">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div className="mt-4 relative z-10">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pending Verification</p>
                        <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 italic">{pendingReview}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 w-fit relative z-10">
                        <CreditCard className="w-6 h-6" />
                    </div>
                    <div className="mt-4 relative z-10">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Today's Transactions</p>
                        <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 italic">{todayTransactions}</h3>
                    </div>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                </div>

                <div className="relative md:w-48 flex-shrink-0">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full pl-4 pr-8 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white appearance-none transition-colors"
                    >
                        <option>All Status</option>
                        <option>pending</option>
                        <option>Paid</option>
                        <option>Verified</option>
                        <option>Rejected</option>
                        <option>expired</option>
                        <option>Failed</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Transaction ID</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Date</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Parties</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Amount</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700/50 uppercase tracking-tight">
                            {filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full">
                                                <Search className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 font-bold">No transactions found matching your criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments?.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className="text-xs font-mono font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2.5 py-1 rounded-lg border border-primary-100 dark:border-primary-800">
                                                {payment.transaction_id || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                                            <div className="font-bold">{new Date(payment.payment_date).toLocaleDateString()}</div>
                                            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 mt-0.5">{new Date(payment.payment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm">
                                            <div className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">P: {payment.patientName}</div>
                                            <div className="text-slate-500 text-[10px] font-bold mt-0.5 opacity-70 italic">D: {payment.doctorName}</div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm">
                                            <div className="font-black text-slate-900 dark:text-white text-base">₹{parseFloat(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                            <div className="text-[10px] font-black text-primary-500 dark:text-primary-400 uppercase tracking-widest">{payment.payment_method}</div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                                                payment.payment_status?.toLowerCase() === 'paid' ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30' :
                                                payment.payment_status?.toLowerCase() === 'verified' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30' :
                                                payment.payment_status?.toLowerCase() === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                                                payment.payment_status?.toLowerCase() === 'rejected' || payment.payment_status?.toLowerCase() === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                                {payment.payment_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                {payment.proof_url && (
                                                    <button
                                                        onClick={() => setSelectedProof(payment.proof_url)}
                                                        className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 p-2 rounded-xl transition-all shadow-sm active:scale-90" title="View Proof"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {(payment.payment_status?.toLowerCase() === 'pending' || payment.payment_status?.toLowerCase() === 'paid') && (
                                                    <button
                                                        onClick={() => updatePaymentStatus(payment.id, 'Verified')}
                                                        className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 p-2 rounded-xl transition-all shadow-sm active:scale-90" title="Verify & Confirm"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {payment.payment_status?.toLowerCase() === 'pending' && (
                                                    <button
                                                        onClick={() => updatePaymentStatus(payment.id, 'Rejected')}
                                                        className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 p-2 rounded-xl transition-all shadow-sm active:scale-90" title="Reject Payment"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {payment.receipt_url && (
                                                    <a
                                                        href={`${BACKEND_URL}${payment.receipt_url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 p-2 rounded-xl transition-all shadow-sm active:scale-90" title="Download Receipt"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
