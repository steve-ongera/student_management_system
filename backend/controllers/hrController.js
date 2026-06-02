// backend/controllers/hrController.js
const pool = require('../config/database');

// ==================== EMPLOYEE MANAGEMENT ====================

// Get all employees with pagination and filters
exports.getEmployees = async (req, res) => {
  try {
    const { search, department, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT e.*, d.name as department_name, 
             (SELECT COUNT(*) FROM leave_requests WHERE employee_id = e.id AND status = 'pending') as pending_leave
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      query += ` AND (e.name ILIKE $${paramIndex} OR e.email ILIKE $${paramIndex} OR e.employee_id ILIKE $${paramIndex} OR e.phone ILIKE $${paramIndex})`;
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
    
    query += ` ORDER BY e.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM employees e LEFT JOIN departments d ON e.department_id = d.id WHERE 1=1';
    const countParams = [];
    let countIndex = 1;
    
    if (search) {
      countQuery += ` AND (e.name ILIKE $${countIndex} OR e.email ILIKE $${countIndex} OR e.employee_id ILIKE $${countIndex})`;
      countParams.push(`%${search}%`);
      countIndex++;
    }
    
    if (department) {
      countQuery += ` AND d.name = $${countIndex}`;
      countParams.push(department);
      countIndex++;
    }
    
    if (status) {
      countQuery += ` AND e.status = $${countIndex}`;
      countParams.push(status);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      employees: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees', error: error.message });
  }
};

// Get single employee by ID
exports.getEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT e.*, d.name as department_name, d.id as department_id,
             (SELECT json_agg(jsonb_build_object(
               'id', lr.id, 'leave_type', lt.name, 'start_date', lr.start_date,
               'end_date', lr.end_date, 'status', lr.status, 'reason', lr.reason
             )) FROM leave_requests lr 
             LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id 
             WHERE lr.employee_id = e.id ORDER BY lr.created_at DESC LIMIT 5) as recent_leave,
             (SELECT json_agg(jsonb_build_object(
               'id', p.id, 'review_date', p.review_date, 'rating', p.rating,
               'comments', p.comments, 'reviewer_name', r.name
             )) FROM performance_reviews p 
             LEFT JOIN employees r ON p.reviewer_id = r.id
             WHERE p.employee_id = e.id ORDER BY p.review_date DESC LIMIT 5) as recent_reviews
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
};

// Get employee by employee ID
exports.getEmployeeByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const result = await pool.query(`
      SELECT e.*, d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.employee_id = $1
    `, [employeeId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employee', error: error.message });
  }
};

// Create new employee
exports.createEmployee = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      employee_id, name, email, phone, address, date_of_birth,
      gender, position, department_id, hire_date, salary,
      bank_name, bank_account, bank_branch, emergency_contact_name,
      emergency_contact_phone, emergency_contact_relationship, status
    } = req.body;
    
    await client.query('BEGIN');
    
    // Check if employee_id already exists
    const existing = await client.query(
      'SELECT id FROM employees WHERE employee_id = $1',
      [employee_id]
    );
    
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Employee ID already exists' });
    }
    
    const result = await client.query(
      `INSERT INTO employees (employee_id, name, email, phone, address, date_of_birth, gender,
       position, department_id, hire_date, salary, bank_name, bank_account, bank_branch,
       emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [employee_id, name, email, phone, address, date_of_birth, gender, position,
       department_id, hire_date, salary, bank_name, bank_account, bank_branch,
       emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, status || 'active']
    );
    
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error creating employee', error: error.message });
  } finally {
    client.release();
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, email, phone, address, date_of_birth, gender,
      position, department_id, salary, bank_name, bank_account,
      bank_branch, emergency_contact_name, emergency_contact_phone,
      emergency_contact_relationship, status
    } = req.body;
    
    const result = await pool.query(
      `UPDATE employees 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address),
           date_of_birth = COALESCE($5, date_of_birth),
           gender = COALESCE($6, gender),
           position = COALESCE($7, position),
           department_id = COALESCE($8, department_id),
           salary = COALESCE($9, salary),
           bank_name = COALESCE($10, bank_name),
           bank_account = COALESCE($11, bank_account),
           bank_branch = COALESCE($12, bank_branch),
           emergency_contact_name = COALESCE($13, emergency_contact_name),
           emergency_contact_phone = COALESCE($14, emergency_contact_phone),
           emergency_contact_relationship = COALESCE($15, emergency_contact_relationship),
           status = COALESCE($16, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $17 RETURNING *`,
      [name, email, phone, address, date_of_birth, gender, position,
       department_id, salary, bank_name, bank_account, bank_branch,
       emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
       status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating employee', error: error.message });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if employee has any records
    const hasRecords = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM leave_requests WHERE employee_id = $1) +
        (SELECT COUNT(*) FROM payroll WHERE employee_id = $1) +
        (SELECT COUNT(*) FROM performance_reviews WHERE employee_id = $1) as total_records
    `, [id]);
    
    if (parseInt(hasRecords.rows[0].total_records) > 0) {
      // Soft delete - just mark as inactive
      const result = await pool.query(
        'UPDATE employees SET status = \'terminated\', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [id]
      );
      return res.json({ message: 'Employee marked as terminated', employee: result.rows[0] });
    }
    
    // Hard delete if no records
    const result = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting employee', error: error.message });
  }
};

// Get employee statistics
exports.getEmployeeStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'on_leave' THEN 1 END) as on_leave,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
        COUNT(CASE WHEN status = 'terminated' THEN 1 END) as terminated,
        COUNT(CASE WHEN gender = 'Male' THEN 1 END) as male,
        COUNT(CASE WHEN gender = 'Female' THEN 1 END) as female,
        json_agg(DISTINCT jsonb_build_object('id', d.id, 'name', d.name, 'count', 
          (SELECT COUNT(*) FROM employees WHERE department_id = d.id AND status = 'active'))) as departments
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.status != 'terminated'
    `);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employee stats', error: error.message });
  }
};

