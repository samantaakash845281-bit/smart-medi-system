import React, { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, UserPlus, Calendar, FileText, Settings, LogOut,
    Stethoscope, Pill, Clock, Activity, HeartPulse, UserCircle, CreditCard
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { usePopup } from '../../context/PopupContext';
import { BACKEND_URL } from '../../services/api';

const roleNavItems = {
    admin: [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/admin-dashboard' },
        { name: 'Manage Doctors', icon: Stethoscope, path: '/admin-dashboard/doctors' },
        { name: 'Manage Patients', icon: Users, path: '/admin-dashboard/patients' },
        { name: 'Appointments', icon: Calendar, path: '/admin-dashboard/appointments' },
        { name: 'Payments', icon: CreditCard, path: '/admin-dashboard/payments' },
        { name: 'Reports', icon: FileText, path: '/admin-dashboard/reports' },
        { name: 'Settings', icon: Settings, path: '/admin-dashboard/settings' },
        { name: 'Profile', icon: UserCircle, path: '/admin-dashboard/profile' },
    ],
    doctor: [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/doctor-dashboard' },
        { name: 'My Patients', icon: Users, path: '/doctor-dashboard/patients' },
        { name: 'Appointments', icon: Calendar, path: '/doctor-dashboard/appointments' },
        { name: 'Prescriptions', icon: Pill, path: '/doctor-dashboard/prescriptions' },
        { name: 'Earnings', icon: CreditCard, path: '/doctor-dashboard/earnings' },
        { name: 'Profile', icon: UserCircle, path: '/doctor-dashboard/profile' },
    ],
    patient: [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/patient-dashboard' },
        { name: 'Book Appointment', icon: UserPlus, path: '/patient-dashboard/book-appointment' },
        { name: 'My Appointments', icon: Calendar, path: '/patient-dashboard/appointments' },
        { name: 'Prescriptions', icon: Pill, path: '/patient-dashboard/prescriptions' },
        { name: 'Medical History', icon: Activity, path: '/patient-dashboard/history' },
        { name: 'Payments', icon: CreditCard, path: '/patient-dashboard/payments' },
        { name: 'Profile', icon: UserCircle, path: '/patient-dashboard/profile' },
    ]
};

export default function Sidebar({ isOpen, setIsOpen }) {
    const { user, logout } = useContext(AuthContext);
    const { openPopup } = usePopup();
    const navigate = useNavigate();

    const handleLogoutClick = () => {
        openPopup({
            title: 'Ready to leave?',
            message: "Are you sure you want to logout? You'll need to sign in again to access your health records.",
            confirmText: 'Log Out',
            cancelText: 'Cancel',
            onConfirm: () => logout(user?.role),
            type: 'confirm'
        });
    };

    const navItems = user ? (roleNavItems[user?.role] || []) : [];

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-16 flex items-center px-6 border-b border-slate-800">
                        <div className="flex items-center gap-2 group">
                            <div className="bg-primary-600 p-1.5 rounded-lg">
                                <HeartPulse className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-xl text-white tracking-tight">
                                SmartMedi
                            </span>
                        </div>
                    </div>

                    <div className="p-4 border-b border-slate-800">
                        <div className="font-medium text-slate-200 flex items-center gap-3">
                            {user?.profile_image ? (
                                <img src={user?.profile_image.startsWith('http') ? user?.profile_image : `${BACKEND_URL}${user?.profile_image}`} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                            ) : (
                                <UserCircle className="text-slate-400 w-10 h-10" />
                            )}
                            <div>
                                <div className="capitalize font-semibold text-sm text-white">{user?.fullName || 'User'}</div>
                                <div className="text-xs text-slate-400 capitalize">{user?.role}</div>
                            </div>
                        </div>
                    </div>

                    {/* Nav Links */}
                    <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        {navItems?.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path.endsWith('dashboard')}
                                onClick={() => setIsOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center px-4 py-2.5 rounded-xl transition-all duration-300 group ${isActive
                                        ? 'bg-[#1E293B] text-primary-600 font-bold relative shadow-sm'
                                        : 'text-[#E2E8F0] hover:bg-[#1E293B]/50 hover:text-white font-medium'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary-600 rounded-r-full" />}
                                        <item.icon className={`h-5 w-5 mr-3 flex-shrink-0 transition-colors ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-[#E2E8F0]'}`} />
                                        {item.name}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>

                    {/* Logout */}
                    <div className="p-4 border-t border-slate-800">
                        <button
                            onClick={handleLogoutClick}
                            className="flex items-center w-full px-4 py-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-[#1A2235] transition-all duration-200 font-medium"
                        >
                            <LogOut className="h-5 w-5 mr-3" />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
