-- database/schema.sql
-- Students Management System Database Schema
-- Author: Steve Ongera
-- Version: 1.0.0

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS student_transport CASCADE;
DROP TABLE IF EXISTS route_stops CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS vehicle_maintenance CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS clinic_visits CASCADE;
DROP TABLE IF EXISTS emergency_contacts CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS stock_items CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS requisition_items CASCADE;
DROP TABLE IF EXISTS requisitions CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS performance_reviews CASCADE;
DROP TABLE IF EXISTS payroll CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS leave_types CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS fines CASCADE;
DROP TABLE IF EXISTS borrowings CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS student_parents CASCADE;
DROP TABLE IF EXISTS parents CASCADE;
DROP TABLE IF EXISTS academic_records CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS fee_payments CASCADE;
DROP TABLE IF EXISTS fee_records CASCADE;
DROP TABLE IF EXISTS student_documents CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS gps_locations CASCADE;
DROP TABLE IF EXISTS gps_location_history CASCADE;

-- ============================================
-- 1. USERS & AUTHENTICATION TABLES
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    last_login TIMESTAMP,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. STUDENT MANAGEMENT TABLES
-- ============================================

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    admission_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    gender VARCHAR(10),
    class VARCHAR(50),
    parent_name VARCHAR(200),
    parent_phone VARCHAR(20),
    parent_email VARCHAR(200),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parents table
CREATE TABLE IF NOT EXISTS parents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Parents junction table
CREATE TABLE IF NOT EXISTS student_parents (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES parents(id) ON DELETE CASCADE,
    relationship VARCHAR(50),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, parent_id)
);

-- Academic records table
CREATE TABLE IF NOT EXISTS academic_records (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    term VARCHAR(20),
    year INTEGER,
    subjects JSONB,
    total_marks DECIMAL(10,2),
    average DECIMAL(5,2),
    grade VARCHAR(5),
    position INTEGER,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, date)
);

