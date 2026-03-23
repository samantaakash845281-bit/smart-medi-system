import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot, Loader2 } from 'lucide-react';
import api from '../../services/api';

const QUICK_REPLIES = [
    { label: 'Book Appointment', keyword: 'appointment' },
    { label: 'Payment Help', keyword: 'payment' },
    { label: 'Doctor Availability', keyword: 'doctor' },
    { label: 'Contact Support', keyword: 'contact' }
];

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // Initial greeting
    useEffect(() => {
        const savedHistory = sessionStorage.getItem('chat_history');
        if (savedHistory) {
            setMessages(JSON.parse(savedHistory));
        } else {
            const greeting = {
                id: Date.now(),
                text: "Hello 👋 Welcome to Smart Medi. How can I help you today?",
                sender: 'bot',
                timestamp: new Date().toISOString()
            };
            setMessages([greeting]);
        }
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            sessionStorage.setItem('chat_history', JSON.stringify(messages));
        }
    }, [messages]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = async (textToSubmit = message) => {
        const text = typeof textToSubmit === 'string' ? textToSubmit : message;
        if (!text.trim()) return;

        const userMsg = {
            id: Date.now(),
            text: text,
            sender: 'user',
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        setMessage('');
        setIsTyping(true);

        try {
            // Artificial delay for realism
            await new Promise(resolve => setTimeout(resolve, 1000));

            const res = await api.post('/chatbot', { message: text });
            const botMsg = {
                id: Date.now() + 1,
                text: res.reply || "I'm sorry, I couldn't process that.",
                sender: 'bot',
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            const errorMsg = {
                id: Date.now() + 1,
                text: "Our support team will contact you soon.",
                sender: 'bot',
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const clearHistory = () => {
        sessionStorage.removeItem('chat_history');
        const greeting = {
            id: Date.now(),
            text: "Hello 👋 Welcome to Smart Medi. How can I help you today?",
            sender: 'bot',
            timestamp: new Date().toISOString()
        };
        setMessages([greeting]);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-primary-600 to-primary-600 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-white/20 rounded-lg">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Smart Medi Assistant</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 bg-primary-400 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] text-white/80">Always Online</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar">
                        {messages?.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.sender === 'user'
                                    ? 'bg-primary-600 text-white rounded-tr-none'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700'
                                    }`}>
                                    <p className="leading-relaxed">{msg.text}</p>
                                    <p className={`text-[10px] mt-1.5 opacity-60 ${msg.sender === 'user' ? 'text-white' : 'text-slate-400'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Replies */}
                    <div className="px-4 py-2 flex flex-wrap gap-2 shrink-0 bg-white dark:bg-slate-800 border-t border-slate-50 dark:border-slate-700">
                        {QUICK_REPLIES?.map((reply) => (
                            <button
                                key={reply.label}
                                onClick={() => handleSend(reply.keyword)}
                                className="text-[10px] sm:text-xs px-3 py-1.5 rounded-full border border-primary-200 dark:border-primary-900 bg-primary-50 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400 font-bold hover:bg-primary-600 hover:text-white transition-all transform hover:scale-105"
                            >
                                {reply.label}
                            </button>
                        ))}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-50 dark:border-slate-700 shrink-0">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary-500/50 transition-all"
                        >
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your query..."
                                className="flex-1 bg-transparent border-none outline-none text-sm dark:text-white px-2"
                            />
                            <button
                                type="submit"
                                disabled={!message.trim() || isTyping}
                                className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </form>
                        <button
                            onClick={clearHistory}
                            className="w-full text-[10px] text-slate-400 dark:text-slate-500 mt-2 hover:text-red-500 dark:hover:text-red-400 transition-colors uppercase font-bold tracking-widest"
                        >
                            Clear Chat History
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 active:scale-95 ${isOpen
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 rotate-90 shadow-none'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
            >
                {isOpen ? (
                    <X className="w-8 h-8" />
                ) : (
                    <>
                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
                        <MessageCircle className="w-8 h-8" />
                        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2 rounded-xl text-sm font-bold shadow-xl border border-slate-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden sm:block">
                            Chat with Smart Medi Assistant
                        </span>
                    </>
                )}
            </button>
        </div>
    );
}
