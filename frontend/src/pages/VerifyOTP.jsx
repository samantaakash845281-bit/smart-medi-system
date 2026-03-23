import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeySquare, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function VerifyOTP() {
    const navigate = useNavigate();
    const location = useLocation();
    const { email, fullName, googleId, phone, flow, password } = location.state || {};

    const [otpCode, setOtpCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);

    useEffect(() => {
        if (!email) {
            toast.error("Invalid session. Please try again.");
            navigate('/login');
        }
    }, [email, navigate]);

    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (otpCode.length !== 6) {
            toast.error("Please enter a 6-digit OTP");
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/auth/verify-verification-otp', { 
                email, 
                otp: otpCode,
                fullName // Backend might need it or just ignore
            });

            if (response.success) {
                toast.success("Identity verified! Let's complete your profile.");
                navigate('/complete-profile', { 
                    state: { email, fullName, googleId, phone, flow, password } 
                });
            } else {
                toast.error(response.message || "Invalid OTP code");
            }
        } catch (err) {
            toast.error(err.message || "Verification failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;
        
        setIsLoading(true);
        try {
            const response = await api.post('/auth/send-verification-otp', { email });
            if (response.success) {
                toast.success("OTP resent to your email");
                setResendTimer(60);
            } else {
                toast.error(response.message || "Failed to resend OTP");
            }
        } catch (err) {
            toast.error("Error resending OTP");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100"
            >
                <div className="p-8">
                    <button 
                        onClick={() => navigate(-1)}
                        className="mb-8 p-2 hover:bg-slate-50 rounded-full transition-colors group"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-primary-600" />
                    </button>

                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary-100">
                            <KeySquare className="w-8 h-8 text-primary-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Verify Your Identity</h1>
                        <p className="text-slate-500 mt-2">
                            We've sent a 6-digit code to <br />
                            <span className="font-semibold text-slate-900">{email}</span>
                        </p>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Enter 6-Digit Code</label>
                            <input
                                type="text"
                                maxLength="6"
                                placeholder="000000"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-3xl font-bold tracking-[0.5em] focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all placeholder:text-slate-200"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                            Verify & Continue
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-500 text-sm">
                            Didn't receive the code?{' '}
                            {resendTimer > 0 ? (
                                <span className="text-primary-600 font-bold ml-1">Resend in {resendTimer}s</span>
                            ) : (
                                <button 
                                    onClick={handleResend}
                                    className="text-primary-600 font-bold hover:underline ml-1"
                                >
                                    Resend Now
                                </button>
                            )}
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
