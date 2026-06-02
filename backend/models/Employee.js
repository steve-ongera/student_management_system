// backend/models/Employee.js
const pool = require('../config/database');

class Employee {
  static async findAll(filters = {}) {
    const { search, department, status } = filters;
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
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(`
      SELECT e.*, d.name as department_name, d.id as department_id
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async create(employeeData) {
    const {
      employee_id, name, email, phone, position,
      department_id, hire_date, salary, status
    } = employeeData;
    
    const result = await pool.query(
      `INSERT INTO employees (employee_id, name, email, phone, position, 
       department_id, hire_date, salary, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [employee_id, name, email, phone, position, department_id, hire_date, salary, status || 'active']
    );
    return result.rows[0];
  }

  static async update(id, employeeData) {
    const {
      name, email, phone, position, department_id, salary, status
    } = employeeData;
    
    const result = await pool.query(
      `UPDATE employees 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           position = COALESCE($4, position),
           department_id = COALESCE($5, department_id),
           salary = COALESCE($6, salary),
           status = COALESCE($7, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [name, email, phone, position, department_id, salary, status, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  static async getStats() {
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
    return result.rows[0];
  }

  static async getDepartments() {
    const result = await pool.query('SELECT * FROM departments ORDER BY name');
    return result.rows;
  }
}

module.exports = Employee;