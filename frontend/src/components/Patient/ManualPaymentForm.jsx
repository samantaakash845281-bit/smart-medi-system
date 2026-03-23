import React, { useState } from 'react';
import { Smartphone, Landmark, Upload, CheckCircle, ChevronRight, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const ManualPaymentForm = ({ method, amount, appointmentId, onSuccess, onCancel }) => {
    const [transactionId, setTransactionId] = useState('');
    const [proof, setProof] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('appointment_id', appointmentId);
        formData.append('method', method);
        formData.append('transaction_id', transactionId);
        formData.append('amount', amount);
        if (proof) formData.append('proof', proof);

        try {
            const res = await api.post('/payments/submit-manual', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.success) {
                setSubmitted(true);
                setTimeout(onSuccess, 2000);
            }
        } catch (err) {
            alert('Failed to submit payment proof');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
            >
                <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-primary-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Proof Submitted!</h3>
                <p className="text-slate-500 font-medium">Wait for admin approval. Your appointment will be confirmed soon.</p>
            </motion.div>
        );
    }

    return (
        <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="space-y-8"
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Payment Info Section */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-700/50 pb-4">
                        <h4 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                            {method === 'UPI' ? <Smartphone className="w-5 h-5 text-blue-600" /> : <Landmark className="w-5 h-5 text-indigo-600" />}
                            {method === 'UPI' ? 'Pay via UPI' : 'Transfer Details'}
                        </h4>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Instructions</span>
                    </div>

                    {method === 'UPI' ? (
                        <div className="space-y-6 text-center lg:text-left">
                            <div className="flex flex-col items-center lg:items-start gap-4">
                                <div className="relative p-3 bg-white rounded-2xl border-4 border-slate-50 shadow-inner group">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=demo-payment-link-disabled`}
                                        alt="UPI QR Code"
                                        className="w-32 h-32"
                                    />
                                    <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-xl shadow-lg border-2 border-white">
                                        <Smartphone className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="space-y-2 w-full">
                                    <div className="flex justify-between items-center text-sm p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">UPI ID</span>
                                        <span className="font-mono font-black text-slate-900 dark:text-white">smartmedi@okaxis</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Payee</span>
                                        <span className="font-bold text-slate-600 dark:text-slate-300">Smart Medi Systems</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">
                                Scan QR code or copy UPI ID to pay. Save screenshot after payment.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {[
                                { label: 'Bank Name', value: 'HDFC Bank Ltd' },
                                { label: 'A/C Holder', value: 'Smart Medi Systems' },
                                { label: 'Account No', value: '50100234567890', isMono: true },
                                { label: 'IFSC Code', value: 'HDFC0001234', isMono: true }
                            ]?.map((row, i) => (
                                <div key={i} className="flex justify-between items-center text-sm p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">{row.label}</span>
                                    <span className={`font-bold ${row.isMono ? 'font-mono' : ''} text-slate-900 dark:text-white`}>{row.value}</span>
                                </div>
                            ))}
                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic pt-2">
                                Transfer exact amount and complete the form with UTR.
                            </p>
                        </div>
                    )}
                </div>

                {/* Form Inputs Section */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Transaction Identity</label>
                        <input
                            type="text"
                            required
                            className="w-full px-5 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-slate-800 dark:text-white placeholder:text-slate-300 transition-all"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="Enter 12 digit UTR / Ref No."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Payment Proof (Screenshot)</label>
                        <div className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer group ${proof ? 'border-primary-500 bg-primary-50/10' : 'border-slate-200 dark:border-slate-700 hover:border-primary-400'}`}>
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                onChange={(e) => setProof(e.target.files[0])}
                                accept="image/*"
                            />
                            <div className="flex flex-col items-center gap-2">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-1 group-hover:scale-110 transition-transform ${proof ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                    {proof ? <CheckCircle className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                                </div>
                                <p className={`text-sm font-bold ${proof ? 'text-primary-600' : 'text-slate-500 group-hover:text-slate-700'}`}>
                                    {proof ? 'File Selected' : 'Upload Receipt'}
                                </p>
                                <p className="text-xs text-slate-400 font-medium">{proof ? proof.name : 'JPEG, PNG supported'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <motion.button
                    whileHover={{ x: -5 }}
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all flex items-center justify-center gap-2"
                >
                    <X className="w-4 h-4" /> Cancel
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading || !transactionId || !proof}
                    className="flex-[2] py-4 bg-primary-600 text-white rounded-2xl font-black hover:bg-primary-700 shadow-xl shadow-primary-500/20 transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
                >
                    {loading ? 'Submitting...' : 'Submit Payment Proof'}
                    {!loading && <ChevronRight className="w-5 h-5" />}
                </motion.button>
            </div>
        </motion.form>
    );
};

export default ManualPaymentForm;
