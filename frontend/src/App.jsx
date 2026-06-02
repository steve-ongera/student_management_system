// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Auth Pages
import Login from './pages/auth/Login';
import Unauthorized from './pages/Unauthorized';

// Dashboard
import Dashboard from './pages/Dashboard/Dashboard';

// Library Module
import BooksList from './pages/Library/BooksList';
import BorrowingsList from './pages/Library/BorrowingsList';
import ReturnsList from './pages/Library/ReturnsList';
import FinesList from './pages/Library/FinesList';

// Human Resources Module
import EmployeesList from './pages/HumanResources/EmployeesList';
import PayrollList from './pages/HumanResources/PayrollList';
import LeaveRequests from './pages/HumanResources/LeaveRequests';
import PerformanceReviews from './pages/HumanResources/PerformanceReviews';

// Procurement Module
import RequisitionsList from './pages/Procurement/RequisitionsList';
import SuppliersList from './pages/Procurement/SuppliersList';
import PurchaseOrdersList from './pages/Procurement/PurchaseOrdersList';
import ApprovalsList from './pages/Procurement/ApprovalsList';

// Inventory Module
import StockItemsList from './pages/Inventory/StockItemsList';
import StockInForm from './pages/Inventory/StockInForm';
import StockOutForm from './pages/Inventory/StockOutForm';
import InventoryReports from './pages/Inventory/InventoryReports';

// Health Center Module
import MedicalRecordsList from './pages/HealthCenter/MedicalRecordsList';
import ClinicVisitsList from './pages/HealthCenter/ClinicVisitsList';
import EmergencyContactsList from './pages/HealthCenter/EmergencyContactsList';

// Transport Module
import VehiclesList from './pages/Transport/VehiclesList';
import RoutesList from './pages/Transport/RoutesList';
import StudentAssignments from './pages/Transport/StudentAssignments';
import GPSMonitoring from './pages/Transport/GPSMonitoring';

// Assets Module
import AssetsList from './pages/Assets/AssetsList';
import MaintenanceList from './pages/Assets/MaintenanceList';
import DepreciationReport from './pages/Assets/DepreciationReport';
import AssetReports from './pages/Assets/AssetReports';

import './styles/main.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Update current page title based on route
    const path = location.pathname;
    const pageName = path.split('/').filter(Boolean).pop() || 'Dashboard';
    const formattedName = pageName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    setCurrentPage(formattedName || 'Dashboard');
  }, [location]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // If not authenticated, don't show sidebar/navbar
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} />
      <div className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
        <Navbar toggleSidebar={toggleSidebar} currentPage={currentPage} />
        
        <Routes>
          {/* Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Library Routes */}
          <Route path="/library/books" element={<BooksList />} />
          <Route path="/library/borrowing" element={<BorrowingsList />} />
          <Route path="/library/returns" element={<ReturnsList />} />
          <Route path="/library/fines" element={<FinesList />} />

          {/* Human Resources Routes */}
          <Route path="/hr/employees" element={<EmployeesList />} />
          <Route path="/hr/payroll" element={<PayrollList />} />
          <Route path="/hr/leave" element={<LeaveRequests />} />
          <Route path="/hr/performance" element={<PerformanceReviews />} />

          {/* Procurement Routes */}
          <Route path="/procurement/requisitions" element={<RequisitionsList />} />
          <Route path="/procurement/suppliers" element={<SuppliersList />} />
          <Route path="/procurement/orders" element={<PurchaseOrdersList />} />
          <Route path="/procurement/approvals" element={<ApprovalsList />} />

          {/* Inventory Routes */}
          <Route path="/inventory/items" element={<StockItemsList />} />
          <Route path="/inventory/stock-in" element={<StockInForm />} />
          <Route path="/inventory/stock-out" element={<StockOutForm />} />
          <Route path="/inventory/reports" element={<InventoryReports />} />

          {/* Health Center Routes */}
          <Route path="/health/records" element={<MedicalRecordsList />} />
          <Route path="/health/visits" element={<ClinicVisitsList />} />
          <Route path="/health/emergency" element={<EmergencyContactsList />} />

          {/* Transport Routes */}
          <Route path="/transport/vehicles" element={<VehiclesList />} />
          <Route path="/transport/routes" element={<RoutesList />} />
          <Route path="/transport/students" element={<StudentAssignments />} />
          <Route path="/transport/gps" element={<GPSMonitoring />} />

          {/* Assets Routes */}
          <Route path="/assets/register" element={<AssetsList />} />
          <Route path="/assets/maintenance" element={<MaintenanceList />} />
          <Route path="/assets/depreciation" element={<DepreciationReport />} />
          <Route path="/assets/reports" element={<AssetReports />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppContent />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;