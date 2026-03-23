import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { User, Lock, Save, Loader2, CheckCircle2 } from 'lucide-react';

export default function AdminSettings() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/admin/settings');
                if (res.success) {
                    setFormData(prev => ({
                        ...prev,
                        fullName: res.data.fullName,
                        email: res.data.email
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch settings", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            alert("New passwords do not match!");
            return;
        }

        setSubmitting(true);
        setMessage(null);
        try {
            const res = await api.put('/admin/settings', formData);
            if (res.success) {
                setMessage({ type: 'success', text: 'Settings updated successfully!' });
                setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Failed to update settings' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                <p className="text-slate-500 font-medium">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-6 animate-fade-in-up uppercase tracking-tight">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Account Settings</h1>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 font-bold border ${message.type === 'success' ? 'bg-primary-50 text-primary-700 border-primary-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Section */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-6">
                        <User className="w-6 h-6 text-primary-600" />
                        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Administrator Profile</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                            <input
                                name="fullName"
                                required
                                value={formData.fullName}
                                onChange={handleChange}
                                type="text"
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-bold dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Email Address</label>
                            <input
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                type="email"
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-bold dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Password Section */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-6">
                        <Lock className="w-6 h-6 text-indigo-600" />
                        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Security & Password</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Current Password (Required for any changes)</label>
                            <input
                                name="currentPassword"
                                required
                                value={formData.currentPassword}
                                onChange={handleChange}
                                type="password"
                                placeholder="••••••••"
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-bold dark:text-white"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">New Password (Leave blank to keep current)</label>
                                <input
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-bold dark:text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Confirm New Password</label>
                                <input
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-bold dark:text-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        disabled={submitting}
                        type="submit"
                        className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary-500/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}
