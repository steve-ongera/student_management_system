// frontend/src/services/api.js
import axios from 'axios';

// Make sure API_BASE_URL includes /api prefix
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // Set to true if using cookies for auth
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
        case 403:
          console.error('Forbidden: You do not have permission to access this resource');
          break;
        case 404:
          console.error(`Resource not found: ${error.config?.url}`);
          break;
        case 422:
          console.error('Validation error:', data?.errors);
          break;
        case 500:
          console.error('Server error occurred');
          break;
        default:
          console.error(`API Error ${status}:`, data?.message || 'Unknown error');
      }
      
      return Promise.reject({
        status,
        message: data?.message || 'An error occurred',
        data: data,
        errors: data?.errors || null
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error: No response from server. Make sure backend is running on port 5000');
      return Promise.reject({
        status: 0,
        message: 'Network error. Please check if the backend server is running on http://localhost:5000',
        data: null
      });
    } else {
      // Something else happened
      console.error('Error:', error.message);
      return Promise.reject({
        status: -1,
        message: error.message || 'An unexpected error occurred',
        data: null
      });
    }
  }
);

// ==================== AUTHENTICATION API ====================
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

// ==================== STUDENTS API ====================
export const studentsAPI = {
  getStudents: (params) => api.get('/students', { params }),
  getStudent: (id) => api.get(`/students/${id}`),
  getStudentByAdmission: (admissionNumber) => api.get(`/students/admission/${admissionNumber}`),
  createStudent: (data) => api.post('/students', data),
  updateStudent: (id, data) => api.put(`/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/students/${id}`),
  getStudentStats: () => api.get('/students/stats'),
  getStudentsByClass: (className) => api.get(`/students/class/${className}`),
  searchStudents: (query) => api.get(`/students/search/${query}`),
  
  // Academic Records
  getAcademicRecords: (studentId) => api.get(`/students/${studentId}/academic-records`),
  addAcademicRecord: (studentId, data) => api.post(`/students/${studentId}/academic-records`, data),
  
  // Attendance
  getAttendance: (studentId, params) => api.get(`/students/${studentId}/attendance`, { params }),
  markAttendance: (studentId, data) => api.post(`/students/${studentId}/attendance`, data),
  
  // Fees
  getFeeRecords: (studentId) => api.get(`/students/${studentId}/fees`),
  payFees: (studentId, data) => api.post(`/students/${studentId}/fees/pay`, data),
  getFeeBalance: (studentId) => api.get(`/students/${studentId}/fees/balance`),
  
  // Parents
  getParents: (studentId) => api.get(`/students/${studentId}/parents`),
  addParent: (studentId, data) => api.post(`/students/${studentId}/parents`, data),
};

// ==================== LIBRARY API ====================
export const libraryAPI = {
  // Books
  getBooks: (params) => api.get('/library/books', { params }),
  getBook: (id) => api.get(`/library/books/${id}`),
  getBookByISBN: (isbn) => api.get(`/library/books/isbn/${isbn}`),
  createBook: (data) => api.post('/library/books', data),
  updateBook: (id, data) => api.put(`/library/books/${id}`, data),
  deleteBook: (id) => api.delete(`/library/books/${id}`),
  searchBooks: (query) => api.get('/library/books/search', { params: { q: query } }),
  getBookCategories: () => api.get('/library/books/categories'),
  getBookStats: () => api.get('/library/books/stats'),
  
  // Borrowing
  getBorrowings: (params) => api.get('/library/borrowing', { params }),
  getBorrowing: (id) => api.get(`/library/borrowing/${id}`),
  createBorrowing: (data) => api.post('/library/borrowing', data),
  getActiveBorrowings: () => api.get('/library/borrowing/active'),
  getStudentBorrowings: (studentId) => api.get(`/library/borrowing/student/${studentId}`),
  
  // Returns
  returnBook: (id) => api.post(`/library/returns/${id}`),
  getReturns: (params) => api.get('/library/returns', { params }),
  
  // Fines
  getFines: (params) => api.get('/library/fines', { params }),
  getStudentFines: (studentId) => api.get(`/library/fines/student/${studentId}`),
  payFine: (id, data) => api.post(`/library/fines/${id}/pay`, data),
  waiveFine: (id, reason) => api.post(`/library/fines/${id}/waive`, { reason }),
  getFineSummary: () => api.get('/library/fines/summary'),
  
  // Reports
  getLibraryReport: (type, params) => api.get(`/library/reports/${type}`, { params }),
};

