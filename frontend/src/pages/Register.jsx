import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, User, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck, Activity, ArrowLeft, Stethoscope, CheckCircle2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase/firebase";
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        agreed: false
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    

    const navigate = useNavigate();
    const { register, updateUser } = useContext(AuthContext);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        // Special handling for phone to only allow digits and max 10
        if (name === 'phone') {
            const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
            setFormData(prev => ({
                ...prev,
                [name]: digitsOnly
            }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const getPasswordStrength = (pass) => {
        let score = 0;
        if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };

        if (pass.length >= 8) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[a-z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;

        if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500', textClass: 'text-red-500' };
        if (score <= 4) return { score: 2, label: 'Medium', color: 'bg-orange-500', textClass: 'text-orange-500' };
        return { score: 3, label: 'Strong', color: 'bg-teal-500', textClass: 'text-teal-500' };
    };

    const strength = getPasswordStrength(formData.password);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Form Validation
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(formData.phone)) {
            setError("Phone number must be exactly 10 digits");
            return;
        }

        if (strength.score < 3) {
            setError("Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (!formData.agreed) {
            setError("You must agree to the Terms & Conditions");
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/auth/send-verification-otp', {
                email: formData.email,
                phone: formData.phone
            });

            if (response.success) {
                toast.success("Verification code sent to your email!");
                navigate('/verify-otp', { 
                    state: { 
                        ...formData, 
                        flow: 'email' 
                    } 
                });
            } else {
                setError(response.message || 'Registration failed');
            }
        } catch (err) {
            setError(err.message || 'Server error during registration');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
      setIsLoading(true);
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // 1. Check if user exists
        const checkRes = await api.post('/auth/check-user', { email: user.email });
        
        if (checkRes.exists) {
            // Existing user - Login directly
            const loginRes = await api.post('/auth/google', { 
                email: user.email, 
                fullName: user.displayName, 
                googleId: user.uid 
            });

            if (loginRes.success) {
                const { token, role, user: userData } = loginRes;
                sessionStorage.setItem("token", token);
                sessionStorage.setItem("role", role);
                sessionStorage.setItem("user", JSON.stringify(userData));
                updateUser(userData);
                navigate(`/${role}-dashboard`);
            }
        } else {
            // New user - Start OTP flow
            const otpRes = await api.post('/auth/send-verification-otp', { email: user.email });
            if (otpRes.success) {
                toast.success("We've sent an OTP to your email");
                navigate('/verify-otp', { 
                    state: { 
                        email: user.email, 
                        fullName: user.displayName, 
                        googleId: user.uid,
                        flow: 'google'
                    } 
                });
            }
        }
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "Google Login failed");
      }
      setIsLoading(false);
    };



    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">
            {/* Left Side: Branding / Motivation */}
            <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0F766E] to-[#2563EB] p-12 flex flex-col justify-between text-white"
            >
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
                    <div className="absolute top-1/2 -right-24 w-64 h-64 bg-teal-300 rounded-full blur-3xl animate-pulse delay-1000" />
                    <div className="absolute -bottom-24 left-1/4 w-80 h-80 bg-blue-400 rounded-full blur-3xl animate-pulse delay-700" />
                </div>

                <div className="relative z-10">
                    <Link to="/" className="flex items-center gap-3 group">
                        <motion.div 
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-xl"
                        >
                            <HeartPulse className="h-10 w-10 text-white" />
                        </motion.div>
                        <span className="font-black text-4xl tracking-tighter text-white">SmartMedi</span>
                    </Link>
                </div>

                <div className="relative z-10 space-y-8 max-w-lg">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight"
                    >
                        Join the <br />
                        <span className="text-teal-200">Healthcare Revolution.</span>
                    </motion.h1>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="space-y-6"
                    >
                        <p className="text-xl text-white/80 font-medium leading-relaxed">
                            Book appointments, access prescriptions, and track your health records in one secure platform.
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { icon: Stethoscope, text: "Top Specialists" },
                                { icon: Activity, text: "Live Tracking" },
                                { icon: ShieldCheck, text: "Secure Records" },
                                { icon: CheckCircle2, text: "Easy Booking" }
                            ]?.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                    <item.icon className="h-5 w-5 text-teal-300" />
                                    <span className="font-semibold text-sm">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                <div className="relative z-10">
                    <p className="text-white/60 text-sm font-medium">© 2026 SmartMedi Healthcare Systems. All rights reserved.</p>
                </div>
            </motion.div>

            {/* Right Side: Authentication Section */}
            <div className="lg:w-1/2 flex flex-col relative bg-white dark:bg-slate-900 overflow-y-auto">
                {/* Back Button */}
                <Link 
                    to="/"
                    className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-teal-600 font-bold transition-all duration-300 group z-20"
                >
                    <div className="p-2 rounded-full group-hover:bg-teal-50 transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </div>
                    <span>Back to Home</span>
                </Link>

                <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-12 lg:px-20 py-20">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key="registration-form"
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-md"
                    >
                        <div className="mb-8 text-center lg:text-left">
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Create Account</h2>
                            <p className="mt-4 text-slate-500 font-medium text-lg leading-relaxed">
                                Join our community. Already have an account?{' '}
                                <Link to="/login" className="text-teal-600 font-bold hover:text-teal-700 underline underline-offset-4 decoration-teal-600/30">
                                    Login
                                </Link>
                            </p>
                        </div>

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-2xl mb-8 flex items-center gap-3 text-red-700 dark:text-red-400 font-bold"
                            >
                                <ShieldCheck className="h-5 w-5" />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1">Full Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-3.5 left-4 text-slate-400 group-focus-within:text-teal-600 transition-colors">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="text"
                                        name="fullName"
                                        required
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-600 dark:focus:border-teal-500 transition-all duration-300 text-slate-900 dark:text-white font-medium"
                                        placeholder="Enter your full name"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1">Email</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-3.5 left-4 text-slate-400 group-focus-within:text-teal-600 transition-colors">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-600 dark:focus:border-teal-500 transition-all duration-300 text-slate-900 dark:text-white font-medium"
                                            placeholder="you@email.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1">Phone</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-3.5 left-4 text-slate-400 group-focus-within:text-teal-600 transition-colors">
                                            <Phone className="h-5 w-5" />
                                        </div>
                                        <input
                                            type="tel"
                                            name="phone"
                                            required
                                            maxLength="10"
                                            inputMode="numeric"
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-600 dark:focus:border-teal-500 transition-all duration-300 text-slate-900 dark:text-white font-medium"
                                            placeholder="10-digit number"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-3.5 left-4 text-slate-400 group-focus-within:text-teal-600 transition-colors">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        required
                                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-600 dark:focus:border-teal-500 transition-all duration-300 text-slate-900 dark:text-white font-medium"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-3.5 right-4 text-slate-400 hover:text-teal-600 transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {/* Strength Meter */}
                                {formData.password && (
                                    <div className="px-1 pt-1">
                                        <div className="flex gap-1.5 h-1.5">
                                            <div className={`flex-1 rounded-full transition-all duration-500 ${strength.score >= 1 ? strength.color : 'bg-slate-100 dark:bg-slate-800'}`}></div>
                                            <div className={`flex-1 rounded-full transition-all duration-500 ${strength.score >= 2 ? strength.color : 'bg-slate-100 dark:bg-slate-800'}`}></div>
                                            <div className={`flex-1 rounded-full transition-all duration-500 ${strength.score >= 3 ? strength.color : 'bg-slate-100 dark:bg-slate-800'}`}></div>
                                        </div>
                                        <p className={`text-[10px] mt-1.5 font-black uppercase tracking-widest ${strength.textClass}`}>
                                            Security: {strength.label}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1">Confirm Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-3.5 left-4 text-slate-400 group-focus-within:text-teal-600 transition-colors">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        required
                                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-600 dark:focus:border-teal-500 transition-all duration-300 text-slate-900 dark:text-white font-medium"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-3.5 right-4 text-slate-400 hover:text-teal-600 transition-colors"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    id="agreed"
                                    name="agreed"
                                    type="checkbox"
                                    checked={formData.agreed}
                                    onChange={handleChange}
                                    className="h-5 w-5 text-teal-600 focus:ring-teal-500 border-slate-300 rounded-lg cursor-pointer dark:bg-slate-800 dark:border-slate-700"
                                />
                                <label htmlFor="agreed" className="text-sm text-slate-600 dark:text-slate-400 font-medium cursor-pointer">
                                    I agree to the <Link to="/terms" className="text-teal-600 font-bold hover:underline">Terms & Conditions</Link>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-gradient-to-r from-[#0F766E] to-[#2563EB] hover:shadow-2xl hover:shadow-teal-500/30 text-white font-black text-lg rounded-2xl transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 overflow-hidden group relative mt-4"
                            >
                                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        <span>Creating Account...</span>
                                    </>
                                ) : (
                                    <span>Register Now</span>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 flex items-center gap-4">
                            <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                            <span className="text-slate-400 font-bold text-sm">CONTINUE WITH</span>
                            <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="mt-6 w-full py-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white font-bold text-lg rounded-2xl transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
                        >
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            <span>Google</span>
                        </button>

                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                Secured by SmartMedi Triple-Layer Encryption
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
