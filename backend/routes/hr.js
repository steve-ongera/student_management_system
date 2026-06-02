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
router.get('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT e.*, d.name as department_name, d.id as department_id
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employee', error: error.message });
  }
});

// Create employee
router.post('/employees', async (req, res) => {
  try {
    const {
      employee_id,
      name,
      email,
      phone,
      position,
      department_id,
      hire_date,
      salary,
      status
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO employees (employee_id, name, email, phone, position, 
       department_id, hire_date, salary, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [employee_id, name, email, phone, position, department_id, hire_date, salary, status || 'active']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error creating employee', error: error.message });
  }
});

// Update employee
router.put('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      position,
      department_id,
      salary,
      status
    } = req.body;
    
    const result = await pool.query(
      `UPDATE employees 
       SET name = $1, email = $2, phone = $3, position = $4,
           department_id = $5, salary = $6, status = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [name, email, phone, position, department_id, salary, status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating employee', error: error.message });
  }
});

// Delete employee
router.delete('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting employee', error: error.message });
  }
});

// Get leave requests
router.get('/leave', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, e.name as employee_name, e.employee_id, e.position,
             lt.name as leave_type_name, lt.days_allowed
      FROM leave_requests l
      JOIN employees e ON l.employee_id = e.id
      JOIN leave_types lt ON l.leave_type_id = lt.id
      ORDER BY l.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave requests', error: error.message });
  }
});

// Create leave request
router.post('/leave', async (req, res) => {
  try {
    const { employee_id, leave_type_id, start_date, end_date, reason } = req.body;
    
    const result = await pool.query(
      `INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [employee_id, leave_type_id, start_date, end_date, reason]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error creating leave request', error: error.message });
  }
});

// Approve leave
router.post('/leave/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    
    const result = await pool.query(
      `UPDATE leave_requests 
       SET status = 'approved', approval_comment = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [comment, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error approving leave', error: error.message });
  }
});

// Reject leave
router.post('/leave/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    
    const result = await pool.query(
      `UPDATE leave_requests 
       SET status = 'rejected', approval_comment = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [comment, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting leave', error: error.message });
  }
});

// Get leave types
router.get('/leave/types', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leave_types ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave types', error: error.message });
  }
});

// Get payroll
router.get('/payroll', async (req, res) => {
  try {
    const { month } = req.query;
    let query = `
      SELECT p.*, e.name as employee_name, e.position, e.employee_id
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
    `;
    const params = [];
    
    if (month) {
      query += ` WHERE DATE_TRUNC('month', p.payroll_month) = DATE_TRUNC('month', $1::date)`;
      params.push(`${month}-01`);
    }
    
    query += ` ORDER BY p.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payroll', error: error.message });
  }
});

// Generate payroll
router.post('/payroll/generate', async (req, res) => {
  const client = await pool.connect();
  try {
    const { month } = req.body;
    
    await client.query('BEGIN');
    
    // Get all active employees
    const employees = await client.query(
      'SELECT id, salary FROM employees WHERE status = "active"'
    );
    
    for (const employee of employees.rows) {
      const basic_salary = employee.salary;
      const allowances = basic_salary * 0.2; // 20% allowances
      const deductions = basic_salary * 0.1; // 10% deductions
      const net_pay = basic_salary + allowances - deductions;
      
      await client.query(
        `INSERT INTO payroll (employee_id, payroll_month, basic_salary, allowances, deductions, net_pay, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
        [employee.id, `${month}-01`, basic_salary, allowances, deductions, net_pay]
      );
    }
    
    await client.query('COMMIT');
    res.json({ message: 'Payroll generated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error generating payroll', error: error.message });
  } finally {
    client.release();
  }
});

// Process payroll payment
router.post('/payroll/:id/process', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE payroll 
       SET status = 'paid', paid_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error processing payment', error: error.message });
  }
});

// Get performance reviews
router.get('/performance', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pr.*, e.name as employee_name, e.position,
             r.name as reviewer_name
      FROM performance_reviews pr
      JOIN employees e ON pr.employee_id = e.id
      JOIN employees r ON pr.reviewer_id = r.id
      ORDER BY pr.review_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching performance reviews', error: error.message });
  }
});

// Create performance review
router.post('/performance', async (req, res) => {
  try {
    const {
      employee_id,
      reviewer_id,
      review_date,
      rating,
      comments,
      goals
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO performance_reviews (employee_id, reviewer_id, review_date, rating, comments, goals)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [employee_id, reviewer_id, review_date, rating, comments, goals]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error creating performance review', error: error.message });
  }
});

module.exports = router;