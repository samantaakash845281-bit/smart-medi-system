const { execSync } = require('child_process');

console.log("🧼 Starting Master Infrastructure Cleanup...");

const ports = [5000, 5001, 5002, 5003, 5004, 5005, 5006, 5007, 5008, 5009, 5010];

ports.forEach(port => {
    try {
        const result = execSync(`netstat -ano | findstr :${port}`).toString();
        const lines = result.split('\n');
        for (const line of lines) {
            if (line.includes('LISTENING')) {
                const pid = line.trim().split(/\s+/).pop();
                if (pid && !isNaN(pid) && pid !== process.pid.toString()) {
                    console.log(`💀 Killing zombie on port ${port} (PID: ${pid})...`);
                    try {
                        execSync(`taskkill /F /PID ${pid}`);
                    } catch (e) {}
                }
            }
        }
    } catch (e) {
        // Port not in use, skip
    }
});

console.log("✅ Cleanup complete. System is now stable.");
process.exit(0);
