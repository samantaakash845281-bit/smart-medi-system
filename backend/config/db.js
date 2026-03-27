const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const getPoolConfig = () => {
    if (process.env.DATABASE_URL) {
        try {
            const dbUrl = new URL(process.env.DATABASE_URL);
            return {
                host: dbUrl.hostname,
                user: dbUrl.username,
                password: dbUrl.password,
                database: dbUrl.pathname.replace("/", ""),
                port: dbUrl.port || 3306,
                ssl: { rejectUnauthorized: false } // Required for Railway/Render
            };
        } catch (error) {
            console.error("Failed to parse DATABASE_URL:", error);
        }
    }

    return {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smartmedi_db',
        port: process.env.DB_PORT || 3306
    };
};

const pool = mysql.createPool({
    ...getPoolConfig(),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Basic test to verify connection
pool.getConnection()
    .then(connection => {
        console.log('✅ Database connected successfully');
        console.log(`📡 Host: ${getPoolConfig().host}`);
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed during startup!');
        console.error(`🔴 Error: ${err.message}`);
        console.warn('⚠️ Server will still start, but DB features will be unavailable.');
    });

module.exports = pool;