// ==================== HUMAN RESOURCES API ====================
export const hrAPI = {
  // Employees
  getEmployees: (params) => api.get('/hr/employees', { params }),
  getEmployee: (id) => api.get(`/hr/employees/${id}`),
  getEmployeeByEmployeeId: (employeeId) => api.get(`/hr/employees/employee/${employeeId}`),
  createEmployee: (data) => api.post('/hr/employees', data),
  updateEmployee: (id, data) => api.put(`/hr/employees/${id}`, data),
  deleteEmployee: (id) => api.delete(`/hr/employees/${id}`),
  getEmployeeStats: () => api.get('/hr/employees/stats'),
  
  // Departments
  getDepartments: () => api.get('/hr/departments'),
  createDepartment: (data) => api.post('/hr/departments', data),
  
  // Payroll
  getPayroll: (params) => api.get('/hr/payroll', { params }),
  getPayrollById: (id) => api.get(`/hr/payroll/${id}`),
  generatePayroll: (data) => api.post('/hr/payroll/generate', data),
  processPayroll: (id) => api.post(`/hr/payroll/${id}/process`),
  getPayrollReports: (params) => api.get('/hr/payroll/reports', { params }),
  
  // Leave Management
  getLeaveRequests: (params) => api.get('/hr/leave', { params }),
  getLeaveRequest: (id) => api.get(`/hr/leave/${id}`),
  createLeaveRequest: (data) => api.post('/hr/leave', data),
  updateLeaveRequest: (id, data) => api.put(`/hr/leave/${id}`, data),
  approveLeave: (id, comment) => api.post(`/hr/leave/${id}/approve`, { comment }),
  rejectLeave: (id, comment) => api.post(`/hr/leave/${id}/reject`, { comment }),
  getLeaveBalance: (employeeId) => api.get(`/hr/leave/balance/${employeeId}`),
  getLeaveTypes: () => api.get('/hr/leave/types'),
  
  // Performance Reviews
  getPerformanceReviews: (params) => api.get('/hr/performance', { params }),
  getPerformanceReview: (id) => api.get(`/hr/performance/${id}`),
  createReview: (data) => api.post('/hr/performance', data),
  updateReview: (id, data) => api.put(`/hr/performance/${id}`, data),
  submitReview: (id) => api.post(`/hr/performance/${id}/submit`),
  getEmployeeReviews: (employeeId) => api.get(`/hr/performance/employee/${employeeId}`),
};

// ==================== PROCUREMENT API ====================
export const procurementAPI = {
  // Requisitions
  getRequisitions: (params) => api.get('/procurement/requisitions', { params }),
  getRequisition: (id) => api.get(`/procurement/requisitions/${id}`),
  createRequisition: (data) => api.post('/procurement/requisitions', data),
  updateRequisition: (id, data) => api.put(`/procurement/requisitions/${id}`, data),
  approveRequisition: (id, comment) => api.post(`/procurement/requisitions/${id}/approve`, { comment }),
  rejectRequisition: (id, comment) => api.post(`/procurement/requisitions/${id}/reject`, { comment }),
  
  // Suppliers
  getSuppliers: (params) => api.get('/procurement/suppliers', { params }),
  getSupplier: (id) => api.get(`/procurement/suppliers/${id}`),
  createSupplier: (data) => api.post('/procurement/suppliers', data),
  updateSupplier: (id, data) => api.put(`/procurement/suppliers/${id}`, data),
  deleteSupplier: (id) => api.delete(`/procurement/suppliers/${id}`),
  getSupplierPerformance: (id) => api.get(`/procurement/suppliers/${id}/performance`),
  
  // Purchase Orders
  getPurchaseOrders: (params) => api.get('/procurement/orders', { params }),
  getPurchaseOrder: (id) => api.get(`/procurement/orders/${id}`),
  createPurchaseOrder: (data) => api.post('/procurement/orders', data),
  updatePurchaseOrder: (id, data) => api.put(`/procurement/orders/${id}`, data),
  approvePurchaseOrder: (id) => api.post(`/procurement/orders/${id}/approve`),
  receiveOrder: (id, data) => api.post(`/procurement/orders/${id}/receive`, data),
  cancelPurchaseOrder: (id, reason) => api.post(`/procurement/orders/${id}/cancel`, { reason }),
  
  // Approvals
  getPendingApprovals: () => api.get('/procurement/approvals/pending'),
  getApprovalHistory: (params) => api.get('/procurement/approvals/history', { params }),
  approve: (id, data) => api.post(`/procurement/approvals/${id}/approve`, data),
  reject: (id, data) => api.post(`/procurement/approvals/${id}/reject`, data),
};

