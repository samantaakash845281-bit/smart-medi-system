import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, KeySquare, Stethoscope, Activity, CheckCircle2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase/firebase";
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login, updateUser } = useContext(AuthContext);

    // Forgot Password State
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotStep, setForgotStep] = useState(1);
    const [resetIdentifier, setResetIdentifier] = useState('');
    const [resetOtp, setResetOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState('');
    const [resendTimer, setResendTimer] = useState(0);


    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prevTimer) => prevTimer - 1);
            }, 1000);
        } else if (resendTimer === 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!email || !password) {
            setIsLoading(false);
            return;
        }

        const result = await login(email, password, "user");

        if (result.success) {
            navigate(`/${result.role}-dashboard`);
        } else {
            setError(result.message);
        }

        setIsLoading(false);
    };

    const handleSendOTP = async (e) => {
        if (e) e.preventDefault();
        setResetError('');
        setResetLoading(true);
        try {
            const response = await api.post('/auth/forgot-password', { identifier: resetIdentifier });
            if (response.success) {
                setForgotStep(2);
                setResetSuccess('OTP sent successfully to your email!');
                setResendTimer(60);
                setTimeout(() => setResetSuccess(''), 4000);
            } else {
                setResetError(response.message || 'Failed to send OTP');
            }
        } catch (err) {
            setResetError(err.message || 'Error communicating with server');
        }
        setResetLoading(false);
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
        console.error("Google Login Error:", err);
        const errorMessage = err.message || (err.response && err.response.data && err.response.data.message) || "Google Login failed";
        toast.error(errorMessage);
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
                        Your Health, <br />
                        <span className="text-teal-200">Our Priority.</span>
                    </motion.h1>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="space-y-6"
                    >
                        <p className="text-xl text-white/80 font-medium leading-relaxed">
                            SmartMedi helps you connect with trusted doctors and manage your medical appointments easily.
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
                        {!showForgotModal ? (
                            <motion.div 
                                key="login-form"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.5 }}
                                className="w-full max-w-md"
                            >
                                <div className="mb-10 text-center lg:text-left">
                                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Welcome Back</h2>
                                    <p className="mt-4 text-slate-500 font-medium text-lg leading-relaxed">
                                        Continue your health journey. Don't have an account?{' '}
                                        <Link to="/register" className="text-teal-600 font-bold hover:text-teal-700 underline underline-offset-4 decoration-teal-600/30">
                                            Register
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

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1">Email or Phone</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-4 left-4 text-slate-400 group-focus-within:text-teal-600 transition-colors">
                                                <Mail className="h-5 w-5" />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-600 dark:focus:border-teal-500 transition-all duration-300 text-slate-900 dark:text-white font-medium"
                                                placeholder="Enter your email or phone"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center ml-1">
                                            <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Password</label>
                                            <button 
                                                type="button" 
                                                onClick={() => setShowForgotModal(true)} 
                                                className="text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors"
                                            >
                                                Forgot Password?
                                            </button>
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute inset-y-4 left-4 text-slate-400 group-focus-within:text-teal-600 transition-colors">
                                                <Lock className="h-5 w-5" />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-600 dark:focus:border-teal-500 transition-all duration-300 text-slate-900 dark:text-white font-medium"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-4 right-4 text-slate-400 hover:text-teal-600 transition-colors"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-4 bg-gradient-to-r from-[#0F766E] to-[#2563EB] hover:shadow-2xl hover:shadow-teal-500/30 text-white font-black text-lg rounded-2xl transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 overflow-hidden group relative"
                                    >
                                        <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                                        {isLoading ? (
                                            <>
                                                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                                <span>Signing in...</span>
                                            </>
                                        ) : (
                                            <span>Secure Sign In</span>
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

                                <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
                                    <p className="text-slate-400 text-sm font-medium">
                                        Protected by SmartMedi Cloud Security. <br />
                                        Your data is encrypted end-to-end.
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="forgot-modal"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className="w-full max-w-md"
                            >
                                <button
                                    onClick={() => { setShowForgotModal(false); setForgotStep(1); setResetError(''); }}
                                    className="mb-10 flex items-center text-slate-500 hover:text-teal-600 font-bold transition-all group"
                                >
                                    <ArrowLeft className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" /> 
                                    <span>Back to Login</span>
                                </button>

                                {forgotStep === 1 && (
                                    <div className="space-y-8">
                                        <div>
                                            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Reset Password</h2>
                                            <p className="mt-4 text-slate-500 font-medium text-lg leading-relaxed">
                                                Enter your identifier. We'll send an OTP to verify your account.
                                            </p>
                                        </div>

                                        <form onSubmit={handleSendOTP} className="space-y-6">
                                            {resetError && <p className="text-red-500 font-bold bg-red-50 p-3 rounded-xl border border-red-100">{resetError}</p>}
                                            {resetSuccess && <p className="text-teal-600 font-bold bg-teal-50 p-3 rounded-xl border border-teal-100">{resetSuccess}</p>}

                                            <div className="space-y-2">
                                                <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Email or Phone</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-600 font-medium dark:text-white"
                                                    placeholder="example@email.com"
                                                    value={resetIdentifier}
                                                    onChange={(e) => setResetIdentifier(e.target.value)}
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={resetLoading}
                                                className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl shadow-xl shadow-teal-600/20 transition-all disabled:opacity-50"
                                            >
                                                {resetLoading ? 'Sending...' : 'Request OTP'}
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {forgotStep === 2 && (
                                    <div className="space-y-8">
                                        <div>
                                            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Verify Identity</h2>
                                            <p className="mt-4 text-slate-500 font-medium text-lg">
                                                6-digit code sent to <strong>{resetIdentifier}</strong>.
                                            </p>
                                        </div>

                                        <form onSubmit={handleResetPassword} className="space-y-6">
                                            {resetError && <p className="text-red-500 font-bold">{resetError}</p>}

                                            <div className="space-y-2">
                                                <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider text-center block">6DP OTP</label>
                                                <input
                                                    type="text"
                                                    maxLength="6"
                                                    required
                                                    className="w-full px-4 py-5 tracking-[1rem] text-center border-2 border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-3xl font-black outline-none focus:border-teal-600 transition-all"
                                                    placeholder="000000"
                                                    value={resetOtp}
                                                    onChange={(e) => setResetOtp(e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="text-center">
                                                <button
                                                    type="button"
                                                    onClick={handleSendOTP}
                                                    disabled={resendTimer > 0 || resetLoading}
                                                    className="text-sm font-bold text-teal-600 hover:text-teal-700 disabled:opacity-50"
                                                >
                                                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP Code'}
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">New Password</label>
                                                <input
                                                    type="password"
                                                    required
                                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-600 dark:text-white font-medium"
                                                    placeholder="Enter new secure password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={resetLoading}
                                                className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl shadow-xl shadow-teal-600/20 transition-all font-bold"
                                            >
                                                {resetLoading ? 'Updating...' : 'Update Password'}
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {forgotStep === 3 && (
                                    <div className="space-y-8 text-center">
                                        <div className="w-24 h-24 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                            <ShieldCheck className="w-12 h-12 text-teal-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Success!</h2>
                                            <p className="mt-4 text-slate-500 font-medium text-lg leading-relaxed">
                                                Your security credentials have been updated successfully.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => { setShowForgotModal(false); setForgotStep(1); }}
                                            className="w-full py-4 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-black rounded-2xl shadow-xl hover:shadow-2xl transition-all"
                                        >
                                            Return to Sign In
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
