import React from 'react';
import { ShieldCheck, Activity, Stethoscope, Clock, HeartPulse, Sparkles, Droplets, Users } from 'lucide-react';

const services = [
    {
        title: "General Checkup",
        description: "Comprehensive health examinations and routine checkups to maintain your physical well-being and catch early signs of issues.",
        icon: Stethoscope,
        color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
    },
    {
        title: "Cardiology",
        description: "Expert care for your heart with advanced diagnostics, continuous monitoring and specialized treatment plans.",
        icon: Activity,
        color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
    },
    {
        title: "Emergency Care",
        description: "Round-the-clock emergency medical services to ensure your safety and immediate attention at all times.",
        icon: Clock,
        color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
    },
    {
        title: "Laboratory Tests",
        description: "Fast, accurate and reliable diagnostic tests including blood work, biopsies, and genetic screening.",
        icon: Droplets,
        color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
    },
    {
        title: "Dental Care",
        description: "Complete dental services from routine cleanings to complex oral surgeries and cosmetic procedures.",
        icon: Sparkles,
        color: "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
    },
    {
        title: "Pediatrics",
        description: "Specialized, compassionate medical care for infants, children, and adolescents.",
        icon: HeartPulse,
        color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
    }
];

export default function ServicesPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-20 pb-20 transition-colors">

            {/* Page Header */}
            <div className="bg-primary-900 py-16 text-center text-white relative overflow-hidden">
                {/* Abstract Background Element */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary-800 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-primary-700 rounded-full blur-3xl opacity-50"></div>

                <div className="relative z-10 max-w-7xl mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 animate-fade-in-up">Our Services</h1>
                    <p className="text-xl text-primary-200 max-w-2xl mx-auto animate-fade-in-up animation-delay-100">
                        Discover a comprehensive range of medical services tailored to your health needs, delivered by top-tier professionals.
                    </p>
                </div>
            </div>

            {/* Services Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services?.map((service, index) => (
                        <div
                            key={index}
                            className={`bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:shadow-none group hover:-translate-y-2`}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3 ${service.color}`}>
                                <service.icon className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4 dark:text-white">{service.title}</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{service.description}</p>

                            <div className="mt-8">
                                <a href="/login" className="inline-flex items-center text-primary-600 font-medium hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                                    Book Service
                                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Embedded Banner */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
                <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl p-10 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
                    <ShieldCheck className="absolute -top-10 -right-10 w-64 h-64 text-primary-500 opacity-20" />
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Need Specialized Care?</h2>
                        <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
                            Our team of dedicated specialists is ready to provide you with the best medical care. Schedule a consultation today.
                        </p>
                        <a href="/login" className="inline-block px-8 py-4 bg-white text-primary-900 font-bold rounded-lg hover:bg-primary-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                            Book an Appointment
                        </a>
                    </div>
                </div>
            </div>

        </div>
    );
}