// ==================== INVENTORY API ====================
export const inventoryAPI = {
  // Stock Items
  getStockItems: (params) => api.get('/inventory/items', { params }),
  getStockItem: (id) => api.get(`/inventory/items/${id}`),
  createStockItem: (data) => api.post('/inventory/items', data),
  updateStockItem: (id, data) => api.put(`/inventory/items/${id}`, data),
  deleteStockItem: (id) => api.delete(`/inventory/items/${id}`),
  getLowStockItems: () => api.get('/inventory/items/low-stock'),
  getExpiringItems: () => api.get('/inventory/items/expiring'),
  
  // Categories
  getCategories: () => api.get('/inventory/categories'),
  createCategory: (data) => api.post('/inventory/categories', data),
  
  // Stock In
  getStockInRecords: (params) => api.get('/inventory/stock-in', { params }),
  addStock: (data) => api.post('/inventory/stock-in', data),
  getStockInById: (id) => api.get(`/inventory/stock-in/${id}`),
  
  // Stock Out
  getStockOutRecords: (params) => api.get('/inventory/stock-out', { params }),
  removeStock: (data) => api.post('/inventory/stock-out', data),
  getStockOutById: (id) => api.get(`/inventory/stock-out/${id}`),
  
  // Reports
  getInventoryReports: (params) => api.get('/inventory/reports', { params }),
  getStockValueReport: () => api.get('/inventory/reports/stock-value'),
  getMovementReport: (params) => api.get('/inventory/reports/movements', { params }),
  generateInventoryReport: (type, params) => api.post(`/inventory/reports/${type}`, params),
};

// ==================== HEALTH CENTER API ====================
export const healthAPI = {
  // Medical Records
  getMedicalRecords: (params) => api.get('/health/records', { params }),
  getMedicalRecord: (id) => api.get(`/health/records/${id}`),
  createMedicalRecord: (data) => api.post('/health/records', data),
  updateMedicalRecord: (id, data) => api.put(`/health/records/${id}`, data),
  deleteMedicalRecord: (id) => api.delete(`/health/records/${id}`),
  getStudentMedicalHistory: (studentId) => api.get(`/health/records/student/${studentId}`),
  
  // Clinic Visits
  getClinicVisits: (params) => api.get('/health/visits', { params }),
  getClinicVisit: (id) => api.get(`/health/visits/${id}`),
  createClinicVisit: (data) => api.post('/health/visits', data),
  updateClinicVisit: (id, data) => api.put(`/health/visits/${id}`, data),
  getDailyVisits: (date) => api.get('/health/visits/daily', { params: { date } }),
  getVisitStats: (params) => api.get('/health/visits/stats', { params }),
  
  // Emergency Contacts
  getEmergencyContacts: (params) => api.get('/health/emergency', { params }),
  getEmergencyContact: (id) => api.get(`/health/emergency/${id}`),
  createEmergencyContact: (data) => api.post('/health/emergency', data),
  updateEmergencyContact: (id, data) => api.put(`/health/emergency/${id}`, data),
  deleteEmergencyContact: (id) => api.delete(`/health/emergency/${id}`),
  getStudentEmergencyContacts: (studentId) => api.get(`/health/emergency/student/${studentId}`),
  
  // Prescriptions
  getPrescriptions: (params) => api.get('/health/prescriptions', { params }),
  createPrescription: (data) => api.post('/health/prescriptions', data),
  
  // Health Reports
  getHealthReports: (params) => api.get('/health/reports', { params }),
  generateHealthReport: (type, params) => api.post(`/health/reports/${type}`, params),
};

// ==================== TRANSPORT API ====================
export const transportAPI = {
  // Vehicles
  getVehicles: (params) => api.get('/transport/vehicles', { params }),
  getVehicle: (id) => api.get(`/transport/vehicles/${id}`),
  createVehicle: (data) => api.post('/transport/vehicles', data),
  updateVehicle: (id, data) => api.put(`/transport/vehicles/${id}`, data),
  deleteVehicle: (id) => api.delete(`/transport/vehicles/${id}`),
  getVehicleMaintenance: (id) => api.get(`/transport/vehicles/${id}/maintenance`),
  
  // Routes
  getRoutes: (params) => api.get('/transport/routes', { params }),
  getRoute: (id) => api.get(`/transport/routes/${id}`),
  createRoute: (data) => api.post('/transport/routes', data),
  updateRoute: (id, data) => api.put(`/transport/routes/${id}`, data),
  deleteRoute: (id) => api.delete(`/transport/routes/${id}`),
  getRouteStops: (id) => api.get(`/transport/routes/${id}/stops`),
  
  // Student Transport
  getStudentAssignments: (params) => api.get('/transport/students', { params }),
  assignStudent: (data) => api.post('/transport/students', data),
  updateAssignment: (id, data) => api.put(`/transport/students/${id}`, data),
  removeAssignment: (id) => api.delete(`/transport/students/${id}`),
  getStudentRoute: (studentId) => api.get(`/transport/students/${studentId}/route`),
  
  // GPS Tracking
  getVehicleLocation: (id) => api.get(`/transport/gps/${id}`),
  updateVehicleLocation: (id, data) => api.put(`/transport/gps/${id}`, data),
  getAllVehicleLocations: () => api.get('/transport/gps/all'),
  getLocationHistory: (id, params) => api.get(`/transport/gps/${id}/history`, { params }),
  
  // Drivers
  getDrivers: (params) => api.get('/transport/drivers', { params }),
  createDriver: (data) => api.post('/transport/drivers', data),
  updateDriver: (id, data) => api.put(`/transport/drivers/${id}`, data),
  
  // Transport Reports
  getTransportReports: (params) => api.get('/transport/reports', { params }),
  generateReport: (type, params) => api.post(`/transport/reports/${type}`, params),
};

