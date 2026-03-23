const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'controllers', 'adminController.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all occurrences of DATE(COALESCE(payment_date, created_at)) with DATE(payment_date)
content = content.replace(/DATE\(COALESCE\(payment_date, created_at\)\)/g, 'DATE(payment_date)');

fs.writeFileSync(filePath, content);
console.log('Successfully patched adminController.js');
