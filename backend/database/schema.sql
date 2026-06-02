-- database/schema.sql

-- Create database
CREATE DATABASE students_management;

\c students_management;

-- Students table
CREATE TABLE students (
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
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Books table
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(200),
    isbn VARCHAR(50) UNIQUE,
    category VARCHAR(100),
    publisher VARCHAR(200),
    publication_year INTEGER,
    total_copies INTEGER DEFAULT 1,
    available_copies INTEGER DEFAULT 1,
    description TEXT,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Borrowings table
CREATE TABLE borrowings (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    book_id INTEGER REFERENCES books(id),
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fines table
CREATE TABLE fines (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    borrowing_id INTEGER REFERENCES borrowings(id),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    paid_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees table
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(20),
    position VARCHAR(100),
    department_id INTEGER REFERENCES departments(id),
    hire_date DATE,
    salary DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave types table
CREATE TABLE leave_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    days_allowed INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave requests table
CREATE TABLE leave_requests (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    leave_type_id INTEGER REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    approval_comment TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payroll table
CREATE TABLE payroll (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    payroll_month DATE NOT NULL,
    basic_salary DECIMAL(10,2) NOT NULL,
    allowances DECIMAL(10,2) DEFAULT 0,
    deductions DECIMAL(10,2) DEFAULT 0,
    net_pay DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    paid_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance reviews table
CREATE TABLE performance_reviews (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    reviewer_id INTEGER REFERENCES employees(id),
    review_date DATE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    goals TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(200),
    email VARCHAR(200),
    phone VARCHAR(20),
    address TEXT,
    tax_id VARCHAR(50),
    payment_terms VARCHAR(50),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase orders table
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id),
    order_date DATE NOT NULL,
    delivery_date DATE,
    total_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock items table
CREATE TABLE stock_items (
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock movements table
CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    stock_item_id INTEGER REFERENCES stock_items(id),
    movement_type VARCHAR(20) CHECK (movement_type IN ('in', 'out')),
    quantity INTEGER NOT NULL,
    reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clinic visits table
CREATE TABLE clinic_visits (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    visit_date DATE NOT NULL,
    symptoms TEXT,
    diagnosis VARCHAR(200),
    treatment TEXT,
    referred BOOLEAN DEFAULT FALSE,
    referred_to VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medical records table
CREATE TABLE medical_records (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    record_type VARCHAR(100),
    diagnosis TEXT,
    prescription TEXT,
    doctor_name VARCHAR(200),
    record_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emergency contacts table
CREATE TABLE emergency_contacts (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    name VARCHAR(200) NOT NULL,
    relationship VARCHAR(50),
    phone VARCHAR(20),
    alternate_phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    model VARCHAR(100),
    capacity INTEGER,
    driver_name VARCHAR(200),
    driver_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Routes table
CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_point VARCHAR(200),
    end_point VARCHAR(200),
    distance DECIMAL(10,2),
    duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student transport assignments table
CREATE TABLE student_transport (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    route_id INTEGER REFERENCES routes(id),
    pickup_point VARCHAR(200),
    pickup_time TIME,
    dropoff_time TIME,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assets table
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    asset_tag VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    purchase_date DATE,
    purchase_cost DECIMAL(10,2),
    current_value DECIMAL(10,2),
    location VARCHAR(200),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance records table
CREATE TABLE maintenance_records (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id),
    maintenance_date DATE NOT NULL,
    maintenance_type VARCHAR(100),
    cost DECIMAL(10,2),
    description TEXT,
    performed_by VARCHAR(200),
    next_maintenance_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO departments (name) VALUES 
('Administration'), ('Academic'), ('Finance'), ('ICT'), ('Transport'), ('Health');

INSERT INTO leave_types (name, days_allowed) VALUES 
('Annual Leave', 21), ('Sick Leave', 30), ('Maternity Leave', 90), ('Paternity Leave', 14), ('Compassionate Leave', 5);

-- Create indexes for better performance
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_borrowings_student ON borrowings(student_id);
CREATE INDEX idx_borrowings_book ON borrowings(book_id);
CREATE INDEX idx_borrowings_return ON borrowings(return_date);
CREATE INDEX idx_employees_name ON employees(name);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_stock_items_name ON stock_items(name);
CREATE INDEX idx_clinic_visits_date ON clinic_visits(visit_date);
CREATE INDEX idx_vehicles_registration ON vehicles(registration_number);