// ==================== ASSETS API ====================
export const assetsAPI = {
  // Asset Register
  getAssets: (params) => api.get('/assets/register', { params }),
  getAsset: (id) => api.get(`/assets/register/${id}`),
  createAsset: (data) => api.post('/assets/register', data),
  updateAsset: (id, data) => api.put(`/assets/register/${id}`, data),
  deleteAsset: (id) => api.delete(`/assets/register/${id}`),
  getAssetByTag: (tag) => api.get(`/assets/register/tag/${tag}`),
  getAssetCategories: () => api.get('/assets/categories'),
  
  // Maintenance
  getMaintenanceRecords: (params) => api.get('/assets/maintenance', { params }),
  getMaintenanceRecord: (id) => api.get(`/assets/maintenance/${id}`),
  scheduleMaintenance: (data) => api.post('/assets/maintenance', data),
  updateMaintenance: (id, data) => api.put(`/assets/maintenance/${id}`, data),
  completeMaintenance: (id, data) => api.post(`/assets/maintenance/${id}/complete`, data),
  getUpcomingMaintenance: () => api.get('/assets/maintenance/upcoming'),
  getAssetMaintenanceHistory: (assetId) => api.get(`/assets/maintenance/asset/${assetId}`),
  
  // Depreciation
  calculateDepreciation: (id, params) => api.get(`/assets/depreciation/${id}`, { params }),
  getDepreciationReport: (params) => api.get('/assets/depreciation/report', { params }),
  runDepreciation: (data) => api.post('/assets/depreciation/run', data),
  getAssetDepreciation: (assetId) => api.get(`/assets/depreciation/asset/${assetId}`),
  
  // Asset Reports
  getAssetReports: (params) => api.get('/assets/reports', { params }),
  generateAssetReport: (type, params) => api.post(`/assets/reports/${type}`, params),
  getAssetValuation: () => api.get('/assets/reports/valuation'),
  getAssetUtilization: () => api.get('/assets/reports/utilization'),
};

// ==================== DASHBOARD API ====================
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivities: (limit = 10) => api.get('/dashboard/activities', { params: { limit } }),
  getCharts: () => api.get('/dashboard/charts'),
  getNotifications: () => api.get('/dashboard/notifications'),
  markNotificationRead: (id) => api.put(`/dashboard/notifications/${id}/read`),
};

// ==================== REPORTS API ====================
export const reportsAPI = {
  generateReport: (module, type, params) => api.post(`/reports/${module}/${type}`, params),
  downloadReport: (reportId, format = 'pdf') => api.get(`/reports/download/${reportId}`, { 
    params: { format },
    responseType: 'blob' 
  }),
  getScheduledReports: () => api.get('/reports/scheduled'),
  scheduleReport: (data) => api.post('/reports/schedule', data),
  deleteSchedule: (id) => api.delete(`/reports/schedule/${id}`),
  getReportHistory: (params) => api.get('/reports/history', { params }),
};

// ==================== SETTINGS API ====================
export const settingsAPI = {
  getSystemSettings: () => api.get('/settings/system'),
  updateSystemSettings: (data) => api.put('/settings/system', data),
  getBackupSettings: () => api.get('/settings/backup'),
  updateBackupSettings: (data) => api.put('/settings/backup', data),
  createBackup: () => api.post('/settings/backup/create'),
  getAuditLogs: (params) => api.get('/settings/audit', { params }),
};

// ==================== TEST CONNECTION ====================
export const testAPI = {
  checkConnection: () => api.get('/'),
  checkAuth: () => api.get('/auth/check'),
};

// Export main api instance for custom requests
export default api;