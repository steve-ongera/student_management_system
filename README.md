# Student Management System

A comprehensive Student Management System built with **React**, **Node.js**, and **PostgreSQL** to manage various university and institutional operations from a centralized dashboard.

---

## Project Structure

```text
students-management-system/
├── frontend/                       
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   └── Navbar.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Library.jsx
│   │   │   ├── HumanResources.jsx
│   │   │   ├── Procurement.jsx
│   │   │   ├── Inventory.jsx
│   │   │   ├── HealthCenter.jsx
│   │   │   ├── Transport.jsx
│   │   │   └── Assets.jsx
│   │   ├── styles/
│   │   │   └── main.css
│   │   ├── App.jsx
│   │   └── index.js
│   └── package.json
│
├── backend/                        
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── config/
│   ├── server.js
│   └── package.json
│
└── database/                       
    └── schema.sql
```

---

## Features

###  Library Management

- Books Management
- Borrowing System
- Returns Processing
- Fines Management

### Human Resources

- Employee Management
- Payroll Processing
- Leave Management
- Performance Reviews

###  Procurement

- Requisitions Management
- Supplier Management
- Purchase Orders
- Approval Workflow

###  Inventory

- Stock Items Tracking
- Stock In/Out Management
- Inventory Reports

###  Health Center

- Medical Records
- Clinic Visits Tracking
- Emergency Contacts

### Transport

- Vehicle Management
- Route Management
- Student Transport
- GPS Tracking

###  Assets

- Asset Register
- Maintenance Scheduling
- Depreciation Tracking
- Asset Reports

---

## Technology Stack

### Frontend

- React.js
- React Router
- Axios
- CSS3

### Backend

- Node.js
- Express.js
- JWT Authentication
- REST API

### Database

- PostgreSQL

---

## Prerequisites

Before running the project, ensure you have:

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn package manager
- Git

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd students-management-system
```

### 2. Setup Backend

```bash
cd backend

npm install
```

Create a `.env` file:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=students_management
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_secret_key
```

Start the backend server:

```bash
npm run dev
```

---

### 3. Setup Frontend

```bash
cd ../frontend

npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend server:

```bash
npm run dev
```

---

### 4. Setup PostgreSQL Database

Create a database:

```sql
CREATE DATABASE students_management;
```

Run the schema file:

```bash
psql -U postgres -d students_management -f database/schema.sql
```

---

## API Endpoints

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

### Students

```http
GET    /api/students
GET    /api/students/:id
POST   /api/students
PUT    /api/students/:id
DELETE /api/students/:id
```

### Library

```http
GET    /api/library/books
POST   /api/library/books
PUT    /api/library/books/:id
DELETE /api/library/books/:id
```

### Human Resources

```http
GET    /api/hr/employees
POST   /api/hr/employees
PUT    /api/hr/employees/:id
DELETE /api/hr/employees/:id
```

---

## Development Scripts

### Backend

```bash
npm run dev
npm start
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
```

---

## Security Features

- JWT Authentication
- Password Hashing
- Role-Based Access Control
- Protected Routes
- Environment Variable Management
- CORS Protection

---

## Future Enhancements

- Student Portal
- Online Fee Payment
- Attendance Tracking
- Examination Management
- SMS Notifications
- Email Notifications
- Mobile Application
- Analytics Dashboard

---

## Contributing

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/new-feature
```

3. Commit changes

```bash
git commit -m "Add new feature"
```

4. Push to GitHub

```bash
git push origin feature/new-feature
```

5. Create a Pull Request

---

## License

This project is licensed under the MIT License.

---

## Author

**Stephen Ongera**

- Software Developer
- +254112284093
- steveongera001@gmail.com
