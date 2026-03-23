import React from 'react';
import { HeartPulse, CheckCircle2 } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-20 pb-20 transition-colors">

            {/* Hero Image Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
                <div className="lg:grid lg:grid-cols-2 gap-16 items-center">
                    <div className="mb-12 lg:mb-0 transform transition-all duration-700 hover:scale-105">
                        {/* Image Placeholder - using an unsplash source for medical image */}
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
                            <img
                                src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1453&q=80"
                                alt="Medical Team Working"
                                className="object-cover w-full h-full"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl flex items-center gap-4 shadow-lg">
                                    <HeartPulse className="w-10 h-10 text-primary-600" />
                                    <div>
                                        <p className="font-bold text-slate-900">10+ Years</p>
                                        <p className="text-xs text-slate-500">Of Healthcare Excellence</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h1 className="text-base font-semibold text-primary-600 tracking-wide uppercase mb-2">About Us</h1>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 dark:text-white leading-tight">
                            Dedicated to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">Better Health</span>
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                            Smart Medi was founded on a simple principle: healthcare should be accessible, efficient, and compassionate. We leverage modern technology to connect patients with top-tier medical professionals seamlessly.
                        </p>

                        <div className="space-y-4">
                            {[
                                "Over 50+ Specialized Doctors",
                                "State-of-the-Art Medical Equipment",
                                "24/7 Emergency Support",
                                "Secure Digital Health Records"
                            ]?.map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <CheckCircle2 className="w-6 h-6 text-primary-500 shrink-0" />
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10">
                            <a href="/contact" className="inline-block px-8 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/30">
                                Contact Us
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mission Section */}
            <div className="bg-white dark:bg-slate-800 mt-24 py-20 border-y border-slate-100 dark:border-slate-700">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Our Mission</h2>
                    <p className="text-xl text-slate-600 dark:text-slate-400 italic font-light leading-relaxed">
                        "To revolutionize the healthcare experience by providing a seamless, secure, and user-centric platform that bridges the gap between patients, doctors, and medical administration."
                    </p>
                </div>
            </div>

        </div>
    );
}
