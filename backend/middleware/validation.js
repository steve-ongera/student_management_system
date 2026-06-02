// backend/middleware/validation.js
const { body, param, query, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    res.status(400).json({ 
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  };
};

// Common validation rules
const commonValidations = {
  id: param('id').isInt().withMessage('ID must be an integer'),
  email: body('email').isEmail().withMessage('Valid email is required'),
  phone: body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  date: body('date').optional().isISO8601().withMessage('Valid date is required'),
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ]
};

// Book validations
const bookValidations = {
  create: [
    body('title').notEmpty().withMessage('Title is required'),
    body('author').notEmpty().withMessage('Author is required'),
    body('isbn').optional().isISBN().withMessage('Valid ISBN is required'),
    body('total_copies').optional().isInt({ min: 1 }).withMessage('Total copies must be at least 1')
  ],
  update: [
    body('title').optional().notEmpty(),
    body('author').optional().notEmpty(),
    body('isbn').optional().isISBN()
  ]
};

// Employee validations
const employeeValidations = {
  create: [
    body('employee_id').notEmpty().withMessage('Employee ID is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('position').notEmpty().withMessage('Position is required')
  ],
  update: [
    body('email').optional().isEmail(),
    body('salary').optional().isFloat({ min: 0 }).withMessage('Salary must be a positive number')
  ]
};

// Stock item validations
const stockItemValidations = {
  create: [
    body('name').notEmpty().withMessage('Item name is required'),
    body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('unit_price').optional().isFloat({ min: 0 }).withMessage('Unit price must be a positive number')
  ],
  stockMovement: [
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('reference').optional().isString()
  ]
};

module.exports = {
  validate,
  commonValidations,
  bookValidations,
  employeeValidations,
  stockItemValidations
};