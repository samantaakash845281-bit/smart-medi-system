import React from 'react';
import { FileText } from 'lucide-react';

export default function TermsOfServicePage() {
    return (
        <main className="flex-grow bg-slate-50 dark:bg-slate-900 transition-colors py-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 sm:p-12">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="bg-primary-100 dark:bg-slate-700 p-3 rounded-xl text-primary-600 dark:text-white">
                            <FileText className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Terms of Service
                        </h1>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-a:text-primary-600 dark:prose-a:text-primary-400 focus:outline-none">
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>

                        <h2 className="text-2xl mt-8 mb-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using the Smart Medi platform, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
                        </p>

                        <h2 className="text-2xl mt-8 mb-4">2. Description of Service</h2>
                        <p>
                            Smart Medi provides users with access to a rich collection of resources, including various communications tools, medical record management, and appointment scheduling tools (the "Service"). You also understand and agree that the Service may include certain communications from Smart Medi, such as service announcements and administrative messages.
                        </p>

                        <h2 className="text-2xl mt-8 mb-4">3. Your Registration Obligations</h2>
                        <p>
                            In consideration of your use of the Service, you agree to: (a) provide true, accurate, current and complete information about yourself as prompted by the Service's registration form, and (b) maintain and promptly update the Registration Data to keep it true, accurate, current and complete.
                        </p>

                        <h2 className="text-2xl mt-8 mb-4">4. User Account, Password, and Security</h2>
                        <p>
                            You will receive a password and account designation upon completing the Service's registration process. You are responsible for maintaining the confidentiality of the password and account, and are fully responsible for all activities that occur under your password or account.
                        </p>

                        <h2 className="text-2xl mt-8 mb-4">5. Medical Disclaimer</h2>
                        <p>
                            The content provided through the Smart Medi platform is for informational purposes only and is not intended as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
                        </p>

                        <h2 className="text-2xl mt-8 mb-4">6. Modifications to Service</h2>
                        <p>
                            Smart Medi reserves the right at any time and from time to time to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
