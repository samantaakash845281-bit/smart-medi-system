import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePopup } from '../../context/PopupContext';
import { AlertCircle, Trash2 } from 'lucide-react';

export default function ConfirmPopup() {
    const { isOpen, config, closePopup, handleConfirm } = usePopup();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Dark Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closePopup}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Popup Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2, type: 'spring', bounce: 0.3 }}
                        className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden"
                    >
                        <div className="flex flex-col items-center text-center">
                            {/* Icon based on type */}
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                                config.type === 'delete' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                                'bg-teal-100 dark:bg-teal-900/30 text-teal-600'
                            }`}>
                                {config.type === 'delete' ? <Trash2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                                {config.title}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                                {config.message}
                            </p>

                            <div className="flex w-full gap-3">
                                <button
                                    onClick={closePopup}
                                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all"
                                >
                                    {config.cancelText}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className={`flex-1 py-3 px-4 font-bold rounded-xl text-white transition-all shadow-lg ${
                                        config.type === 'delete' 
                                            ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' 
                                            : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'
                                    }`}
                                >
                                    {config.confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