// Get departments
exports.getDepartments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
      GROUP BY d.id
      ORDER BY d.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching departments', error: error.message });
  }
};

// Create department
exports.createDepartment = async (req, res) => {
  try {
    const { name, description, head_of_department } = req.body;
    
    const result = await pool.query(
      `INSERT INTO departments (name, description, head_of_department)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, description, head_of_department]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error creating department', error: error.message });
  }
};

// ==================== LEAVE MANAGEMENT ====================

// Get all leave requests
exports.getLeaveRequests = async (req, res) => {
  try {
    const { status, employee_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT l.*, e.name as employee_name, e.employee_id, e.position,
             lt.name as leave_type_name, lt.days_allowed,
             CASE 
               WHEN l.status = 'approved' THEN 'Approved'
               WHEN l.status = 'rejected' THEN 'Rejected'
               WHEN l.start_date <= CURRENT_DATE AND l.end_date >= CURRENT_DATE THEN 'Ongoing'
               WHEN l.start_date > CURRENT_DATE THEN 'Upcoming'
               ELSE 'Pending'
             END as current_status
      FROM leave_requests l
      JOIN employees e ON l.employee_id = e.id
      JOIN leave_types lt ON l.leave_type_id = lt.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND l.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (employee_id) {
      query += ` AND l.employee_id = $${paramIndex}`;
      params.push(employee_id);
      paramIndex++;
    }
    
    query += ` ORDER BY l.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    const countQuery = 'SELECT COUNT(*) FROM leave_requests' + 
      (status || employee_id ? ' WHERE ' + 
        (status ? 'status = $1' : '') + 
        (status && employee_id ? ' AND ' : '') +
        (employee_id ? 'employee_id = $' + (status ? '2' : '1') : '') : '');
    const countParams = [];
    if (status) countParams.push(status);
    if (employee_id) countParams.push(employee_id);
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      leave_requests: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave requests', error: error.message });
  }
};

// Get single leave request
exports.getLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT l.*, e.name as employee_name, e.employee_id, e.position, e.email,
             lt.name as leave_type_name, lt.days_allowed
      FROM leave_requests l
      JOIN employees e ON l.employee_id = e.id
      JOIN leave_types lt ON l.leave_type_id = lt.id
      WHERE l.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave request', error: error.message });
  }
};

