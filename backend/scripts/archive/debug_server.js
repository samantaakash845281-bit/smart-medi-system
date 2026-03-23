process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
    process.exit(1);
});

try {
    require('./server.js');
} catch (err) {
    console.error('ERROR DURING REQUIRE:', err);
    process.exit(1);
}
