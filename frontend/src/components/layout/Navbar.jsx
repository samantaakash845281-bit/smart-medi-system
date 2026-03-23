import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HeartPulse, Menu, X, ArrowLeft, Sun, Moon } from 'lucide-react';

export default function Navbar() {
    const [isOpen, setIsOpen] = React.useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 dark:bg-slate-900/80 dark:border-slate-800 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                    <div className="flex items-center gap-4">
                        {location.pathname !== '/' && (
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                                title="Go Back"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        )}
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="bg-primary-600 p-2 rounded-xl group-hover:bg-primary-500 transition-colors">
                                <HeartPulse className="h-6 w-6 text-white" />
                            </div>
                            <span className="font-bold text-2xl text-slate-900 tracking-tight dark:text-white">
                                Smart<span className="text-primary-600">Medi</span>
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link to="/" className="text-slate-600 hover:text-slate-900 font-medium transition-colors dark:text-slate-300 dark:hover:text-white">Home</Link>
                        <Link to="/services" className="text-slate-600 hover:text-slate-900 font-medium transition-colors dark:text-slate-300 dark:hover:text-white">Services</Link>
                        <Link to="/about" className="text-slate-600 hover:text-slate-900 font-medium transition-colors dark:text-slate-300 dark:hover:text-white">About</Link>
                        <Link to="/contact" className="text-slate-600 hover:text-slate-900 font-medium transition-colors dark:text-slate-300 dark:hover:text-white">Contact</Link>

                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

                        <button
                            onClick={() => document.documentElement.classList.toggle('dark')}
                            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-full transition-colors focus:outline-none bg-slate-100 dark:bg-slate-800"
                            title="Toggle Theme"
                        >
                            <span className="dark:hidden"><Moon className="h-5 w-5" /></span>
                            <span className="hidden dark:inline"><Sun className="h-5 w-5" /></span>
                        </button>

                        <Link
                            to="/login"
                            className="text-slate-900 font-semibold hover:text-slate-700 transition-colors dark:text-white dark:hover:text-slate-300"
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/register"
                            className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-2.5 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm"
                        >
                            Get Started
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center md:hidden gap-4">
                        <button
                            onClick={() => document.documentElement.classList.toggle('dark')}
                            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-full transition-colors focus:outline-none bg-slate-100 dark:bg-slate-800"
                        >
                            <span className="dark:hidden"><Moon className="h-5 w-5" /></span>
                            <span className="hidden dark:inline"><Sun className="h-5 w-5" /></span>
                        </button>

                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 rounded-md p-2 dark:text-slate-400 dark:hover:text-white"
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                    <div className="px-4 pt-2 pb-6 space-y-2 shadow-lg">
                        <Link to="/" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">Home</Link>
                        <Link to="/services" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">Services</Link>
                        <Link to="/about" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">About</Link>
                        <Link to="/contact" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">Contact</Link>
                        <div className="border-t border-slate-100 dark:border-slate-800 my-2 pt-2">
                            <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-slate-800">Sign In</Link>
                            <Link to="/register" className="block px-3 py-2 mt-1 rounded-md text-base font-medium bg-primary-600 text-white hover:bg-primary-700 text-center">Get Started</Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