// Create leave request
exports.createLeaveRequest = async (req, res) => {
  const client = await pool.connect();
  try {
    const { employee_id, leave_type_id, start_date, end_date, reason } = req.body;
    
    await client.query('BEGIN');
    
    // Check if employee has sufficient leave balance
    const balance = await client.query(`
      SELECT lt.days_allowed, 
             COALESCE(SUM(CASE WHEN l.status = 'approved' THEN 
               (EXTRACT(DAY FROM (l.end_date - l.start_date)) + 1) ELSE 0 END), 0) as used_days
      FROM leave_types lt
      LEFT JOIN leave_requests l ON lt.id = l.leave_type_id AND l.employee_id = $1
      WHERE lt.id = $2
      GROUP BY lt.days_allowed
    `, [employee_id, leave_type_id]);
    
    const requestedDays = (new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24) + 1;
    const availableDays = balance.rows[0]?.days_allowed || 0;
    const usedDays = parseInt(balance.rows[0]?.used_days || 0);
    const remainingDays = availableDays - usedDays;
    
    if (requestedDays > remainingDays) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: `Insufficient leave balance. Available: ${remainingDays} days, Requested: ${requestedDays} days` 
      });
    }
    
    // Check for overlapping leave requests
    const overlapping = await client.query(`
      SELECT id FROM leave_requests 
      WHERE employee_id = $1 
        AND status IN ('pending', 'approved')
        AND daterange(start_date, end_date, '[]') && daterange($2, $3, '[]')
    `, [employee_id, start_date, end_date]);
    
    if (overlapping.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Leave request overlaps with existing leave' });
    }
    
    const result = await client.query(
      `INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [employee_id, leave_type_id, start_date, end_date, reason]
    );
    
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error creating leave request', error: error.message });
  } finally {
    client.release();
  }
};

// Update leave request
exports.updateLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, reason } = req.body;
    
    const result = await pool.query(
      `UPDATE leave_requests 
       SET start_date = COALESCE($1, start_date),
           end_date = COALESCE($2, end_date),
           reason = COALESCE($3, reason),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND status = 'pending'
       RETURNING *`,
      [start_date, end_date, reason, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Leave request not found or cannot be updated' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating leave request', error: error.message });
  }
};

// Approve leave request
exports.approveLeave = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { comment } = req.body;
    
    await client.query('BEGIN');
    
    const result = await client.query(
      `UPDATE leave_requests 
       SET status = 'approved', 
           approval_comment = $1,
           approved_by = $2,
           approved_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND status = 'pending'
       RETURNING *`,
      [comment, req.user.id, id]
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Leave request not found or already processed' });
    }
    
    // Update employee status if leave is ongoing
    const leave = result.rows[0];
    const today = new Date().toISOString().split('T')[0];
    
    if (leave.start_date <= today && leave.end_date >= today) {
      await client.query(
        'UPDATE employees SET status = \'on_leave\' WHERE id = $1',
        [leave.employee_id]
      );
    }
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error approving leave', error: error.message });
  } finally {
    client.release();
  }
};

// Reject leave request
exports.rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    
    const result = await pool.query(
      `UPDATE leave_requests 
       SET status = 'rejected', 
           approval_comment = $1,
           approved_by = $2,
           approved_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND status = 'pending'
       RETURNING *`,
      [comment, req.user.id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Leave request not found or already processed' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting leave', error: error.message });
  }
};

// Get leave balance for employee
exports.getLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        lt.id, lt.name, lt.days_allowed,
        COALESCE(SUM(CASE WHEN l.status = 'approved' THEN 
          (EXTRACT(DAY FROM (l.end_date - l.start_date)) + 1) ELSE 0 END), 0) as used_days,
        lt.days_allowed - COALESCE(SUM(CASE WHEN l.status = 'approved' THEN 
          (EXTRACT(DAY FROM (l.end_date - l.start_date)) + 1) ELSE 0 END), 0) as remaining_days
      FROM leave_types lt
      LEFT JOIN leave_requests l ON lt.id = l.leave_type_id AND l.employee_id = $1
      GROUP BY lt.id, lt.name, lt.days_allowed
      ORDER BY lt.name
    `, [employeeId]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave balance', error: error.message });
  }
};

// Get leave types
exports.getLeaveTypes = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leave_types ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave types', error: error.message });
  }
};

// ==================== PAYROLL MANAGEMENT ====================

