// backend/utils/constants.js
module.exports = {
  // User Roles
  USER_ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    LIBRARIAN: 'librarian',
    TEACHER: 'teacher',
    ACCOUNTANT: 'accountant',
    HR_MANAGER: 'hr_manager',
    HEALTH_STAFF: 'health_staff',
    TRANSPORT_MANAGER: 'transport_manager',
    STORE_KEEPER: 'store_keeper',
    USER: 'user'
  },

  // Employee Status
  EMPLOYEE_STATUS: {
    ACTIVE: 'active',
    ON_LEAVE: 'on_leave',
    INACTIVE: 'inactive',
    TERMINATED: 'terminated',
    SUSPENDED: 'suspended'
  },

  // Leave Status
  LEAVE_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled'
  },

  // Leave Types
  LEAVE_TYPES: {
    ANNUAL: 'annual',
    SICK: 'sick',
    MATERNITY: 'maternity',
    PATERNITY: 'paternity',
    COMPASSIONATE: 'compassionate',
    UNPAID: 'unpaid',
    STUDY: 'study',
    SABBATICAL: 'sabbatical'
  },

  // Payroll Status
  PAYROLL_STATUS: {
    PENDING: 'pending',
    PROCESSED: 'processed',
    PAID: 'paid',
    CANCELLED: 'cancelled'
  },

  // Performance Review Ratings
  PERFORMANCE_RATINGS: {
    EXCELLENT: 5,
    VERY_GOOD: 4,
    GOOD: 3,
    SATISFACTORY: 2,
    NEEDS_IMPROVEMENT: 1
  },

  // Book Status
  BOOK_STATUS: {
    AVAILABLE: 'available',
    BORROWED: 'borrowed',
    LOST: 'lost',
    DAMAGED: 'damaged',
    UNDER_MAINTENANCE: 'under_maintenance'
  },

  // Borrowing Status
  BORROWING_STATUS: {
    ACTIVE: 'active',
    RETURNED: 'returned',
    OVERDUE: 'overdue',
    LOST: 'lost'
  },

  // Fine Status
  FINE_STATUS: {
    PENDING: 'pending',
    PAID: 'paid',
    WAIVED: 'waived'
  },

  // Student Status
  STUDENT_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    GRADUATED: 'graduated',
    TRANSFERRED: 'transferred',
    SUSPENDED: 'suspended',
    EXPELLED: 'expelled'
  },

  // Payment Methods
  PAYMENT_METHODS: {
    CASH: 'cash',
    MPESA: 'mpesa',
    BANK_TRANSFER: 'bank_transfer',
    CHEQUE: 'cheque',
    CARD: 'card'
  },

  // Purchase Order Status
  PO_STATUS: {
    DRAFT: 'draft',
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    ORDERED: 'ordered',
    RECEIVED: 'received',
    CANCELLED: 'cancelled'
  },

  // Requisition Status
  REQUISITION_STATUS: {
    DRAFT: 'draft',
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    FULFILLED: 'fulfilled'
  },

  // Priorities
  PRIORITIES: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
  },

  // Stock Movement Types
  MOVEMENT_TYPES: {
    IN: 'in',
    OUT: 'out',
    RETURN: 'return',
    ADJUSTMENT: 'adjustment',
    DAMAGED: 'damaged'
  },

  // Asset Status
  ASSET_STATUS: {
    ACTIVE: 'active',
    UNDER_MAINTENANCE: 'under_maintenance',
    RETIRED: 'retired',
    DISPOSED: 'disposed',
    LOST: 'lost'
  },

  // Maintenance Types
  MAINTENANCE_TYPES: {
    ROUTINE: 'routine',
    PREVENTIVE: 'preventive',
    CORRECTIVE: 'corrective',
    EMERGENCY: 'emergency',
    INSPECTION: 'inspection'
  },

  // Vehicle Status
  VEHICLE_STATUS: {
    ACTIVE: 'active',
    MAINTENANCE: 'maintenance',
    INACTIVE: 'inactive',
    RETIRED: 'retired'
  },

  // Attendance Status
  ATTENDANCE_STATUS: {
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late',
    EXCUSED: 'excused',
    HOLIDAY: 'holiday'
  },

  // Gender
  GENDER: {
    MALE: 'male',
    FEMALE: 'female',
    OTHER: 'other'
  },

  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503
  },

  // Response Messages
  MESSAGES: {
    SUCCESS: {
      CREATED: 'Resource created successfully',
      UPDATED: 'Resource updated successfully',
      DELETED: 'Resource deleted successfully',
      FETCHED: 'Data fetched successfully',
      LOGIN_SUCCESS: 'Login successful',
      LOGOUT_SUCCESS: 'Logout successful',
      PASSWORD_CHANGED: 'Password changed successfully',
      EMAIL_SENT: 'Email sent successfully',
      PAYMENT_SUCCESS: 'Payment processed successfully'
    },
    ERROR: {
      NOT_FOUND: 'Resource not found',
      UNAUTHORIZED: 'Unauthorized access',
      FORBIDDEN: 'Access forbidden',
      INVALID_CREDENTIALS: 'Invalid credentials',
      VALIDATION_ERROR: 'Validation error',
      DUPLICATE_ENTRY: 'Duplicate entry found',
      DATABASE_ERROR: 'Database error occurred',
      NETWORK_ERROR: 'Network error occurred',
      SERVER_ERROR: 'Internal server error',
      INSUFFICIENT_STOCK: 'Insufficient stock available',
      BOOK_NOT_AVAILABLE: 'Book is not available for borrowing',
      OVERDUE_BOOKS: 'You have overdue books',
      BORROWING_LIMIT_REACHED: 'Borrowing limit reached'
    }
  },

  // Pagination Defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  },

  // File Upload Limits
  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    MAX_FILES: 10
  },

  // Date Formats
  DATE_FORMATS: {
    DEFAULT: 'YYYY-MM-DD',
    DISPLAY: 'DD/MM/YYYY',
    DISPLAY_LONG: 'DD MMMM YYYY',
    DATETIME: 'YYYY-MM-DD HH:mm:ss',
    TIME: 'HH:mm:ss'
  },

  // Fine Rates (per day)
  FINE_RATES: {
    STANDARD: 50,
    REFERENCE: 100,
    RARE_BOOK: 200
  },

  // Borrowing Limits
  BORROWING_LIMITS: {
    STUDENT_MAX_BOOKS: 5,
    TEACHER_MAX_BOOKS: 10,
    DEFAULT_DUE_DAYS: 14,
    REFERENCE_DUE_DAYS: 7
  },

  // Tax Rates (Kenya)
  TAX_RATES: {
    PAYE_BRACKETS: [
      { min: 0, max: 24000, rate: 0.1 },
      { min: 24001, max: 32333, rate: 0.25 },
      { min: 32334, max: Infinity, rate: 0.3 }
    ],
    NSSF_RATE: 0.06,
    NSSF_MAX: 2160,
    NHIF_RATES: {
      min: 0, max: 5999, amount: 150,
      min2: 6000, max2: 7999, amount2: 300,
      min3: 8000, max3: 11999, amount3: 400,
      min4: 12000, max4: 14999, amount4: 500,
      min5: 15000, max5: 19999, amount5: 600,
      min6: 20000, max6: 24999, amount6: 750,
      min7: 25000, max7: 29999, amount7: 850,
      min8: 30000, max8: 34999, amount8: 900,
      min9: 35000, max9: 39999, amount9: 950,
      min10: 40000, max10: 44999, amount10: 1000,
      min11: 45000, max11: 49999, amount11: 1100,
      min12: 50000, max12: 59999, amount12: 1200,
      min13: 60000, max13: 69999, amount13: 1300,
      min14: 70000, max14: 79999, amount14: 1400,
      min15: 80000, max15: 89999, amount15: 1500,
      min16: 90000, max16: 99999, amount16: 1600,
      min17: 100000, max17: Infinity, amount17: 1700
    }
  },

  // Cache Durations (seconds)
  CACHE_DURATIONS: {
    SHORT: 60,           // 1 minute
    MEDIUM: 300,         // 5 minutes
    LONG: 3600,          // 1 hour
    VERY_LONG: 86400     // 24 hours
  },

  // Token Expiry (seconds)
  TOKEN_EXPIRY: {
    ACCESS: 7 * 24 * 60 * 60,    // 7 days
    REFRESH: 30 * 24 * 60 * 60,   // 30 days
    RESET: 1 * 60 * 60           // 1 hour
  },

  // Rate Limiting
  RATE_LIMITS: {
    API: { windowMs: 15 * 60 * 1000, max: 100 },      // 100 requests per 15 minutes
    AUTH: { windowMs: 15 * 60 * 1000, max: 5 },       // 5 attempts per 15 minutes
    UPLOAD: { windowMs: 60 * 60 * 1000, max: 50 },    // 50 uploads per hour
    SEARCH: { windowMs: 60 * 1000, max: 30 }          // 30 searches per minute
  },

  // Report Types
  REPORT_TYPES: {
    STUDENT_PERFORMANCE: 'student_performance',
    FINANCIAL: 'financial',
    INVENTORY: 'inventory',
    ATTENDANCE: 'attendance',
    LIBRARY: 'library',
    HR: 'hr',
    PROCUREMENT: 'procurement',
    TRANSPORT: 'transport',
    ASSETS: 'assets'
  },

  // Report Formats
  REPORT_FORMATS: {
    PDF: 'pdf',
    EXCEL: 'excel',
    CSV: 'csv',
    JSON: 'json'
  },

  // Notification Types
  NOTIFICATION_TYPES: {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    REMINDER: 'reminder',
    ALERT: 'alert'
  },

  // Email Templates
  EMAIL_TEMPLATES: {
    WELCOME: 'welcome',
    PASSWORD_RESET: 'password_reset',
    LEAVE_APPROVED: 'leave_approved',
    LEAVE_REJECTED: 'leave_rejected',
    BOOK_BORROWED: 'book_borrowed',
    BOOK_OVERDUE: 'book_overdue',
    PAYMENT_CONFIRMATION: 'payment_confirmation',
    PAYROLL_SLIP: 'payroll_slip'
  },

  // Query Operators
  QUERY_OPERATORS: {
    EQ: 'eq',
    NE: 'ne',
    GT: 'gt',
    GTE: 'gte',
    LT: 'lt',
    LTE: 'lte',
    LIKE: 'like',
    IN: 'in',
    NIN: 'nin'
  },

  // Sort Orders
  SORT_ORDERS: {
    ASC: 'ASC',
    DESC: 'DESC'
  },

  // Months
  MONTHS: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],

  // Days of Week
  DAYS_OF_WEEK: [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ],

  // Academic Terms
  ACADEMIC_TERMS: {
    TERM_1: 'Term 1',
    TERM_2: 'Term 2',
    TERM_3: 'Term 3'
  },

  // Grading System
  GRADING_SYSTEM: {
    A: { min: 80, max: 100, points: 12 },
    A_MINUS: { min: 75, max: 79, points: 11 },
    B_PLUS: { min: 70, max: 74, points: 10 },
    B: { min: 65, max: 69, points: 9 },
    B_MINUS: { min: 60, max: 64, points: 8 },
    C_PLUS: { min: 55, max: 59, points: 7 },
    C: { min: 50, max: 54, points: 6 },
    C_MINUS: { min: 45, max: 49, points: 5 },
    D_PLUS: { min: 40, max: 44, points: 4 },
    D: { min: 35, max: 39, points: 3 },
    D_MINUS: { min: 30, max: 34, points: 2 },
    E: { min: 0, max: 29, points: 1 }
  },

  // Units of Measurement
  UNITS: {
    LENGTH: ['mm', 'cm', 'm', 'km'],
    WEIGHT: ['g', 'kg', 'tonne'],
    VOLUME: ['ml', 'l', 'gal'],
    COUNT: ['pcs', 'dozen', 'pack', 'box', 'carton']
  },

  // Currencies
  CURRENCIES: {
    KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
    USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
    EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
    GBP: { code: 'GBP', symbol: '£', name: 'British Pound' }
  },

  // Default Currency
  DEFAULT_CURRENCY: 'KES',

  // Countries (for dropdowns)
  COUNTRIES: [
    'Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Burundi', 'South Sudan',
    'Ethiopia', 'Somalia', 'Sudan', 'Nigeria', 'South Africa', 'Egypt'
  ],

  // ID Card Types
  ID_TYPES: {
    NATIONAL_ID: 'National ID',
    PASSPORT: 'Passport',
    BIRTH_CERTIFICATE: 'Birth Certificate',
    DRIVERS_LICENSE: 'Driver\'s License',
    ALIEN_ID: 'Alien ID'
  },

  // Blood Groups
  BLOOD_GROUPS: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],

  // Marital Status
  MARITAL_STATUS: {
    SINGLE: 'Single',
    MARRIED: 'Married',
    DIVORCED: 'Divorced',
    WIDOWED: 'Widowed',
    SEPARATED: 'Separated'
  },

  // Education Levels
  EDUCATION_LEVELS: {
    PHD: 'PhD',
    MASTERS: 'Master\'s Degree',
    BACHELORS: 'Bachelor\'s Degree',
    DIPLOMA: 'Diploma',
    CERTIFICATE: 'Certificate',
    HIGH_SCHOOL: 'High School',
    PRIMARY: 'Primary School'
  }
};