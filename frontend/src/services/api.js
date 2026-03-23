import axios from 'axios';

// Dynamic Backend Port Discovery (5000 primary, 5001 failover)
const getBaseUrl = () => {
    // For local development, we want to be resilient to port shifts (5000/5001)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const savedPort = localStorage.getItem('backend_port') || '5000';
        return `http://localhost:${savedPort}`;
    }
    return 'https://smart-medi-system.vercel.app'; // Production fallback
};

export const BACKEND_URL = getBaseUrl();

const api = axios.create({
    baseURL: `${BACKEND_URL}/api`,
});

// Request Interceptor: Attach Token to every request
api.interceptors.request.use(
    async (config) => {
        // Intercept for Simulation (DEACTIVATED)
        /*
        const mockResponse = await simulateRequest(config);
        if (mockResponse) {
            config.adapter = async () => {
                return {
                    data: mockResponse,
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config: config,
                };
            };
        }
        */

        const token = sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global Errors & Port Discovery
api.interceptors.response.use(
    (response) => response.data, 
    async (error) => {
        // If connection refused (Network Error), try to discover the active port (5000 <-> 5001)
        if (!error.response && error.code === 'ERR_NETWORK') {
            const now = Date.now();
            const lastDiscovery = parseInt(localStorage.getItem('backend_discovery_last_tried') || '0');
            
            // 5 second cooldown to prevent reload loops
            if (now - lastDiscovery > 5000) {
                const currentPort = localStorage.getItem('backend_port') || '5000';
                const nextPort = currentPort === '5000' ? '5001' : '5000';
                
                localStorage.setItem('backend_discovery_last_tried', now.toString());
                console.warn(`Backend connection failed on port ${currentPort}. Trying failover port ${nextPort}...`);
                
                try {
                    // Quick ping check
                    await axios.get(`http://localhost:${nextPort}/api/auth/status`, { timeout: 1500 });
                    localStorage.setItem('backend_port', nextPort);
                    console.log(`Discovered active backend on port ${nextPort}. Reloading...`);
                    window.location.reload(); 
                    return Promise.reject(error);
                } catch (pingErr) {
                    console.error("All backend discovery attempts failed. Backend may be offline.");
                }
            }
        }

        // If 401 Unauthorized
        if (error.response && error.response.status === 401) {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
        }
        return Promise.reject(error.response?.data || error);
    }
);

export default api;
