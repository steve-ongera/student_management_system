// backend/controllers/studentsController.js
const pool = require('../config/database');

// Get all students with pagination and filters
exports.getStudents = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      class: className, 
      status,
      search 
    } = req.query;
    
    const offset = (page - 1) * limit;
    let query = `
      SELECT s.*, 
             COUNT(DISTINCT a.id) as attendance_count,
             (SELECT SUM(amount) FROM fee_payments WHERE student_id = s.id AND status = 'paid') as total_paid
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id
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
      query += ` AND (s.name ILIKE $${paramIndex} OR s.admission_number ILIKE $${paramIndex} OR s.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` GROUP BY s.id ORDER BY s.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
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
      countQuery += ` AND (name ILIKE $${countIndex} OR admission_number ILIKE $${countIndex})`;
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
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

// Get student by ID
exports.getStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT s.*, 
             json_agg(DISTINCT jsonb_build_object(
               'id', p.id, 'name', p.name, 'relationship', p.relationship,
               'phone', p.phone, 'email', p.email
             )) FILTER (WHERE p.id IS NOT NULL) as parents,
             (SELECT json_agg(jsonb_build_object(
               'id', fr.id, 'term', fr.term, 'amount', fr.amount,
               'paid', fr.paid, 'balance', fr.balance, 'due_date', fr.due_date
             )) FROM fee_records fr WHERE fr.student_id = s.id) as fee_records
      FROM students s
      LEFT JOIN student_parents sp ON s.id = sp.student_id
      LEFT JOIN parents p ON sp.parent_id = p.id
      WHERE s.id = $1
      GROUP BY s.id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student', error: error.message });
  }
};

// Get student by admission number
exports.getStudentByAdmission = async (req, res) => {
  try {
    const { admissionNumber } = req.params;
    const result = await pool.query(
      'SELECT * FROM students WHERE admission_number = $1',
      [admissionNumber]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student', error: error.message });
  }
};

// Create new student
exports.createStudent = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      name, email, phone, address, date_of_birth,
      gender, class: className, admission_number,
      parent_name, parent_phone, parent_email
    } = req.body;
    
    await client.query('BEGIN');
    
    // Generate admission number if not provided
    let admissionNo = admission_number;
    if (!admissionNo) {
      const year = new Date().getFullYear();
      const countResult = await client.query(
        "SELECT COUNT(*) FROM students WHERE EXTRACT(YEAR FROM created_at) = $1",
        [year]
      );
      admissionNo = `${year}${(parseInt(countResult.rows[0].count) + 1).toString().padStart(4, '0')}`;
    }
    
    // Create student
    const studentResult = await client.query(
      `INSERT INTO students (name, email, phone, address, date_of_birth, gender, 
       class, admission_number, parent_name, parent_phone, parent_email, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
       RETURNING *`,
      [name, email, phone, address, date_of_birth, gender, className, 
       admissionNo, parent_name, parent_phone, parent_email]
    );
    
    await client.query('COMMIT');
    res.status(201).json(studentResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error creating student', error: error.message });
  } finally {
    client.release();
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, email, phone, address, date_of_birth,
      gender, class: className, parent_name, parent_phone, parent_email
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
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 RETURNING *`,
      [name, email, phone, address, date_of_birth, gender, className,
       parent_name, parent_phone, parent_email, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating student', error: error.message });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting student', error: error.message });
  }
};

// Activate student
exports.activateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE students SET status = \'active\', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error activating student', error: error.message });
  }
};

// Deactivate student
exports.deactivateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE students SET status = \'inactive\', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error deactivating student', error: error.message });
  }
};

// Get students by class
exports.getStudentsByClass = async (req, res) => {
  try {
    const { className } = req.params;
    const result = await pool.query(
      'SELECT * FROM students WHERE class = $1 AND status = \'active\' ORDER BY name',
      [className]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students by class', error: error.message });
  }
};

// Search students
exports.searchStudents = async (req, res) => {
  try {
    const { query } = req.params;
    const result = await pool.query(
      `SELECT * FROM students 
       WHERE name ILIKE $1 
          OR admission_number ILIKE $1 
          OR email ILIKE $1
          OR parent_name ILIKE $1
       LIMIT 20`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error searching students', error: error.message });
  }
};

// Get student stats
exports.getStudentStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_students,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_students,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_students,
        COUNT(CASE WHEN gender = 'Male' THEN 1 END) as male_students,
        COUNT(CASE WHEN gender = 'Female' THEN 1 END) as female_students,
        json_object_agg(class, count) FILTER (WHERE class IS NOT NULL) as students_by_class
      FROM (
        SELECT status, gender, class, COUNT(*) as count
        FROM students
        GROUP BY status, gender, class
      ) sub
    `);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student stats', error: error.message });
  }
};

// Get academic records
exports.getAcademicRecords = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT * FROM academic_records 
      WHERE student_id = $1 
      ORDER BY year DESC, term DESC
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching academic records', error: error.message });
  }
};

// Add academic record
exports.addAcademicRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { term, year, subjects, total_marks, average, grade, position } = req.body;
    
    const result = await pool.query(
      `INSERT INTO academic_records (student_id, term, year, subjects, total_marks, average, grade, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, term, year, JSON.stringify(subjects), total_marks, average, grade, position]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error adding academic record', error: error.message });
  }
};

