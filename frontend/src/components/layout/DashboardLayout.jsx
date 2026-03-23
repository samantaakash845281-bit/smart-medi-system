import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Bell, Moon, Sun, Search, ArrowLeft, Check, Calendar, CreditCard, Stethoscope, Info, LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import api from '../../services/api';
import socket from '../../services/socket';
import { usePopup } from '../../context/PopupContext';

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const { openPopup } = usePopup();
    const notificationRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            if (res.success) {
                setNotifications(res.data);
                setUnreadCount(res.unreadCount);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const { user } = api.useAuth ? api.useAuth() : { user: JSON.parse(sessionStorage.getItem('user')) };

    useEffect(() => {
        const handleBack = (event) => {
            window.history.pushState(null, "", window.location.pathname);
            openPopup({
                title: 'Ready to leave?',
                message: "Are you sure you want to logout? You'll need to sign in again to access your health records.",
                confirmText: 'Log Out',
                cancelText: 'Cancel',
                onConfirm: confirmLogout,
                type: 'confirm'
            });
        };

        window.history.pushState(null, "", window.location.pathname);
        window.addEventListener("popstate", handleBack);

        return () => {
            window.removeEventListener("popstate", handleBack);
        };
    }, []);

    useEffect(() => {
        fetchNotifications();

        // Polling as fallback
        const interval = setInterval(fetchNotifications, 30000);

        // Join appropriate room
        const userId = user?.id || user?.patient_id || user?.doctor_id || user?.admin_id;
        if (user && userId) {
            if (user?.role === 'doctor') {
                socket.emit('joinDoctorRoom', userId);
            } else if (user?.role === 'patient' || user?.role === 'user') {
                socket.emit('joinPatientRoom', userId);
            } else if (user?.role === 'admin') {
                socket.emit('joinAdminRoom');
            }
        }

        // Real-time socket listeners
        const handleNewData = () => {
            console.log('Real-time update received! Refreshing data...');
            fetchNotifications();
            // This will trigger an Outlet refresh if we pass it down or if components listen themselves
            // For now, we manually refresh known global states like notifications
        };

        socket.on('appointmentConfirmed', handleNewData);
        socket.on('newAppointment', handleNewData);
        socket.on('appointmentBooked', handleNewData); // Fallback
        socket.on('appointmentCancelled', handleNewData);
        socket.on('prescriptionAdded', handleNewData);
        socket.on('paymentCompleted', handleNewData);
        
        socket.on('newNotification', (newNotif) => {
            console.log('New real-time notification received:', newNotif);
            setNotifications(prev => [newNotif, ...prev].slice(0, 10)); // Keep last 10
            setUnreadCount(prev => prev + 1);
            
            // Optionally play a sound or show a mini toast
            toast?.success && toast.success(newNotif.title, {
                icon: '🔔',
                duration: 4000
            });
        });

        socket.on('bookingConfirmed', (data) => {
            toast.success(data.message || "Booking Confirmed & Receipt Sent to Email", {
                duration: 5000,
                icon: '📧'
            });
        });

        return () => {
            clearInterval(interval);
            socket.off('appointmentConfirmed', handleNewData);
            socket.off('newAppointment', handleNewData);
            socket.off('appointmentBooked', handleNewData);
            socket.off('appointmentCancelled', handleNewData);
            socket.off('prescriptionAdded', handleNewData);
            socket.off('paymentCompleted', handleNewData);
            socket.off('newNotification'); // Cleanup for newNotification
            socket.off('bookingConfirmed'); // Cleanup for bookingConfirmed
        };
    }, [user]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [notificationRef]);

    const markAsRead = async (id) => {
        try {
            const res = await api.put(`/notifications/read/${id}`);
            if (res.success) {
                setNotifications(notifications?.map(n => n.id === id ? { ...n, is_read: 1 } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.documentElement.classList.toggle('dark');
    };

    const confirmLogout = () => {
        // clear session specific to this tab ONLY
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("role");

        // redirect to login
        window.location.href = "/login";
    };

    const getIcon = (type) => {
        switch (type) {
            case 'appointment': return <Calendar className="h-4 w-4 text-primary-600" />;
            case 'payment': return <CreditCard className="h-4 w-4 text-primary-600" />;
            case 'medical': return <Stethoscope className="h-4 w-4 text-teal-600" />;
            default: return <Bell className="h-4 w-4 text-slate-400" />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="lg:pl-64 flex flex-col flex-1 h-screen">
                {/* Top Header */}
                <header className="h-16 flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 z-20 sticky top-0">
                    <div className="flex items-center">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-slate-600 hover:text-primary-600 dark:text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 mr-2 transition-colors"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-full hover:bg-slate-100 text-black dark:text-white dark:hover:bg-slate-800 transition-colors focus:outline-none mr-2 lg:mr-0 lg:ml-2"
                            title="Go Back"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        {/* Search Bar */}
                        <div className="hidden sm:flex items-center relative rounded-md shadow-sm ml-4 lg:ml-0 w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-9 pr-3 py-2 sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-slate-50 focus:bg-white dark:bg-slate-800 dark:focus:bg-slate-900 focus:ring-1 focus:ring-primary-600 focus:border-primary-600 transition-all dark:text-white"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 sm:space-x-4">
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 text-slate-500 hover:text-primary-600 hover:bg-slate-100 dark:text-white rounded-full focus:outline-none bg-slate-50 dark:bg-slate-800 transition-all duration-200"
                        >
                            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 text-slate-500 hover:text-primary-600 hover:bg-slate-100 dark:text-white rounded-full focus:outline-none bg-slate-50 dark:bg-slate-800 transition-all duration-200"
                            >
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 h-4 min-w-[16px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                                    <div className="p-4 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                        <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                                        <span className="text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">
                                            {unreadCount} New
                                        </span>
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto">
                                        {(Array.isArray(notifications) && notifications.length > 0) ? (
                                            <div className="divide-y divide-slate-50 dark:divide-slate-700">
                                                {notifications?.map((n) => (
                                                    <div
                                                        key={n.id}
                                                        onClick={() => markAsRead(n.id)}
                                                        className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group relative ${!n.is_read ? 'bg-primary-50/20 dark:bg-primary-900/10' : ''}`}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className="mt-1">
                                                                {getIcon(n.type)}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex justify-between items-start">
                                                                    <p className={`text-sm font-bold ${!n.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                                        {n.title}
                                                                    </p>
                                                                    {!n.is_read && <span className="h-2 w-2 bg-primary-500 rounded-full shrink-0 mt-1"></span>}
                                                                </div>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                                                    {n.message}
                                                                </p>
                                                                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                                                                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center">
                                                <div className="mx-auto w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-3">
                                                    <Bell className="h-6 w-6 text-slate-300" />
                                                </div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">No new notifications</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 border-t border-slate-50 dark:border-slate-700 text-center bg-slate-50/30 dark:bg-slate-900/30">
                                        <button className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors uppercase tracking-wider">
                                            View All Notifications
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
                    {/* Outlet renders the nested routes */}
                    <Outlet context={{ searchTerm, setSearchTerm }} />
                </main>
            </div>
        </div>
    );
}
