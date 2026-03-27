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
    origin: ["https://smart-medi-system.vercel.app", "https://smartmedi-frontend.vercel.app", "http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Use process.env.PORT for Render, fallback to 5000 for local development
const PORT = process.env.PORT || 5000;

// Root Route - Immediate response for Render health checks
app.get('/', (req, res) => {
    res.json({ 
        status: 'success', 
        message: 'Smart Medi API is running',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Basic Route for testing (redundant but kept for compatibility)
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
                "https://smartmedi-frontend.vercel.app",
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

// Global Error Handler
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

/**
 * Simplified Start Server
 * Starts the server immediately on the assigned PORT.
 * Render requires the app to listen on process.env.PORT.
 */
server.listen(PORT, () => {
    console.log(`--------------------------------------------------`);
    console.log(`🚀 Smart Medi Backend started on port ${PORT}`);
    console.log(`🏠 Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`--------------------------------------------------`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please clear the port or use a different one.`);
    } else {
        console.error('Server failed to start:', err);
    }
    process.exit(1);
});
