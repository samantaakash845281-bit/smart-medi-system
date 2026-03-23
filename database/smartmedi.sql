-- Create the database if it doesn't already exist
CREATE DATABASE IF NOT EXISTS smart_medi_db;
USE smart_medi_db;

-- -----------------------------------------------------
-- TABLE 1: users
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullName VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'doctor', 'patient') NOT NULL,
    status ENUM('active', 'pending') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- TABLE 2: appointments
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_appointments_patient (patient_id),
    INDEX idx_appointments_doctor (doctor_id),
    INDEX idx_appointments_date (appointment_date)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- TABLE 3: prescriptions
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS prescriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    doctor_id INT NOT NULL,
    patient_id INT NOT NULL,
    medicine_name VARCHAR(150) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_prescriptions_doctor (doctor_id),
    INDEX idx_prescriptions_patient (patient_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- TABLE 4: reports
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    report_file VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_reports_patient (patient_id),
    INDEX idx_reports_doctor (doctor_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Seed Default Admin User
-- -----------------------------------------------------
-- Note: The password below is a bcrypt hash for 'password123'
-- ($2b$10$mC/0r2k.5I.u5QvAOH.L.ORn./6Ea28bZzD6P6p./8/S5B.2U2IHe)
INSERT INTO users (fullName, email, phone, password, role, status)
VALUES (
    'System Admin', 
    'admin@smartmedi.com', 
    '1234567890', 
    '$2b$10$mC/0r2k.5I.u5QvAOH.L.ORn./6Ea28bZzD6P6p./8/S5B.2U2IHe', 
    'admin', 
    'active'
);
