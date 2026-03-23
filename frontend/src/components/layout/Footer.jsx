import React from 'react';
import { HeartPulse, Github, Twitter, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

                    <div className="space-y-4">
                        <Link to="/" className="flex items-center gap-2 group mb-4">
                            <div className="bg-primary-600 p-2 rounded-xl">
                                <HeartPulse className="h-6 w-6 text-white" />
                            </div>
                            <span className="font-bold text-2xl text-white tracking-tight">
                                Smart<span className="text-primary-500">Medi</span>
                            </span>
                        </Link>
                        <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                            Delivering professional and seamless medical management solutions to hospitals and patients worldwide.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-lg hover:bg-slate-700"><Twitter className="h-5 w-5" /></a>
                            <a href="#" className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-lg hover:bg-slate-700"><Github className="h-5 w-5" /></a>
                            <a href="#" className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-lg hover:bg-slate-700"><Linkedin className="h-5 w-5" /></a>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-6">Quick Links</h3>
                        <ul className="space-y-4 text-sm">
                            <li><Link to="/" className="hover:text-primary-400 transition-colors">Home</Link></li>
                            <li><Link to="/services" className="hover:text-primary-400 transition-colors">Services</Link></li>
                            <li><Link to="/about" className="hover:text-primary-400 transition-colors">About Us</Link></li>
                            <li><Link to="/contact" className="hover:text-primary-400 transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-6">Platform</h3>
                        <ul className="space-y-4 text-sm">
                            <li><Link to="/login" className="hover:text-primary-400 transition-colors">Patient Portal</Link></li>
                            <li><Link to="/login" className="hover:text-primary-400 transition-colors">Doctor Portal</Link></li>
                            <li><Link to="/login" className="hover:text-primary-400 transition-colors">Admin Dashboard</Link></li>
                            <li><Link to="/register" className="hover:text-primary-400 transition-colors">Join as Patient</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-6">Contact Us</h3>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-primary-500 shrink-0" />
                                <span>123 Medical Center Blvd<br />Healthcare City, HC 12345</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-primary-500 shrink-0" />
                                <span>+91 84528-18772</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-primary-500 shrink-0" />
                                <span>support@smartmedi.com</span>
                            </li>
                        </ul>
                    </div>

                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between">
                    <p className="text-slate-500 text-sm mb-4 md:mb-0">
                        &copy; {new Date().getFullYear()} Smart Medi. All rights reserved.
                    </p>
                    <div className="flex space-x-6 text-sm text-slate-500">
                        <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
