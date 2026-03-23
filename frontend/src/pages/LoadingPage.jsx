import React from 'react';
import { Activity } from 'lucide-react';

export default function LoadingPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
            <div className="relative">
                {/* Outer glowing ring */}
                <div className="absolute inset-0 rounded-full border-4 border-primary-100 dark:border-primary-900/50 animate-ping"></div>
                {/* Inner pulse */}
                <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/30 rounded-full flex items-center justify-center relative">
                    <Activity className="w-10 h-10 text-primary-600 dark:text-primary-500 animate-pulse" />
                </div>
            </div>
            <h2 className="mt-6 text-xl font-bold text-slate-900 dark:text-white animate-pulse">Loading Smart Medi...</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Please wait while we prepare your dashboard.</p>
        </div>
    );
}
