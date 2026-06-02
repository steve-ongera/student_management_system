// backend/routes/students.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all students with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, class: className, status, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT s.*, 
             COUNT(DISTINCT b.id) as total_borrowings,
             COUNT(DISTINCT CASE WHEN b.return_date IS NULL THEN b.id END) as active_borrowings
      FROM students s
      LEFT JOIN borrowings b ON s.id = b.student_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (className) {
      query += ` AND s.class = $${paramIndex}`;
      params.push(className);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND s.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (s.name ILIKE $${paramIndex} OR s.admission_number ILIKE $${paramIndex} OR s.email ILIKE $${paramIndex} OR s.parent_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` GROUP BY s.id ORDER BY s.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM students WHERE 1=1';
    const countParams = [];
    let countIndex = 1;
    
    if (className) {
      countQuery += ` AND class = $${countIndex}`;
      countParams.push(className);
      countIndex++;
    }
    
    if (status) {
      countQuery += ` AND status = $${countIndex}`;
      countParams.push(status);
      countIndex++;
    }
    
    if (search) {
      countQuery += ` AND (name ILIKE $${countIndex} OR admission_number ILIKE $${countIndex} OR email ILIKE $${countIndex} OR parent_name ILIKE $${countIndex})`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      students: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

// Get student statistics
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
        COUNT(CASE WHEN gender = 'Male' THEN 1 END) as male,
        COUNT(CASE WHEN gender = 'Female' THEN 1 END) as female
      FROM students
    `);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching student stats:', error);
    res.status(500).json({ message: 'Error fetching student stats', error: error.message });
  }
});

// Get single student by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM students WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Error fetching student', error: error.message });
  }
});

// Create new student
router.post('/', async (req, res) => {
  try {
    const {
      admission_number, name, email, phone, address, date_of_birth,
      gender, class: className, parent_name, parent_phone, parent_email, status
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO students (admission_number, name, email, phone, address, date_of_birth, 
       gender, class, parent_name, parent_phone, parent_email, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [admission_number, name, email, phone, address, date_of_birth, gender, className,
       parent_name, parent_phone, parent_email, status || 'active']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ message: 'Error creating student', error: error.message });
  }
});

// Update student
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, email, phone, address, date_of_birth, gender,
      class: className, parent_name, parent_phone, parent_email, status
    } = req.body;
    
    const result = await pool.query(
      `UPDATE students 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address),
           date_of_birth = COALESCE($5, date_of_birth),
           gender = COALESCE($6, gender),
           class = COALESCE($7, class),
           parent_name = COALESCE($8, parent_name),
           parent_phone = COALESCE($9, parent_phone),
           parent_email = COALESCE($10, parent_email),
           status = COALESCE($11, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $12 RETURNING *`,
      [name, email, phone, address, date_of_birth, gender, className,
       parent_name, parent_phone, parent_email, status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Error updating student', error: error.message });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Error deleting student', error: error.message });
  }
});

module.exports = router;