// Get payroll records
exports.getPayroll = async (req, res) => {
  try {
    const { month, employee_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT p.*, e.name as employee_name, e.employee_id, e.position,
             e.bank_name, e.bank_account
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (month) {
      query += ` AND DATE_TRUNC('month', p.payroll_month) = DATE_TRUNC('month', $1::date)`;
      params.push(`${month}-01`);
      paramIndex++;
    }
    
    if (employee_id) {
      query += ` AND p.employee_id = $${paramIndex}`;
      params.push(employee_id);
      paramIndex++;
    }
    
    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    const countQuery = 'SELECT COUNT(*) FROM payroll' + 
      (month || employee_id ? ' WHERE ' + 
        (month ? "DATE_TRUNC('month', payroll_month) = DATE_TRUNC('month', $1::date)" : '') + 
        (month && employee_id ? ' AND ' : '') +
        (employee_id ? 'employee_id = $' + (month ? '2' : '1') : '') : '');
    const countParams = [];
    if (month) countParams.push(`${month}-01`);
    if (employee_id) countParams.push(employee_id);
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      payroll: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payroll', error: error.message });
  }
};

// Get single payroll record
exports.getPayrollById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT p.*, e.name as employee_name, e.employee_id, e.position,
             e.bank_name, e.bank_account, e.bank_branch
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      WHERE p.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payroll record', error: error.message });
  }
};

// Generate payroll for a month
exports.generatePayroll = async (req, res) => {
  const client = await pool.connect();
  try {
    const { month } = req.body;
    
    await client.query('BEGIN');
    
    // Check if payroll already generated for this month
    const existing = await client.query(
      'SELECT COUNT(*) FROM payroll WHERE DATE_TRUNC(\'month\', payroll_month) = DATE_TRUNC(\'month\', $1::date)',
      [`${month}-01`]
    );
    
    if (parseInt(existing.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Payroll already generated for this month' });
    }
    
    // Get all active employees
    const employees = await client.query(
      'SELECT id, salary, name FROM employees WHERE status = \'active\''
    );
    
    const payrollRecords = [];
    
    for (const employee of employees.rows) {
      // Calculate allowances (20% of basic salary)
      const allowances = employee.salary * 0.2;
      
      // Calculate deductions (10% for NSSF, 5% for NHIF, 5% for other)
      const nssf = Math.min(employee.salary * 0.06, 2160); // Max NSSF contribution
      const nhif = calculateNHIF(employee.salary);
      const otherDeductions = employee.salary * 0.05;
      const deductions = nssf + nhif + otherDeductions;
      
      // Calculate PAYE (Tax)
      let paye = 0;
      const taxableIncome = employee.salary + allowances - deductions;
      if (taxableIncome > 0) {
        // Kenyan tax brackets (simplified)
        if (taxableIncome <= 24000) paye = taxableIncome * 0.1;
        else if (taxableIncome <= 32333) paye = 2400 + (taxableIncome - 24000) * 0.25;
        else paye = 4483.25 + (taxableIncome - 32333) * 0.3;
      }
      
      const netPay = employee.salary + allowances - deductions - paye;
      
      const result = await client.query(
        `INSERT INTO payroll (employee_id, payroll_month, basic_salary, allowances, 
         deductions, tax, net_pay, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING *`,
        [employee.id, `${month}-01`, employee.salary, allowances, deductions, paye, netPay]
      );
      
      payrollRecords.push(result.rows[0]);
    }
    
    await client.query('COMMIT');
    res.status(201).json({ 
      message: 'Payroll generated successfully', 
      records_generated: payrollRecords.length,
      payroll: payrollRecords
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error generating payroll', error: error.message });
  } finally {
    client.release();
  }
};

// Helper function to calculate NHIF contributions
function calculateNHIF(salary) {
  if (salary <= 5999) return 150;
  if (salary <= 7999) return 300;
  if (salary <= 11999) return 400;
  if (salary <= 14999) return 500;
  if (salary <= 19999) return 600;
  if (salary <= 24999) return 750;
  if (salary <= 29999) return 850;
  if (salary <= 34999) return 900;
  if (salary <= 39999) return 950;
  if (salary <= 44999) return 1000;
  if (salary <= 49999) return 1100;
  if (salary <= 59999) return 1200;
  if (salary <= 69999) return 1300;
  if (salary <= 79999) return 1400;
  if (salary <= 89999) return 1500;
  if (salary <= 99999) return 1600;
  return 1700;
}

// Process payroll payment
exports.processPayroll = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE payroll 
       SET status = 'paid', 
           paid_date = CURRENT_DATE,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Payroll record not found or already processed' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error processing payroll', error: error.message });
  }
};

