import React, { createContext, useState, useCallback, useContext } from 'react';
import { toast } from 'react-hot-toast';
import ConfirmPopup from '../components/common/ConfirmPopup';

export const PopupContext = createContext();

export const usePopup = () => useContext(PopupContext);

export const PopupProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState({
        title: 'Are you sure?',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onConfirm: null,
        onCancel: null,
        type: 'confirm'
    });

    const openPopup = useCallback((options) => {
        setConfig({
            title: options.title || 'Are you sure?',
            message: options.message,
            confirmText: options.confirmText || 'Yes',
            cancelText: options.cancelText || 'No',
            onConfirm: options.onConfirm,
            onCancel: options.onCancel,
            type: options.type || 'confirm'
        });
        setIsOpen(true);
    }, []);

    const closePopup = useCallback(() => {
        setIsOpen(false);
        if (config.onCancel) {
            config.onCancel();
        }
    }, [config]);

    const handleConfirm = useCallback(() => {
        setIsOpen(false);
        if (config.onConfirm) {
            config.onConfirm();
        }
    }, [config]);

    const showUndo = useCallback((message, onUndoRestored, duration = 5000) => {
        let isUndoing = false;
        
        toast((t) => (
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium">{message}</span>
                <button 
                    onClick={() => {
                        isUndoing = true;
                        toast.dismiss(t.id);
                        if (onUndoRestored) onUndoRestored();
                    }}
                    className="px-4 py-2 bg-slate-800 dark:bg-white dark:text-slate-900 text-white text-xs font-black uppercase tracking-wider rounded-lg hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors shadow-lg"
                >
                    Undo
                </button>
            </div>
        ), {
            duration: duration,
            position: 'bottom-center'
        });
        
        return () => isUndoing;
    }, []);

    return (
        <PopupContext.Provider value={{ isOpen, config, openPopup, closePopup, handleConfirm, showUndo }}>
            {children}
            <ConfirmPopup />
        </PopupContext.Provider>
    );
};