-- Fee records table
CREATE TABLE IF NOT EXISTS fee_records (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    term VARCHAR(20),
    year INTEGER,
    amount DECIMAL(10,2) NOT NULL,
    paid DECIMAL(10,2) DEFAULT 0,
    balance DECIMAL(10,2),
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fee payments table
CREATE TABLE IF NOT EXISTS fee_payments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    fee_record_id INTEGER REFERENCES fee_records(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    payment_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student documents table
CREATE TABLE IF NOT EXISTS student_documents (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    document_type VARCHAR(100),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_url TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. LIBRARY MANAGEMENT TABLES
-- ============================================

-- Books table
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(200),
    isbn VARCHAR(50) UNIQUE,
    category VARCHAR(100),
    publisher VARCHAR(200),
    publication_year INTEGER,
    edition VARCHAR(50),
    pages INTEGER,
    language VARCHAR(50) DEFAULT 'English',
    total_copies INTEGER DEFAULT 1,
    available_copies INTEGER DEFAULT 1,
    description TEXT,
    location VARCHAR(100),
    shelf_number VARCHAR(50),
    rack_number VARCHAR(50),
    status VARCHAR(20) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Borrowings table
CREATE TABLE IF NOT EXISTS borrowings (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    book_id INTEGER REFERENCES books(id),
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fines table
CREATE TABLE IF NOT EXISTS fines (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    borrowing_id INTEGER REFERENCES borrowings(id),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    paid_date DATE,
    waived_reason TEXT,
    waived_by INTEGER REFERENCES users(id),
    waived_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. HUMAN RESOURCES TABLES
-- ============================================

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    head_of_department INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    gender VARCHAR(10),
    position VARCHAR(100),
    department_id INTEGER REFERENCES departments(id),
    hire_date DATE,
    salary DECIMAL(10,2),
    bank_name VARCHAR(100),
    bank_account VARCHAR(50),
    bank_branch VARCHAR(100),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave types table
CREATE TABLE IF NOT EXISTS leave_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    days_allowed INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave requests table
CREATE TABLE IF NOT EXISTS leave_requests (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    leave_type_id INTEGER REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    approval_comment TEXT,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payroll table
CREATE TABLE IF NOT EXISTS payroll (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    payroll_month DATE NOT NULL,
    basic_salary DECIMAL(10,2) NOT NULL,
    allowances DECIMAL(10,2) DEFAULT 0,
    deductions DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    net_pay DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    paid_date DATE,
    payment_reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance reviews table
CREATE TABLE IF NOT EXISTS performance_reviews (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    reviewer_id INTEGER REFERENCES employees(id),
    review_date DATE NOT NULL,
    review_period_start DATE,
    review_period_end DATE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    goals TEXT,
    strengths TEXT,
    areas_for_improvement TEXT,
    overall_assessment TEXT,
    recommendations TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. PROCUREMENT TABLES
-- ============================================

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(200),
    email VARCHAR(200),
    phone VARCHAR(20),
    address TEXT,
    tax_id VARCHAR(50),
    payment_terms VARCHAR(50),
    category VARCHAR(100),
    rating DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Requisitions table
CREATE TABLE IF NOT EXISTS requisitions (
    id SERIAL PRIMARY KEY,
    requisition_number VARCHAR(50) UNIQUE NOT NULL,
    department_id INTEGER REFERENCES departments(id),
    requested_by INTEGER REFERENCES users(id),
    request_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    approval_comment TEXT,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Requisition items table
CREATE TABLE IF NOT EXISTS requisition_items (
    id SERIAL PRIMARY KEY,
    requisition_id INTEGER REFERENCES requisitions(id) ON DELETE CASCADE,
    item_name VARCHAR(200) NOT NULL,
    quantity INTEGER NOT NULL,
    estimated_cost DECIMAL(10,2),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id),
    order_date DATE NOT NULL,
    delivery_date DATE,
    total_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    received_at TIMESTAMP,
    cancellation_reason TEXT,
    cancelled_by INTEGER REFERENCES users(id),
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase order items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_name VARCHAR(200) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. INVENTORY TABLES
-- ============================================

-- Stock items table
CREATE TABLE IF NOT EXISTS stock_items (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    quantity INTEGER DEFAULT 0,
    unit VARCHAR(20),
    unit_price DECIMAL(10,2),
    reorder_level INTEGER DEFAULT 0,
    description TEXT,
    location VARCHAR(100),
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock categories table
CREATE TABLE IF NOT EXISTS stock_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock movements table
CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    stock_item_id INTEGER REFERENCES stock_items(id),
    movement_type VARCHAR(20) CHECK (movement_type IN ('in', 'out', 'return', 'adjustment', 'damaged')),
    quantity INTEGER NOT NULL,
    reference VARCHAR(100),
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. HEALTH CENTER TABLES
-- ============================================

-- Medical records table
CREATE TABLE IF NOT EXISTS medical_records (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    record_type VARCHAR(100),
    diagnosis TEXT,
    prescription TEXT,
    doctor_name VARCHAR(200),
    record_date DATE NOT NULL,
    notes TEXT,
    attachments JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clinic visits table
CREATE TABLE IF NOT EXISTS clinic_visits (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    visit_date DATE NOT NULL,
    symptoms TEXT,
    diagnosis VARCHAR(200),
    treatment TEXT,
    referred BOOLEAN DEFAULT FALSE,
    referred_to VARCHAR(200),
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    clinic_visit_id INTEGER REFERENCES clinic_visits(id),
    medication VARCHAR(200) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emergency contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    name VARCHAR(200) NOT NULL,
    relationship VARCHAR(50),
    phone VARCHAR(20),
    alternate_phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. TRANSPORT TABLES
-- ============================================

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    model VARCHAR(100),
    capacity INTEGER,
    driver_id INTEGER,
    driver_name VARCHAR(200),
    driver_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    license_number VARCHAR(50) UNIQUE,
    phone VARCHAR(20),
    email VARCHAR(200),
    address TEXT,
    hire_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_point VARCHAR(200),
    end_point VARCHAR(200),
    distance DECIMAL(10,2),
    duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Route stops table
CREATE TABLE IF NOT EXISTS route_stops (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
    stop_name VARCHAR(200) NOT NULL,
    stop_order INTEGER NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    estimated_time INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student transport assignments table
CREATE TABLE IF NOT EXISTS student_transport (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    route_id INTEGER REFERENCES routes(id),
    pickup_point VARCHAR(200),
    pickup_time TIME,
    dropoff_time TIME,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GPS locations table
CREATE TABLE IF NOT EXISTS gps_locations (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id) UNIQUE,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    speed DECIMAL(5,2),
    heading INTEGER,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GPS location history table
CREATE TABLE IF NOT EXISTS gps_location_history (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    speed DECIMAL(5,2),
    heading INTEGER,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle maintenance table
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    maintenance_date DATE NOT NULL,
    maintenance_type VARCHAR(100),
    cost DECIMAL(10,2),
    description TEXT,
    performed_by VARCHAR(200),
    next_maintenance_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 9. ASSETS TABLES
-- ============================================

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    asset_tag VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    purchase_date DATE,
    purchase_cost DECIMAL(10,2),
    current_value DECIMAL(10,2),
    location VARCHAR(200),
    status VARCHAR(20) DEFAULT 'active',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asset categories table
CREATE TABLE IF NOT EXISTS asset_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    depreciation_rate DECIMAL(5,2),
    useful_life_years INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance records table
CREATE TABLE IF NOT EXISTS maintenance_records (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id),
    maintenance_date DATE NOT NULL,
    maintenance_type VARCHAR(100),
    cost DECIMAL(10,2),
    description TEXT,
    performed_by VARCHAR(200),
    next_maintenance_date DATE,
    completion_date DATE,
    completion_notes TEXT,
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Depreciation records table
CREATE TABLE IF NOT EXISTS depreciation_records (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id),
    depreciation_date DATE NOT NULL,
    depreciation_amount DECIMAL(10,2),
    accumulated_depreciation DECIMAL(10,2),
    book_value DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. INSERT SAMPLE DATA
-- ============================================

-- Insert departments
INSERT INTO departments (name, description) VALUES 
('Administration', 'School administration and management'),
('Academic', 'Academic affairs and curriculum'),
('Finance', 'Financial management and accounting'),
('ICT', 'Information and communication technology'),
('Transport', 'School transport and fleet management'),
('Health', 'School health center and medical services'),
('Human Resources', 'Staff management and recruitment'),
('Procurement', 'Purchasing and supply chain'),
('Library', 'Library services and resources'),
('Maintenance', 'Facilities and equipment maintenance')
ON CONFLICT (name) DO NOTHING;

-- Insert leave types
INSERT INTO leave_types (name, days_allowed, description) VALUES 
('Annual Leave', 21, 'Regular annual vacation leave'),
('Sick Leave', 30, 'Medical and health-related leave'),
('Maternity Leave', 90, 'Maternity leave for new mothers'),
('Paternity Leave', 14, 'Paternity leave for new fathers'),
('Compassionate Leave', 5, 'Bereavement and family emergency leave'),
('Study Leave', 30, 'Educational and professional development leave'),
('Unpaid Leave', 0, 'Leave without pay')
ON CONFLICT (name) DO NOTHING;

-- Insert stock categories
INSERT INTO stock_categories (name, description) VALUES 
('Stationery', 'Office and school stationery supplies'),
('Electronics', 'Electronic devices and equipment'),
('Furniture', 'Office and classroom furniture'),
('Cleaning Supplies', 'Cleaning materials and equipment'),
('Uniforms', 'School uniforms and attire')
ON CONFLICT (name) DO NOTHING;

-- Insert asset categories
INSERT INTO asset_categories (name, depreciation_rate, useful_life_years, description) VALUES 
('ICT Equipment', 30.00, 3, 'Computers, printers, and IT equipment'),
('Furniture', 10.00, 10, 'Office and classroom furniture'),
('Vehicles', 20.00, 5, 'School buses and vehicles'),
('Buildings', 2.00, 50, 'School buildings and structures'),
('Office Equipment', 15.00, 7, 'Office machines and equipment')
ON CONFLICT (name) DO NOTHING;

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES 
('school_name', 'StudentSys Academy', 'string', 'Name of the school'),
('school_phone', '+254 700 000 000', 'string', 'School contact phone number'),
('school_email', 'info@studentsys.com', 'string', 'School email address'),
('school_address', '123 Education Lane, Nairobi, Kenya', 'string', 'School physical address'),
('max_borrow_limit', '5', 'integer', 'Maximum number of books a student can borrow'),
('fine_per_day', '50', 'decimal', 'Fine amount per day for overdue books'),
('academic_year', '2024', 'string', 'Current academic year')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- 11. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Students indexes
CREATE INDEX IF NOT EXISTS idx_students_admission ON students(admission_number);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

-- Books indexes
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);

-- Borrowings indexes
CREATE INDEX IF NOT EXISTS idx_borrowings_student ON borrowings(student_id);
CREATE INDEX IF NOT EXISTS idx_borrowings_book ON borrowings(book_id);
CREATE INDEX IF NOT EXISTS idx_borrowings_dates ON borrowings(borrow_date, due_date, return_date);
CREATE INDEX IF NOT EXISTS idx_borrowings_status ON borrowings(status);

-- Employees indexes
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- Leave requests indexes
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);

-- Payroll indexes
CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_month ON payroll(payroll_month);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status);

-- Stock items indexes
CREATE INDEX IF NOT EXISTS idx_stock_items_sku ON stock_items(sku);
CREATE INDEX IF NOT EXISTS idx_stock_items_name ON stock_items(name);
CREATE INDEX IF NOT EXISTS idx_stock_items_category ON stock_items(category);
CREATE INDEX IF NOT EXISTS idx_stock_items_quantity ON stock_items(quantity, reorder_level);

-- Stock movements indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(stock_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);

-- Clinic visits indexes
CREATE INDEX IF NOT EXISTS idx_clinic_visits_student ON clinic_visits(student_id);
CREATE INDEX IF NOT EXISTS idx_clinic_visits_date ON clinic_visits(visit_date);

-- Vehicles indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- Student transport indexes
CREATE INDEX IF NOT EXISTS idx_student_transport_student ON student_transport(student_id);
CREATE INDEX IF NOT EXISTS idx_student_transport_vehicle ON student_transport(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_student_transport_route ON student_transport(route_id);
CREATE INDEX IF NOT EXISTS idx_student_transport_status ON student_transport(status);

-- Assets indexes
CREATE INDEX IF NOT EXISTS idx_assets_tag ON assets(asset_tag);
CREATE INDEX IF NOT EXISTS idx_assets_name ON assets(name);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);

-- Maintenance records indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_asset ON maintenance_records(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON maintenance_records(maintenance_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_next_date ON maintenance_records(next_maintenance_date);

-- GPS locations indexes
CREATE INDEX IF NOT EXISTS idx_gps_vehicle ON gps_locations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_gps_history_vehicle ON gps_location_history(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_gps_history_time ON gps_location_history(recorded_at);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_logs(created_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(created_at);

-- ============================================
-- 12. CREATE VIEWS FOR COMMON QUERIES
-- ============================================

-- Active borrowings view
CREATE OR REPLACE VIEW active_borrowings AS
SELECT 
    b.id,
    s.name AS student_name,
    s.admission_number,
    bk.title AS book_title,
    bk.author AS book_author,
    b.borrow_date,
    b.due_date,
    CASE WHEN b.due_date < CURRENT_DATE THEN true ELSE false END AS is_overdue,
    (CURRENT_DATE - b.borrow_date) AS days_borrowed
FROM borrowings b
JOIN students s ON b.student_id = s.id
JOIN books bk ON b.book_id = bk.id
WHERE b.return_date IS NULL;

-- Employee summary view
CREATE OR REPLACE VIEW employee_summary AS
SELECT 
    e.id,
    e.employee_id,
    e.name,
    e.position,
    d.name AS department,
    e.status,
    COUNT(DISTINCT lr.id) AS leave_requests,
    COUNT(DISTINCT pr.id) AS performance_reviews
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN leave_requests lr ON e.id = lr.employee_id
LEFT JOIN performance_reviews pr ON e.id = pr.employee_id
GROUP BY e.id, e.employee_id, e.name, e.position, d.name, e.status;

-- Stock summary view
CREATE OR REPLACE VIEW stock_summary AS
SELECT 
    category,
    COUNT(*) AS total_items,
    SUM(quantity) AS total_quantity,
    SUM(quantity * unit_price) AS total_value,
    COUNT(CASE WHEN quantity <= reorder_level THEN 1 END) AS low_stock_items
FROM stock_items
GROUP BY category;