// Get payroll reports
exports.getPayrollReports = async (req, res) => {
  try {
    const { year } = req.query;
    
    const result = await pool.query(`
      SELECT 
        DATE_TRUNC('month', payroll_month) as month,
        COUNT(*) as employee_count,
        SUM(basic_salary) as total_basic,
        SUM(allowances) as total_allowances,
        SUM(deductions) as total_deductions,
        SUM(tax) as total_tax,
        SUM(net_pay) as total_net_pay,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count
      FROM payroll
      WHERE EXTRACT(YEAR FROM payroll_month) = $1
      GROUP BY DATE_TRUNC('month', payroll_month)
      ORDER BY month DESC
    `, [year || new Date().getFullYear()]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error generating payroll report', error: error.message });
  }
};

// ==================== PERFORMANCE REVIEWS ====================

// Get all performance reviews
exports.getPerformanceReviews = async (req, res) => {
  try {
    const { employee_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT pr.*, e.name as employee_name, e.employee_id, e.position,
             r.name as reviewer_name, r.position as reviewer_position
      FROM performance_reviews pr
      JOIN employees e ON pr.employee_id = e.id
      JOIN employees r ON pr.reviewer_id = r.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (employee_id) {
      query += ` AND pr.employee_id = $${paramIndex}`;
      params.push(employee_id);
      paramIndex++;
    }
    
    query += ` ORDER BY pr.review_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    const countQuery = 'SELECT COUNT(*) FROM performance_reviews' + (employee_id ? ' WHERE employee_id = $1' : '');
    const countResult = await pool.query(countQuery, employee_id ? [employee_id] : []);
    
    res.json({
      reviews: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching performance reviews', error: error.message });
  }
};

// Get single performance review
exports.getPerformanceReview = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT pr.*, e.name as employee_name, e.employee_id, e.position,
             r.name as reviewer_name, r.position as reviewer_position
      FROM performance_reviews pr
      JOIN employees e ON pr.employee_id = e.id
      JOIN employees r ON pr.reviewer_id = r.id
      WHERE pr.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Performance review not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching performance review', error: error.message });
  }
};

// Create performance review
exports.createReview = async (req, res) => {
  try {
    const {
      employee_id, reviewer_id, review_date, review_period_start,
      review_period_end, rating, comments, goals, strengths, areas_for_improvement,
      overall_assessment, recommendations
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO performance_reviews (employee_id, reviewer_id, review_date, 
       review_period_start, review_period_end, rating, comments, goals, 
       strengths, areas_for_improvement, overall_assessment, recommendations, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'draft') RETURNING *`,
      [employee_id, reviewer_id, review_date, review_period_start, review_period_end,
       rating, comments, goals, strengths, areas_for_improvement, overall_assessment, recommendations]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error creating performance review', error: error.message });
  }
};

// Update performance review
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      rating, comments, goals, strengths, areas_for_improvement,
      overall_assessment, recommendations
    } = req.body;
    
    const result = await pool.query(
      `UPDATE performance_reviews 
       SET rating = COALESCE($1, rating),
           comments = COALESCE($2, comments),
           goals = COALESCE($3, goals),
           strengths = COALESCE($4, strengths),
           areas_for_improvement = COALESCE($5, areas_for_improvement),
           overall_assessment = COALESCE($6, overall_assessment),
           recommendations = COALESCE($7, recommendations),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND status = 'draft'
       RETURNING *`,
      [rating, comments, goals, strengths, areas_for_improvement, overall_assessment, recommendations, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Performance review not found or cannot be updated' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating performance review', error: error.message });
  }
};

// Submit performance review (finalize)
exports.submitReview = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE performance_reviews 
       SET status = 'submitted', 
           submitted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'draft'
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Performance review not found or already submitted' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error submitting performance review', error: error.message });
  }
};

// Get employee performance reviews
exports.getEmployeeReviews = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const result = await pool.query(`
      SELECT pr.*, r.name as reviewer_name, r.position as reviewer_position
      FROM performance_reviews pr
      JOIN employees r ON pr.reviewer_id = r.id
      WHERE pr.employee_id = $1
      ORDER BY pr.review_date DESC
    `, [employeeId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employee reviews', error: error.message });
  }
};