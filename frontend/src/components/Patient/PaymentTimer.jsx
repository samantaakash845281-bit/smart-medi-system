import React, { useState, useEffect } from 'react';

const PaymentTimer = ({ onExpire }) => {
    const [seconds, setSeconds] = useState(300); // 5 minutes

    useEffect(() => {
        if (seconds <= 0) {
            onExpire();
            return;
        }

        const timer = setInterval(() => {
            setSeconds((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [seconds, onExpire]);

    const formatTime = (totalSeconds) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center justify-center p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 font-bold animate-pulse">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Complete your payment within {formatTime(seconds)} minutes
        </div>
    );
};

export default PaymentTimer;
