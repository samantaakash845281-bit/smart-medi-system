import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download, Calendar, Search, CreditCard, DollarSign, Clock, ChevronDown, Smartphone, CheckCircle, XCircle } from 'lucide-react';
import api, { BACKEND_URL } from '../../services/api';
import socket from '../../services/socket';
import toast from 'react-hot-toast';

export default function DoctorEarnings() {
    const { searchTerm } = useOutletContext() || {};
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [dateFilter, setDateFilter] = useState('All Time');

    useEffect(() => {
        const fetchEarnings = async () => {
            try {
                const response = await api.get('/payments/doctor');
                if (response.success) {
                    setPayments(response.data);
                } else {
                    setError('Failed to fetch earnings');
                }
            } catch (err) {
                setError(err.message || 'Error communicating with server');
            } finally {
                setLoading(false);
            }
        };

        fetchEarnings();

        const handleUpdate = () => {
            console.log('Doctor Earnings real-time update');
            fetchEarnings();
        };

        socket.on('appointmentCancelled', handleUpdate);

        return () => {
            socket.off('paymentCompleted', handleUpdate);
            socket.off('paymentStatusUpdated', handleUpdate);
            socket.off('appointmentCancelled', handleUpdate);
        };
    }, []);

    // Filter Logic
    const filteredPayments = payments.filter(p => {
        const safeSearchTerm = (searchTerm || '').toLowerCase();
        const matchesSearch = p.patientName?.toLowerCase().includes(safeSearchTerm) ||
            p.transaction_id?.toLowerCase().includes(safeSearchTerm);

        let matchesDate = true;
        const pDate = new Date(p.payment_date);
        const today = new Date();

        if (dateFilter === 'This Month') {
            matchesDate = pDate.getMonth() === today.getMonth() && pDate.getFullYear() === today.getFullYear();
        } else if (dateFilter === 'This Year') {
            matchesDate = pDate.getFullYear() === today.getFullYear();
        }

        return matchesSearch && matchesDate;
    });

    const totalEarnings = payments.reduce((sum, p) => {
        const status = p.payment_status?.toLowerCase();
        return (status === 'paid' || status === 'verified') ? sum + parseFloat(p.amount || 0) : sum;
    }, 0);

    const pendingEarnings = payments.reduce((sum, p) =>
        p.payment_status?.toLowerCase() === 'pending' ? sum + parseFloat(p.amount || 0) : sum, 0
    );

    const handleDownload = async (payment) => {
        try {
            // Use toast to show loading if you have it, or just proceed
            const response = await api.get(`/payments/receipt/${payment.id}`, {
                responseType: 'blob'
            });

            // Create a link and trigger download
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `receipt-${payment.transaction_id || payment.id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed:", err);
            toast.error("Failed to download receipt");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header & Stats */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Earnings & Payments</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track your consultation revenue and patient payment histories.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-200">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                    <div className="p-4 bg-primary-50 dark:bg-primary-900/30 rounded-xl text-primary-600 dark:text-primary-400">
                        <DollarSign className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Earnings</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">${totalEarnings.toFixed(2)}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-xl text-orange-600 dark:text-orange-400">
                        <Clock className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Funds</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">${pendingEarnings.toFixed(2)}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                    <div className="p-4 bg-primary-50 dark:bg-primary-900/30 rounded-xl text-primary-600 dark:text-primary-400">
                        <CreditCard className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Transactions</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{payments.length}</h3>
                    </div>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                </div>

                <div className="relative md:w-48">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white appearance-none transition-colors"
                    >
                        <option>All Time</option>
                        <option>This Month</option>
                        <option>This Year</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Transaction ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Patient Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Method</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                        No transactions found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments?.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600 dark:text-slate-300">
                                            {payment.transaction_id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                                            {new Date(payment.payment_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white font-medium">
                                            {payment.patientName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">
                                            ${parseFloat(payment.amount).toFixed(2)}
                                        </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                                            {payment.payment_method || 'UPI'}
                                        </td>
                                         <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${payment.payment_status?.toLowerCase() === 'paid' ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400' :
                                                payment.payment_status?.toLowerCase() === 'verified' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    payment.payment_status?.toLowerCase() === 'failed' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400' :
                                                        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                                                }`}>
                                                {payment.payment_status}
                                            </span>
                                        </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={() => handleDownload(payment)}
                                                className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors" 
                                                title="Download Receipt"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
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
