import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Clock, ShieldCheck, HeartPulse, ChevronRight, Stethoscope } from 'lucide-react';

export default function LandingPage() {
    return (
        <main className="flex-grow">
            {/* Hero Section */}
            <section className="bg-slate-50 dark:bg-slate-950 py-20 lg:py-32 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
                        <div className="mb-12 lg:mb-0">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6">
                                Modern Healthcare <br />
                                <span>Simplified</span>
                            </h1>
                            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl">
                                Smart Medi provides a seamless, professional experience for managing medical appointments, patient records, and hospital administration all in one place.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    to="/login"
                                    className="inline-flex justify-center items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg shadow-sm text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition-colors"
                                >
                                    Book Appointment
                                    <ChevronRight className="ml-2 -mr-1 h-5 w-5" />
                                </Link>
                                <Link
                                    to="#services"
                                    className="inline-flex justify-center items-center px-8 py-4 border border-slate-300 dark:border-slate-700 text-lg font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Learn More
                                </Link>
                            </div>
                        </div>
                        <div className="relative">
                            {/* Video Placeholder Container */}
                            <div className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-3xl flex items-center justify-center relative shadow-2xl overflow-hidden">
                                <video
                                    className="absolute inset-0 w-full h-full object-cover"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    src="https://videos.pexels.com/video-files/3163534/3163534-uhd_3840_2160_30fps.mp4"
                                ></video>
                                <div className="absolute inset-0 bg-black/10 dark:bg-black/30"></div>
                                {/* Decorative elements */}
                                <div className="absolute top-10 right-10 bg-white/90 border border-slate-100 backdrop-blur-sm p-4 rounded-xl shadow-lg flex items-center gap-3">
                                    <ShieldCheck className="w-8 h-8 text-slate-800" />
                                    <div>
                                        <div className="text-sm font-bold text-slate-900">Verified</div>
                                        <div className="text-xs text-slate-500">Trusted</div>
                                    </div>
                                </div>
                                <div className="absolute bottom-10 left-10 bg-white/90 border border-slate-100 backdrop-blur-sm p-4 rounded-xl shadow-lg flex items-center gap-3">
                                    <Activity className="w-8 h-8 text-slate-800" />
                                    <div>
                                        <div className="text-sm font-bold text-slate-900">24/7</div>
                                        <div className="text-xs text-slate-500">Support</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-20 bg-white dark:bg-slate-900 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 tracking-wide uppercase">Services</h2>
                        <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                            Comprehensive Health Solutions
                        </p>
                        <p className="mt-4 max-w-2xl text-xl text-slate-500 mx-auto dark:text-slate-400">
                            We provide a wide range of medical services tailored to your needs.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Service Card 1 */}
                        <div className="bg-slate-50 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 group hover:-translate-y-1">
                            <div className="bg-slate-200 dark:bg-slate-700 w-16 h-16 rounded-xl flex items-center justify-center mb-6 text-slate-900 dark:text-white group-hover:scale-110 transition-transform">
                                <Stethoscope className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3 dark:text-white">General Checkup</h3>
                            <p className="text-slate-600 dark:text-slate-400">Comprehensive health examinations and routine checkups to maintain your well-being.</p>
                        </div>

                        {/* Service Card 2 */}
                        <div className="bg-slate-50 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 group hover:-translate-y-1">
                            <div className="bg-slate-200 dark:bg-slate-700 w-16 h-16 rounded-xl flex items-center justify-center mb-6 text-slate-900 dark:text-white group-hover:scale-110 transition-transform">
                                <Activity className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3 dark:text-white">Cardiology</h3>
                            <p className="text-slate-600 dark:text-slate-400">Expert care for your heart with advanced diagnostics and treatment plans.</p>
                        </div>

                        {/* Service Card 3 */}
                        <div className="bg-slate-50 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 group hover:-translate-y-1">
                            <div className="bg-slate-200 dark:bg-slate-700 w-16 h-16 rounded-xl flex items-center justify-center mb-6 text-slate-900 dark:text-white group-hover:scale-110 transition-transform">
                                <Clock className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3 dark:text-white">24/7 Emergency</h3>
                            <p className="text-slate-600 dark:text-slate-400">Round-the-clock emergency medical services to ensure your safety at all times.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Choose Us Section */}
            <section className="py-20 bg-slate-950 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl font-extrabold mb-6">Why Choose Smart Medi?</h2>
                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-slate-800 text-white">
                                            <ShieldCheck className="h-6 w-6" />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-lg leading-6 font-medium">Expert Professionals</h4>
                                        <p className="mt-2 text-slate-400 text-sm">Our hospital is staffed by top-tier medical professionals dedicated to your health.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-slate-800 text-white">
                                            <Activity className="h-6 w-6" />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-lg leading-6 font-medium">Modern Technology</h4>
                                        <p className="mt-2 text-slate-400 text-sm">We use cutting-edge technology to diagnose and treat various medical conditions.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-12 lg:mt-0 bg-slate-900 p-8 rounded-2xl border border-slate-800">
                            <h3 className="text-2xl font-bold mb-4">Book your appointment now</h3>
                            <p className="text-slate-400 mb-8">Join thousands of patients who trust us with their health.</p>
                            <Link
                                to="/register"
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-slate-900 bg-white hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                            >
                                Get Started Today
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

        </main>
    );
}