// Update academic record
exports.updateAcademicRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { subjects, total_marks, average, grade, position } = req.body;
    
    const result = await pool.query(
      `UPDATE academic_records 
       SET subjects = COALESCE($1, subjects),
           total_marks = COALESCE($2, total_marks),
           average = COALESCE($3, average),
           grade = COALESCE($4, grade),
           position = COALESCE($5, position),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [subjects ? JSON.stringify(subjects) : null, total_marks, average, grade, position, recordId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Academic record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating academic record', error: error.message });
  }
};

// Get attendance
exports.getAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;
    
    let query = 'SELECT * FROM attendance WHERE student_id = $1';
    const params = [id];
    
    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`;
      params.push(month, year);
    }
    
    query += ' ORDER BY date DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance', error: error.message });
  }
};

// Mark attendance
exports.markAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, status, remarks } = req.body;
    
    // Check if attendance already exists for this date
    const existing = await pool.query(
      'SELECT id FROM attendance WHERE student_id = $1 AND date = $2',
      [id, date]
    );
    
    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        `UPDATE attendance 
         SET status = $1, remarks = $2, updated_at = CURRENT_TIMESTAMP
         WHERE student_id = $3 AND date = $4 RETURNING *`,
        [status, remarks, id, date]
      );
    } else {
      result = await pool.query(
        `INSERT INTO attendance (student_id, date, status, remarks)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [id, date, status, remarks]
      );
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error marking attendance', error: error.message });
  }
};

// Get fee records
exports.getFeeRecords = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT fr.*, 
             (SELECT COALESCE(SUM(amount), 0) FROM fee_payments WHERE fee_record_id = fr.id AND status = 'paid') as paid_amount
      FROM fee_records fr
      WHERE fr.student_id = $1
      ORDER BY fr.due_date DESC
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fee records', error: error.message });
  }
};

// Pay fees
exports.payFees = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { amount, payment_method, reference_number, notes } = req.body;
    
    await client.query('BEGIN');
    
    // Create payment record
    const paymentResult = await client.query(
      `INSERT INTO fee_payments (student_id, amount, payment_method, reference_number, notes, status)
       VALUES ($1, $2, $3, $4, $5, 'paid') RETURNING *`,
      [id, amount, payment_method, reference_number, notes]
    );
    
    // Update fee record balance
    await client.query(
      `UPDATE fee_records 
       SET paid = paid + $1, balance = total - paid - $1
       WHERE student_id = $2 AND balance > 0 
       ORDER BY due_date ASC 
       LIMIT 1`,
      [amount, id]
    );
    
    await client.query('COMMIT');
    res.status(201).json(paymentResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error processing payment', error: error.message });
  } finally {
    client.release();
  }
};

// Get fee balance
exports.getFeeBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        SUM(total) as total_fees,
        SUM(paid) as total_paid,
        SUM(balance) as total_balance
      FROM fee_records
      WHERE student_id = $1
    `, [id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fee balance', error: error.message });
  }
};

// Get documents
exports.getDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM student_documents WHERE student_id = $1 ORDER BY created_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching documents', error: error.message });
  }
};

// Upload document
exports.uploadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { document_type, title, description } = req.body;
    
    // In production, you would handle file upload here
    const file_url = req.file ? req.file.path : null;
    
    const result = await pool.query(
      `INSERT INTO student_documents (student_id, document_type, title, description, file_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, document_type, title, description, file_url]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error uploading document', error: error.message });
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const result = await pool.query('DELETE FROM student_documents WHERE id = $1 RETURNING *', [documentId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting document', error: error.message });
  }
};

// Get parents/guardians
exports.getParents = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT p.*, sp.relationship, sp.is_primary
      FROM parents p
      JOIN student_parents sp ON p.id = sp.parent_id
      WHERE sp.student_id = $1
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching parents', error: error.message });
  }
};

// Add parent/guardian
exports.addParent = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { name, email, phone, address, relationship, is_primary } = req.body;
    
    await client.query('BEGIN');
    
    // Create parent
    const parentResult = await client.query(
      `INSERT INTO parents (name, email, phone, address)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, email, phone, address]
    );
    
    // Link parent to student
    await client.query(
      `INSERT INTO student_parents (student_id, parent_id, relationship, is_primary)
       VALUES ($1, $2, $3, $4)`,
      [id, parentResult.rows[0].id, relationship, is_primary || false]
    );
    
    // Update student's primary parent info if is_primary
    if (is_primary) {
      await client.query(
        `UPDATE students 
         SET parent_name = $1, parent_email = $2, parent_phone = $3
         WHERE id = $4`,
        [name, email, phone, id]
      );
    }
    
    await client.query('COMMIT');
    res.status(201).json(parentResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error adding parent', error: error.message });
  } finally {
    client.release();
  }
};

// Update parent
exports.updateParent = async (req, res) => {
  try {
    const { parentId } = req.params;
    const { name, email, phone, address, relationship, is_primary } = req.body;
    
    const result = await pool.query(
      `UPDATE parents 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [name, email, phone, address, parentId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Parent not found' });
    }
    
    // Update relationship in student_parents
    if (relationship) {
      await pool.query(
        'UPDATE student_parents SET relationship = $1, is_primary = $2 WHERE parent_id = $3',
        [relationship, is_primary, parentId]
      );
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating parent', error: error.message });
  }
};

// Delete parent
exports.deleteParent = async (req, res) => {
  const client = await pool.connect();
  try {
    const { parentId } = req.params;
    
    await client.query('BEGIN');
    
    // Delete relationship
    await client.query('DELETE FROM student_parents WHERE parent_id = $1', [parentId]);
    
    // Delete parent
    const result = await client.query('DELETE FROM parents WHERE id = $1 RETURNING *', [parentId]);
    
    await client.query('COMMIT');
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Parent not found' });
    }
    
    res.json({ message: 'Parent deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error deleting parent', error: error.message });
  } finally {
    client.release();
  }
};