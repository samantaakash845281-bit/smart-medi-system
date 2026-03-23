import React, { createContext, useState, useEffect } from 'react';
import api from "../services/api.js";

export const AuthContext = createContext();

export const useAuth = () => React.useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(sessionStorage.getItem('token') || null);
    const [user, setUser] = useState(() => {
        try {
            const saved = sessionStorage.getItem('user');
            return saved ? JSON.parse(saved) : null;
        } catch (e) { return null; }
    });
    const [role, setRole] = useState(sessionStorage.getItem('role') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Ensure Google Demo Login (which lacks a token) still authenticates seamlessly
                const storedToken = sessionStorage.getItem('token') || 'demo-google-token';
                const storedUser = sessionStorage.getItem('user');
                const storedRole = sessionStorage.getItem('role');

                if (storedToken && storedUser && storedUser !== "undefined") {
                    const userData = JSON.parse(storedUser);
                    if (userData) {
                        const normalizedUser = {
                            ...userData,
                            role: (userData.role === 'user' || !userData.role) ? 'patient' : userData.role,
                            fullName: userData.fullName || userData.name || 'User',
                            name: userData.name || userData.fullName || 'User'
                        };
                        setToken(storedToken);
                        setUser(normalizedUser);
                        setRole(storedRole);
                    }
                }
            } catch (error) {
                console.error('Failed to parse user session:', error);
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('user');
                sessionStorage.removeItem('role');
                setToken(null);
                setUser(null);
                setRole(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (email, password, requestedRole) => {
        try {
            const response = await api.post('/auth/login', { email, password, role: requestedRole });
            if (response.success) {
                const newToken = response.token || response.data?.token;
                const userData = response.user || response.data?.user;
                if (newToken && userData) {
                    const rawRole = response.role || userData.role || response.data?.role || requestedRole;
                    const normalizedRole = (rawRole === 'user' || rawRole === 'patient') ? 'patient' : rawRole;

                    const normalizedUser = {
                        ...userData,
                        role: normalizedRole,
                        fullName: userData.fullName || userData.name,
                        name: userData.name || userData.fullName
                    };

                    sessionStorage.setItem('token', newToken);
                    sessionStorage.setItem('user', JSON.stringify(normalizedUser));
                    sessionStorage.setItem('role', normalizedRole);
                    
                    setToken(newToken);
                    setUser(normalizedUser);
                    setRole(normalizedRole);
                    return { success: true, user: normalizedUser, role: normalizedRole };
                } else {
                    return { success: false, message: 'Invalid server response structure' };
                }
            }
        } catch (error) {
            return { success: false, message: error.message || 'Login failed' };
        }
    };

    const register = async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            if (response.success) {
                return { success: true };
            }
        } catch (error) {
            return { success: false, message: error.message || 'Registration failed' };
        }
    };

    const logout = (currentRole) => {
        const roleToUse = currentRole || user?.role;
        setUser(null);
        // Clear session specific storage ONLY for the current tab
        sessionStorage.clear();

        // Redirect based on role
        if (roleToUse === 'admin') {
            window.location.href = '/admin-login';
        } else if (roleToUse === 'doctor') {
            window.location.href = '/doctor-login';
        } else {
            window.location.href = '/login';
        }
    };

    const updateUser = (newData) => {
        if (!newData) return;

        // Normalize role and name fields
        const normalizedData = {
            ...newData,
            role: (newData.role === 'user' || !newData.role) ? 'patient' : newData.role,
            fullName: newData.fullName || newData.name || (user ? user.fullName : ''),
            name: newData.name || newData.fullName || (user ? user.name : '')
        };

        const updatedUser = { ...user, ...normalizedData };
        setUser(updatedUser);
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
