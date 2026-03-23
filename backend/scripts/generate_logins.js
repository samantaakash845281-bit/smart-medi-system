const fs = require('fs');
const path = require('path');

const loginPath = path.join(__dirname, '../src/pages/auth/LoginPage.jsx');
let loginContent = fs.readFileSync(loginPath, 'utf8');

// LoginPage.jsx modifications
let patientLogin = loginContent
    .replace(/const result = await login\(email, password\);/g, 'const result = await login(email, password, "user");')
    .replace(/navigate\(\`\/\$\{result\.user\.role\}-dashboard\`\);/g, 'navigate("/patient-dashboard");');
fs.writeFileSync(loginPath, patientLogin);

// DoctorLoginPage.jsx
let doctorLogin = loginContent
    .replace(/LoginPage/g, 'DoctorLoginPage')
    .replace(/const result = await login\(email, password\);/g, 'const result = await login(email, password, "doctor");')
    .replace(/navigate\(\`\/\$\{result\.user\.role\}-dashboard\`\);/g, 'navigate("/doctor-dashboard");')
    .replace(/Sign in to your account/g, 'Doctor Portal Sign In')
    .replace(/<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">[\s\S]*?Register now[\s\S]*?<\/p>/g, '<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Authorized medical personnel only.</p>')
    .replace(/Email address or Phone Number/g, 'Doctor Email')
    .replace(/you@example\.com or 1234567890/g, 'doctor@smartmedi.com');
fs.writeFileSync(path.join(__dirname, '../src/pages/auth/DoctorLoginPage.jsx'), doctorLogin);

// AdminLoginPage.jsx
let adminLogin = loginContent
    .replace(/LoginPage/g, 'AdminLoginPage')
    .replace(/const result = await login\(email, password\);/g, 'const result = await login(email, password, "admin");')
    .replace(/navigate\(\`\/\$\{result\.user\.role\}-dashboard\`\);/g, 'navigate("/admin-dashboard");')
    .replace(/Sign in to your account/g, 'Admin Portal Sign In')
    .replace(/<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">[\s\S]*?Register now[\s\S]*?<\/p>/g, '<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">System administrators only.</p>')
    .replace(/Email address or Phone Number/g, 'Admin Email')
    .replace(/you@example\.com or 1234567890/g, 'admin@smartmedi.com');
fs.writeFileSync(path.join(__dirname, '../src/pages/auth/AdminLoginPage.jsx'), adminLogin);

console.log('Login pages successfully generated!');
