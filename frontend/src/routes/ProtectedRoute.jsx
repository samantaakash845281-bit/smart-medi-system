import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="h-12 w-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        // Determine the correct login page based on the current path
        let loginPath = '/login';
        if (location.pathname.startsWith('/admin-dashboard')) {
            loginPath = '/admin-login';
        } else if (location.pathname.startsWith('/doctor-dashboard')) {
            loginPath = '/doctor-login';
        }

        return <Navigate to={loginPath} state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        // Redirect to their respective dashboard if they try to access unauthorized role route
        return <Navigate to={`/${user?.role}-dashboard`} replace />;
    }

    return children;
}
