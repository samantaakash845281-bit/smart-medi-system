import React, { useState, useRef } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import Chatbot from '../components/common/Chatbot';
import api from '../services/api';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const successRef = useRef(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const res = await api.post("/contact", formData);

            if (res.success) {
                setSuccess(true);
                setFormData({ name: '', email: '', message: '' });

                // Auto-scroll to success message
                setTimeout(() => {
                    successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);

                // Hide success message after 3 seconds
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError(data.message || 'Something went wrong');
            }
        } catch (err) {
            console.error(err);
            setError('Backend not running or wrong API URL');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-20 pb-20 transition-colors">
            <div className="bg-primary-900 py-16 text-center text-white mb-16">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Contact Us</h1>
                    <p className="text-xl text-primary-200 max-w-2xl mx-auto">
                        Have questions? We're here to help. Reach out to our team.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-3 gap-12">

                    {/* Contact Details */}
                    <div className="lg:col-span-1 space-y-8 mb-12 lg:mb-0">
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 dark:border-slate-700">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Get in Touch</h3>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-xl text-primary-600 dark:text-primary-400 shrink-0">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white">Phone</h4>
                                        <p className="text-slate-500 dark:text-slate-400 mt-1">Mon-Fri from 8am to 8pm.</p>
                                        <p className="text-primary-600 font-medium mt-1">+1 (555) 123-4567</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-xl text-primary-600 dark:text-primary-400 shrink-0">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white">Email</h4>
                                        <p className="text-slate-500 dark:text-slate-400 mt-1">Our friendly team is here to help.</p>
                                        <p className="text-primary-600 font-medium mt-1">support@smartmedi.com</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-xl text-primary-600 dark:text-primary-400 shrink-0">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white">Location</h4>
                                        <p className="text-slate-500 dark:text-slate-400 mt-1">Come say hello at our hospital HQ.</p>
                                        <p className="font-medium text-slate-700 dark:text-slate-300 mt-1">123 Medical Center Blvd<br />Healthcare City, HC 12345</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 dark:border-slate-700">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Send us a message</h3>

                            <div ref={successRef}>
                                {success && (
                                    <div className="mb-6 p-4 bg-primary-50 text-primary-700 border border-primary-200 rounded-xl dark:bg-primary-900/30 dark:border-primary-800 dark:text-primary-400 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="bg-primary-500 text-white p-1 rounded-full">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold">Message Sent Successfully!</span>
                                    </div>
                                )}

                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                        <span className="font-bold">{error}</span>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                                    <input
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        type="email"
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                        placeholder="you@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Message</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows={5}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                        placeholder="How can we help you?"
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-primary-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>Send Message <Send className="w-4 h-4" /></>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
            <Chatbot />
        </div>
    );
}
