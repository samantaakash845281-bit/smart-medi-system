import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, KeySquare } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function DoctorLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    // Forgot Password State
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotStep, setForgotStep] = useState(1); // 1: Identifier, 2: OTP, 3: New Password
    const [resetIdentifier, setResetIdentifier] = useState('');
    const [resetOtp, setResetOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState('');
    const [resendTimer, setResendTimer] = useState(0);

    // Countdown Timer for OTP Resend
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

        const result = await login(email, password, "doctor");

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
                setResendTimer(60); // Start the 60 second cooldown
                setTimeout(() => setResetSuccess(''), 4000);
            } else {
                setResetError(response.message || 'Failed to send OTP');
            }
        } catch (err) {
            setResetError(err.message || 'Error communicating with server');
        }
        setResetLoading(false);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setResetError('');
        setResetLoading(true);
        try {
            const response = await api.post('/auth/verify-otp', {
                identifier: resetIdentifier,
                otp: resetOtp,
                newPassword: newPassword
            });
            if (response.success) {
                setForgotStep(3); // Success Screen step
            } else {
                setResetError(response.message || 'Failed to reset password');
            }
        } catch (err) {
            setResetError(err.message || 'Error processing reset');
        }
        setResetLoading(false);
    };

    return (
        <div className="min-h-screen flex bg-white dark:bg-slate-900">
            {/* Global Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="fixed top-6 left-4 sm:left-6 z-50 p-2.5 rounded-full transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200 lg:bg-white/20 lg:text-white xl:bg-white/10 xl:hover:bg-white/20 lg:backdrop-blur-md dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 shadow-sm"
                title="Go Back"
            >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Left Column - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-900 relative overflow-hidden items-center justify-center p-12">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white mix-blend-overlay filter blur-3xl"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-white mix-blend-overlay filter blur-3xl"></div>
                </div>

                <div className="relative z-10 text-white max-w-lg space-y-8 animate-fade-in-up">
                    <Link to="/" className="flex items-center gap-3 inline-flex">
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                            <HeartPulse className="h-10 w-10 text-white" />
                        </div>
                        <span className="font-bold text-4xl tracking-tight">SmartMedi</span>
                    </Link>

                    <h1 className="text-4xl font-extrabold leading-tight">
                        Welcome back to your healthcare portal.
                    </h1>

                    <p className="text-primary-100 text-lg">
                        Manage your appointments, access medical records, and connect with top healthcare professionals securely and efficiently.
                    </p>

                    <div className="flex items-center gap-4 mt-8 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                        <div className="bg-primary-500/20 p-2 rounded-full">
                            <ShieldCheck className="w-6 h-6 text-primary-300" />
                        </div>
                        <div>
                            <p className="font-semibold">Secure & Encrypted</p>
                            <p className="text-sm text-primary-100">Your health data is protected.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 relative">
                <div className={`mx-auto w-full max-w-sm lg:max-w-md animate-fade-in-up transition-opacity duration-300 ${showForgotModal ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ animationDelay: '0.1s' }}>

                    {/* Mobile Header */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="bg-primary-600 p-2 rounded-xl">
                                <HeartPulse className="h-8 w-8 text-white" />
                            </div>
                            <span className="font-bold text-3xl text-slate-900 tracking-tight dark:text-white">
                                Smart<span className="text-primary-600">Medi</span>
                            </span>
                        </Link>
                    </div>

                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Doctor Portal Sign In</h2>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Authorized medical personnel only.</p>
                    </div>

                    <div className="mt-8">
                        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 p-4 rounded-xl mb-6">
                            <p className="text-sm text-primary-700 dark:text-primary-300 text-center">
                                Please enter your registered email and password to sign in.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-r-lg">
                                    <div className="flex">
                                        <div className="ml-3">
                                            <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                                                {error}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Doctor Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-shadow"
                                        placeholder="Doctor Email or 10-digit phone"
                                        value={email}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (/^\d/.test(val)) {
                                                const digits = val.replace(/\D/g, '').slice(0, 10);
                                                setEmail(digits);
                                            } else {
                                                setEmail(val);
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-shadow"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4 text-sm">
                                <button type="button" onClick={() => setShowForgotModal(true)} className="font-semibold text-primary-600 hover:text-primary-500 transition-colors">
                                    Forgot your password?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-6"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        Authenticating...
                                    </div>
                                ) : (
                                    'Sign in securely'
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Forgot Password Modal Overlay */}
                {showForgotModal && (
                    <div className="absolute inset-0 bg-white dark:bg-slate-900 z-40 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 animate-fade-in">
                        <div className="mx-auto w-full max-w-sm lg:max-w-md">
                            <button
                                onClick={() => { setShowForgotModal(false); setForgotStep(1); setResetError(''); }}
                                className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                            </button>

                            {forgotStep === 1 && (
                                <div className="space-y-6 animate-fade-in-up">
                                    <div>
                                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4">
                                            <KeySquare className="w-6 h-6 text-primary-600 dark:text-primary-500" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Reset Password</h2>
                                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                            Enter your registered email address or phone number. We'll send you an OTP code to verify your identity.
                                        </p>
                                    </div>

                                    <form onSubmit={handleSendOTP} className="space-y-4">
                                        {resetError && <p className="text-red-500 text-sm">{resetError}</p>}
                                        {resetSuccess && <p className="text-primary-500 text-sm">{resetSuccess}</p>}

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Identifier</label>
                                            <input
                                                type="text"
                                                required
                                                className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                                                placeholder="Email or Phone Number"
                                                value={resetIdentifier}
                                                onChange={(e) => setResetIdentifier(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={resetLoading}
                                            className="w-full py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-70"
                                        >
                                            {resetLoading ? 'Sending...' : 'Send OTP Code'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {forgotStep === 2 && (
                                <div className="space-y-6 animate-fade-in-up">
                                    <div>
                                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4">
                                            <ShieldCheck className="w-6 h-6 text-primary-600 dark:text-primary-500" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verify OTP & Reset</h2>
                                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                            We've sent a 6-digit code to <strong>{resetIdentifier}</strong>. Enter it below along with your new password.
                                        </p>
                                    </div>

                                    <form onSubmit={handleResetPassword} className="space-y-4">
                                        {resetError && <p className="text-red-500 text-sm">{resetError}</p>}

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">6-Digit OTP</label>
                                            <input
                                                type="text"
                                                maxLength="6"
                                                required
                                                className="block w-full px-3 py-2.5 tracking-widest text-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-lg font-mono font-bold"
                                                placeholder="------"
                                                value={resetOtp}
                                                onChange={(e) => setResetOtp(e.target.value)}
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 text-center">
                                            Didn't receive the code?{' '}
                                            <button
                                                type="button"
                                                onClick={handleSendOTP}
                                                disabled={resendTimer > 0 || resetLoading}
                                                className="font-semibold text-primary-600 hover:text-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                                            </button>
                                        </p>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
                                            <input
                                                type="password"
                                                required
                                                className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                                                placeholder="Enter new strong password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={resetLoading}
                                            className="w-full py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-70 mt-2"
                                        >
                                            {resetLoading ? 'Verifying...' : 'Verify & Update Password'}
                                        </button>
                                        <div className="text-center mt-2">
                                            <button type="button" onClick={handleSendOTP} className="text-sm font-medium text-primary-600 hover:underline">Resend OTP</button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {forgotStep === 3 && (
                                <div className="space-y-6 text-center animate-fade-in-up">
                                    <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <ShieldCheck className="w-10 h-10 text-primary-600 dark:text-primary-500" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Password Updated!</h2>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                        Your password has been successfully reset. You can now use your new password to log in to your SmartMedi account.
                                    </p>
                                    <button
                                        onClick={() => { setShowForgotModal(false); setForgotStep(1); }}
                                        className="w-full py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700"
                                    >
                                        Back to Login
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
