// backend/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  console.error(err);
  
  // PostgreSQL error handling
  if (err.code === '23505') {
    const message = 'Duplicate entry found';
    error = { message, statusCode: 400 };
  }
  
  if (err.code === '23503') {
    const message = 'Foreign key constraint failed';
    error = { message, statusCode: 400 };
  }
  
  if (err.code === '42P01') {
    const message = 'Database table not found';
    error = { message, statusCode: 500 };
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }
  
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }
  
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFound };