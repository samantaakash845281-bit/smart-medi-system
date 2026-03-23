import React from 'react';
import { Home, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 text-center animate-fade-in-up">
            <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-8">
                <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-500" />
            </div>
            <h1 className="text-6xl font-black text-slate-900 dark:text-white mb-4">404</h1>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">Page Not Found</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <Link
                to="/"
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm shadow-primary-500/30"
            >
                <Home className="w-5 h-5" />
                Back to Home
            </Link>
        </div>
    );
}
