import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, Calendar, ArrowRight, Activity, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function CompleteProfile() {
    const navigate = useNavigate();
    const location = useLocation();
    const { updateUser } = useContext(AuthContext);
    const { email, fullName: initialName, googleId, phone: initialPhone, flow, password } = location.state || {};

    const [formData, setFormData] = useState({
        fullName: initialName || '',
        phone: initialPhone || '',
        age: '',
        gender: 'Male'
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!email) {
            toast.error("Session expired. Please try again.");
            navigate('/login');
        }
    }, [email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.fullName || !formData.phone || !formData.age || !formData.gender) {
            toast.error("All fields are required");
            return;
        }

        if (formData.phone.length !== 10) {
            toast.error("Phone number must be 10 digits");
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/auth/register-user', {
                email,
                fullName: formData.fullName,
                phone: formData.phone,
                age: formData.age,
                gender: formData.gender,
                googleId,
                password
            });

            if (response.success) {
                toast.success("Welcome aboard! Your profile is ready.");
                
                const userData = {
                    id: response.user?.id || response.data?.user?.id,
                    ...response.user,
                    role: 'patient'
                };

                // Update Context
                updateUser(userData);

                // Update Session Storage (Strict Tab Isolation)
                sessionStorage.setItem("user", JSON.stringify(userData));
                if (response.token) {
                    sessionStorage.setItem("token", response.token);
                    sessionStorage.setItem("role", 'patient');
                }

                navigate('/patient-dashboard');
            } else {
                toast.error(response.message || "Registration failed");
            }
        } catch (err) {
            toast.error(err.message || "Error finalizing registration");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl w-full bg-white rounded-[2rem] shadow-2xl p-8 border border-slate-100"
            >
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-md">
                        <Activity className="w-10 h-10 text-teal-600" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Complete Your Profile</h1>
                    <p className="text-slate-500 mt-2">Just a few more details to get you started</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Full Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="tel"
                                    maxLength="10"
                                    placeholder="9876543210"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Age */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Age</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="number"
                                    min="1"
                                    max="120"
                                    placeholder="25"
                                    value={formData.age}
                                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Gender */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Gender</label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                required
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                            Finish Registration
                        </button>
                    </div>
                </form>

                <p className="mt-8 text-center text-slate-400 text-sm">
                    Protected by SmartMedi Security &reg;
                </p>
            </motion.div>
        </div>
    );
}
