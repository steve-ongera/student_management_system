// backend/routes/hr.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all employees with filters
router.get('/employees', async (req, res) => {
  try {
    const { search, department, status } = req.query;
    let query = `
      SELECT e.*, d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      query += ` AND (e.name ILIKE $${paramIndex} OR e.email ILIKE $${paramIndex} OR e.employee_id ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (department) {
      query += ` AND d.name = $${paramIndex}`;
      params.push(department);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND e.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    query += ` ORDER BY e.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees', error: error.message });
  }
});

// Get employee stats
router.get('/employees/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'on_leave' THEN 1 END) as on_leave,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
        ARRAY_AGG(DISTINCT d.name) as departments
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
    `);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employee stats', error: error.message });
  }
});

// Get single employee
router.get('/employees/:id', async (req, res