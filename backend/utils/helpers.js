// backend/utils/helpers.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const moment = require('moment');
const constants = require('./constants');

// ==================== DATE & TIME HELPERS ====================

/**
 * Format date to specified format
 * @param {Date|string} date - Date to format
 * @param {string} format - Date format (default: 'YYYY-MM-DD')
 * @returns {string} Formatted date
 */
const formatDate = (date, format = constants.DATE_FORMATS.DEFAULT) => {
  if (!date) return null;
  return moment(date).format(format);
};

/**
 * Get current date in specified format
 * @param {string} format - Date format
 * @returns {string} Current date
 */
const getCurrentDate = (format = constants.DATE_FORMATS.DEFAULT) => {
  return moment().format(format);
};

/**
 * Get current datetime
 * @returns {string} Current datetime
 */
const getCurrentDateTime = () => {
  return moment().format(constants.DATE_FORMATS.DATETIME);
};

/**
 * Calculate days between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {number} Number of days
 */
const daysBetween = (startDate, endDate) => {
  const start = moment(startDate);
  const end = moment(endDate);
  return end.diff(start, 'days');
};

/**
 * Add days to a date
 * @param {Date|string} date - Base date
 * @param {number} days - Number of days to add
 * @returns {Date} New date
 */
const addDays = (date, days) => {
  return moment(date).add(days, 'days').toDate();
};

/**
 * Check if date is overdue
 * @param {Date|string} dueDate - Due date
 * @returns {boolean} True if overdue
 */
const isOverdue = (dueDate) => {
  return moment().isAfter(moment(dueDate));
};

/**
 * Get age from date of birth
 * @param {Date|string} dob - Date of birth
 * @returns {number} Age in years
 */
const calculateAge = (dob) => {
  return moment().diff(moment(dob), 'years');
};

// ==================== STRING HELPERS ====================

/**
 * Capitalize first letter of string
 * @param {string} str - Input string
 * @returns {string} Capitalized string
 */
const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Generate random string
 * @param {number} length - Length of string
 * @returns {string} Random string
 */
const generateRandomString = (length = 10) => {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
};

/**
 * Truncate string to specified length
 * @param {string} str - Input string
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated string
 */
const truncateString = (str, length = 50, suffix = '...') => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + suffix;
};

/**
 * Slugify a string (convert to URL-friendly format)
 * @param {string} str - Input string
 * @returns {string} Slugified string
 */
const slugify = (str) => {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
};

/**
 * Extract initials from name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 3);
};

// ==================== NUMBER HELPERS ====================

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'KES')
 * @returns {string} Formatted currency
 */
const formatCurrency = (amount, currency = constants.DEFAULT_CURRENCY) => {
  if (!amount && amount !== 0) return '-';
  const currencyInfo = constants.CURRENCIES[currency] || constants.CURRENCIES.KES;
  return `${currencyInfo.symbol} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
const formatNumber = (num) => {
  if (!num && num !== 0) return '-';
  return num.toLocaleString();
};

/**
 * Calculate percentage
 * @param {number} part - Part value
 * @param {number} total - Total value
 * @returns {number} Percentage
 */
const calculatePercentage = (part, total) => {
  if (!total || total === 0) return 0;
  return (part / total) * 100;
};

/**
 * Round to decimal places
 * @param {number} num - Number to round
 * @param {number} decimals - Decimal places
 * @returns {number} Rounded number
 */
const roundToDecimal = (num, decimals = 2) => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

// ==================== VALIDATION HELPERS ====================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Kenyan format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^(?:\+254|0)?[17]\d{8}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate Kenyan ID number
 * @param {string} idNumber - ID number to validate
 * @returns {boolean} True if valid
 */
const isValidKenyanId = (idNumber) => {
  const idRegex = /^\d{8}$/;
  return idRegex.test(idNumber);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result
 */
const validatePasswordStrength = (password) => {
  const result = {
    isValid: true,
    errors: []
  };

  if (password.length < 8) {
    result.isValid = false;
    result.errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one special character');
  }

  return result;
};

// ==================== AUTHENTICATION HELPERS ====================

/**
 * Hash password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} True if matches
 */
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate JWT token
 * @param {object} payload - Token payload
 * @param {string} expiresIn - Expiry time (default: '7d')
 * @returns {string} JWT token
 */
const generateToken = (payload, expiresIn = constants.TOKEN_EXPIRY.ACCESS) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object} Decoded payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// ==================== RESPONSE HELPERS ====================

/**
 * Send success response
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @param {any} data - Response data
 * @param {number} statusCode - HTTP status code
 */
const sendSuccess = (res, message, data = null, statusCode = constants.HTTP_STATUS.OK) => {
  const response = {
    success: true,
    message: message || constants.MESSAGES.SUCCESS.FETCHED
  };
  if (data) response.data = data;
  res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {any} errors - Validation errors
 */
const sendError = (res, message, statusCode = constants.HTTP_STATUS.BAD_REQUEST, errors = null) => {
  const response = {
    success: false,
    message: message || constants.MESSAGES.ERROR.SERVER_ERROR
  };
  if (errors) response.errors = errors;
  res.status(statusCode).json(response);
};

/**
 * Send paginated response
 * @param {object} res - Express response object
 * @param {array} data - Response data
 * @param {number} total - Total records
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 */
const sendPaginated = (res, data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  res.json({
    success: true,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
};

// ==================== CALCULATION HELPERS ====================

/**
 * Calculate fine amount for overdue books
 * @param {Date} dueDate - Due date
 * @param {Date} returnDate - Return date (default: current date)
 * @param {number} ratePerDay - Fine rate per day (default: 50)
 * @returns {number} Fine amount
 */
const calculateFine = (dueDate, returnDate = new Date(), ratePerDay = constants.FINE_RATES.STANDARD) => {
  const days = daysBetween(dueDate, returnDate);
  if (days <= 0) return 0;
  return days * ratePerDay;
};

/**
 * Calculate tax (PAYE) based on Kenyan tax brackets
 * @param {number} taxableIncome - Taxable income
 * @returns {number} Tax amount
 */
const calculatePAYE = (taxableIncome) => {
  let tax = 0;
  const brackets = constants.TAX_RATES.PAYE_BRACKETS;
  
  for (const bracket of brackets) {
    if (taxableIncome > bracket.min) {
      const taxable = Math.min(taxableIncome, bracket.max) - bracket.min;
      tax += taxable * bracket.rate;
    }
  }
  
  return Math.round(tax);
};

/**
 * Calculate NHIF contribution
 * @param {number} salary - Employee salary
 * @returns {number} NHIF amount
 */
const calculateNHIF = (salary) => {
  const rates = constants.TAX_RATES.NHIF_RATES;
  
  if (salary <= rates.max) return rates.amount;
  if (salary <= rates.max2) return rates.amount2;
  if (salary <= rates.max3) return rates.amount3;
  if (salary <= rates.max4) return rates.amount4;
  if (salary <= rates.max5) return rates.amount5;
  if (salary <= rates.max6) return rates.amount6;
  if (salary <= rates.max7) return rates.amount7;
  if (salary <= rates.max8) return rates.amount8;
  if (salary <= rates.max9) return rates.amount9;
  if (salary <= rates.max10) return rates.amount10;
  if (salary <= rates.max11) return rates.amount11;
  if (salary <= rates.max12) return rates.amount12;
  if (salary <= rates.max13) return rates.amount13;
  if (salary <= rates.max14) return rates.amount14;
  if (salary <= rates.max15) return rates.amount15;
  if (salary <= rates.max16) return rates.amount16;
  return rates.amount17;
};

/**
 * Calculate NSSF contribution
 * @param {number} salary - Employee salary
 * @returns {number} NSSF amount
 */
const calculateNSSF = (salary) => {
  const contribution = salary * constants.TAX_RATES.NSSF_RATE;
  return Math.min(contribution, constants.TAX_RATES.NSSF_MAX);
};

/**
 * Calculate net salary
 * @param {number} basicSalary - Basic salary
 * @param {number} allowances - Allowances
 * @param {number} deductions - Deductions
 * @returns {number} Net salary
 */
const calculateNetSalary = (basicSalary, allowances = 0, deductions = 0) => {
  const grossSalary = basicSalary + allowances;
  const paye = calculatePAYE(grossSalary);
  const nhif = calculateNHIF(basicSalary);
  const nssf = calculateNSSF(basicSalary);
  const totalDeductions = deductions + paye + nhif + nssf;
  return grossSalary - totalDeductions;
};

// ==================== GRADE HELPERS ====================

/**
 * Calculate grade based on marks
 * @param {number} marks - Marks obtained
 * @returns {object} Grade information
 */
const calculateGrade = (marks) => {
  const grades = constants.GRADING_SYSTEM;
  
  if (marks >= grades.A.min) return { grade: 'A', points: grades.A.points, remark: 'Excellent' };
  if (marks >= grades.A_MINUS.min) return { grade: 'A-', points: grades.A_MINUS.points, remark: 'Very Good' };
  if (marks >= grades.B_PLUS.min) return { grade: 'B+', points: grades.B_PLUS.points, remark: 'Good' };
  if (marks >= grades.B.min) return { grade: 'B', points: grades.B.points, remark: 'Above Average' };
  if (marks >= grades.B_MINUS.min) return { grade: 'B-', points: grades.B_MINUS.points, remark: 'Average' };
  if (marks >= grades.C_PLUS.min) return { grade: 'C+', points: grades.C_PLUS.points, remark: 'Satisfactory' };
  if (marks >= grades.C.min) return { grade: 'C', points: grades.C.points, remark: 'Fair' };
  if (marks >= grades.C_MINUS.min) return { grade: 'C-', points: grades.C_MINUS.points, remark: 'Below Average' };
  if (marks >= grades.D_PLUS.min) return { grade: 'D+', points: grades.D_PLUS.points, remark: 'Poor' };
  if (marks >= grades.D.min) return { grade: 'D', points: grades.D.points, remark: 'Very Poor' };
  if (marks >= grades.D_MINUS.min) return { grade: 'D-', points: grades.D_MINUS.points, remark: 'Unsatisfactory' };
  return { grade: 'E', points: grades.E.points, remark: 'Fail' };
};

/**
 * Calculate GPA from grades
 * @param {array} subjects - Array of subject marks
 * @returns {number} GPA
 */
const calculateGPA = (subjects) => {
  if (!subjects || subjects.length === 0) return 0;
  
  let totalPoints = 0;
  for (const subject of subjects) {
    const grade = calculateGrade(subject.marks);
    totalPoints += grade.points;
  }
  
  return roundToDecimal(totalPoints / subjects.length, 2);
};

// ==================== ARRAY & OBJECT HELPERS ====================

/**
 * Group array by key
 * @param {array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {object} Grouped object
 */
const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

/**
 * Remove null/undefined values from object
 * @param {object} obj - Object to clean
 * @returns {object} Cleaned object
 */
const cleanObject = (obj) => {
  const cleaned = {};
  for (const key in obj) {
    if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
};

/**
 * Pick specific fields from object
 * @param {object} obj - Source object
 * @param {array} fields - Fields to pick
 * @returns {object} Picked object
 */
const pickFields = (obj, fields) => {
  const picked = {};
  for (const field of fields) {
    if (obj.hasOwnProperty(field)) {
      picked[field] = obj[field];
    }
  }
  return picked;
};

/**
 * Exclude fields from object
 * @param {object} obj - Source object * @param {array} fields - Fields to exclude
 * @returns {object} Object without excluded fields
 */
const excludeFields = (obj, fields) => {
  const result = { ...obj };
  for (const field of fields) {
    delete result[field];
  }
  return result;
};

// ==================== FILE HELPERS ====================

/**
 * Get file extension from filename
 * @param {string} filename - File name
 * @returns {string} File extension
 */
const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Generate unique filename
 * @param {string} originalName - Original filename
 * @returns {string} Unique filename
 */
const generateUniqueFilename = (originalName) => {
  const extension = getFileExtension(originalName);
  const timestamp = Date.now();
  const random = generateRandomString(6);
  return `${timestamp}-${random}.${extension}`;
};

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ==================== CACHE HELPERS ====================

class Cache {
  constructor(ttl = constants.CACHE_DURATIONS.MEDIUM) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value, ttl = this.ttl) {
    const expires = Date.now() + (ttl * 1000);
    this.cache.set(key, { value, expires });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  has(key) {
    return this.cache.has(key) && Date.now() <= this.cache.get(key).expires;
  }
}

// Create cache instances
const cache = new Cache();
const shortCache = new Cache(constants.CACHE_DURATIONS.SHORT);
const longCache = new Cache(constants.CACHE_DURATIONS.LONG);

// ==================== LOGGING HELPERS ====================

/**
 * Log info message
 * @param {string} message - Log message
 * @param {object} data - Additional data
 */
const logInfo = (message, data = null) => {
  console.log(`[INFO] ${getCurrentDateTime()} - ${message}`);
  if (data && process.env.NODE_ENV === 'development') {
    console.log(data);
  }
};

/**
 * Log error message
 * @param {string} message - Error message
 * @param {object} error - Error object
 */
const logError = (message, error = null) => {
  console.error(`[ERROR] ${getCurrentDateTime()} - ${message}`);
  if (error && process.env.NODE_ENV === 'development') {
    console.error(error);
  }
};

/**
 * Log warning message
 * @param {string} message - Warning message
 */
const logWarning = (message) => {
  console.warn(`[WARNING] ${getCurrentDateTime()} - ${message}`);
};

// ==================== EXPORT ALL HELPERS ====================

module.exports = {
  // Date & Time
  formatDate,
  getCurrentDate,
  getCurrentDateTime,
  daysBetween,
  addDays,
  isOverdue,
  calculateAge,
  
  // String
  capitalize,
  generateRandomString,
  truncateString,
  slugify,
  getInitials,
  
  // Number
  formatCurrency,
  formatNumber,
  calculatePercentage,
  roundToDecimal,
  
  // Validation
  isValidEmail,
  isValidPhone,
  isValidKenyanId,
  validatePasswordStrength,
  
  // Authentication
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  
  // Response
  sendSuccess,
  sendError,
  sendPaginated,
  
  // Calculations
  calculateFine,
  calculatePAYE,
  calculateNHIF,
  calculateNSSF,
  calculateNetSalary,
  
  // Grade
  calculateGrade,
  calculateGPA,
  
  // Array & Object
  groupBy,
  cleanObject,
  pickFields,
  excludeFields,
  
  // File
  getFileExtension,
  generateUniqueFilename,
  formatFileSize,
  
  // Cache
  Cache,
  cache,
  shortCache,
  longCache,
  
  // Logging
  logInfo,
  logError,
  logWarning
};