-- Create database
CREATE DATABASE IF NOT EXISTS gold_assay_system;
USE gold_assay_system;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    id_type VARCHAR(50),
    id_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Assay reports table
CREATE TABLE assay_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    customer_id INT NOT NULL,
    metal_type VARCHAR(50) DEFAULT 'Gold',
    fineness DECIMAL(5,2) NOT NULL,
    weight VARCHAR(50) NOT NULL,
    serial_no VARCHAR(100) NOT NULL,
    assay_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Insert sample admin user (password: password)
INSERT INTO users (username, email, password, full_name) VALUES 
('admin', 'admin@goldassay.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator');

-- Insert sample customer
INSERT INTO customers (user_id, name, phone, email, address, id_type, id_number) VALUES 
(1, 'Shakeover', '+1234567890', 'shakeover@example.com', 'R.C Street, Marchandam', 'Passport', 'AB123456');

-- Insert sample assay report
INSERT INTO assay_reports (user_id, customer_id, metal_type, fineness, weight, serial_no, assay_date) VALUES 
(1, 1, 'Gold', 91.70, '0.50 ml', '8601', '2025-01-23');