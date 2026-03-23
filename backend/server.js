const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing in .env file");
    process.exit(1);
}

const app = express();

// Middleware
app.use(cors({
    origin: ["https://smart-medi-system.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic Route for testing
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Smart Medi API' });
});

// Health check route
app.get('/api', (req, res) => {
    res.json({ status: 'success', message: 'Smart Medi API is working' });
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const contactRoutes = require('./routes/contact.routes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const reportRoutes = require('./routes/reportRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api', contactRoutes);
app.use('/api/reports', reportRoutes);

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            const whitelist = [
                "https://smart-medi-system.vercel.app", 
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:4173"
            ];
            if (!origin || whitelist.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET", "POST"]
    }
});

// Make io accessible in controllers
app.set('socketio', io);
global.io = io;

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join Role-based Rooms
    socket.on('joinDoctorRoom', (doctorId) => {
        if (!doctorId) return;
        socket.join(`doctor_${doctorId}`);
        console.log(`Socket ${socket.id} joined doctor_${doctorId}`);
    });

    socket.on('joinPatientRoom', (patientId) => {
        if (!patientId) return;
        socket.join(`patient_${patientId}`);
        console.log(`Socket ${socket.id} joined patient_${patientId}`);
    });

    socket.on('joinAdminRoom', () => {
        socket.join('admin');
        console.log(`Socket ${socket.id} joined admin room`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Import Error Handler
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

const { exec } = require('child_process');

/**
 * Safely kills any process running on a specific port (Windows only)
 */
const killPort = (port) => {
    return new Promise((resolve) => {
        if (process.platform !== 'win32') return resolve();
        
        exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
            if (!stdout) return resolve();
            
            const lines = stdout.split('\n');
            const pids = new Set();
            lines.forEach(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length > 4) {
                    const pid = parts[parts.length - 1];
                    if (pid && !isNaN(pid) && pid !== '0') pids.add(pid);
                }
            });

            if (pids.size === 0) return resolve();

            const killPromises = Array.from(pids).map(pid => {
                return new Promise((resKill) => {
                    exec(`taskkill /F /PID ${pid}`, () => resKill());
                });
            });

            Promise.all(killPromises).then(() => {
                console.log(`Cleared port ${port} by terminating PIDs: ${Array.from(pids).join(', ')}`);
                setTimeout(resolve, 1000); // Give OS time to release port
            });
        });
    });
};

/**
 * Starts the server with dynamic port failover
 */
const startServer = async (port) => {
    // Only attempt to start if not already listening (prevents ERR_SERVER_ALREADY_LISTEN)
    if (server.listening) {
        console.log('Server is already listening.');
        return;
    }

    // Stage 1: Attempt to clear the primary port (5000) if it's the first try
    if (port === 5000 || port === parseInt(process.env.PORT)) {
        await killPort(port);
    }

    const nextPort = port + 1;
    
    try {
        server.listen(port, () => {
            console.log(`
=========================================
🚀 SmartMedi Backend is LIVE
📍 Port: ${port}
🔗 URL: http://localhost:${port}
🛠️  Mode: ${process.env.NODE_ENV || 'development'}
=========================================`);
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.warn(`⚠️  Port ${port} is occupied. Attempting failover to ${nextPort}...`);
                // Close the server if it partially failed but registered the event
                server.close(); 
                startServer(nextPort);
            } else {
                console.error('❌ Server failed to start:', err);
                process.exit(1);
            }
        });
    } catch (e) {
        if (e.code === 'ERR_SERVER_ALREADY_LISTEN') {
            console.log('Server already listening, ignoring redundant start attempt.');
        } else {
            throw e;
        }
    }
};

const PORT = parseInt(process.env.PORT) || 5000;
startServer(PORT);
