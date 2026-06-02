// backend/models/Student.js
const pool = require('../config/database');

class Student {
  static async findAll(filters = {}) {
    const { page = 1, limit = 10, class: className, status, search } = filters;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT s.*, 
             COUNT(DISTINCT a.id) as attendance_count,
             (SELECT COALESCE(SUM(amount), 0) FROM fee_payments WHERE student_id = s.id AND status = 'paid') as total_paid,
             (SELECT COALESCE(SUM(total), 0) - COALESCE(SUM(paid), 0) FROM fee_records WHERE student_id = s.id) as total_balance
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
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(`
      SELECT s.*, 
             json_agg(DISTINCT jsonb_build_object(
               'id', p.id, 'name', p.name, 'relationship', p.relationship,
               'phone', p.phone, 'email', p.email, 'is_primary', sp.is_primary
             )) FILTER (WHERE p.id IS NOT NULL) as parents,
             (SELECT json_agg(jsonb_build_object(
               'id', fr.id, 'term', fr.term, 'year', fr.year, 'amount', fr.amount,
               'paid', fr.paid, 'balance', fr.balance, 'due_date', fr.due_date, 'status', fr.status
             )) FROM fee_records fr WHERE fr.student_id = s.id) as fee_records,
             (SELECT json_agg(jsonb_build_object(
               'id', ar.id, 'term', ar.term, 'year', ar.year, 'subjects', ar.subjects,
               'total_marks', ar.total_marks, 'average', ar.average, 'grade', ar.grade, 'position', ar.position
             )) FROM academic_records ar WHERE ar.student_id = s.id ORDER BY ar.year DESC, ar.term DESC) as academic_records
      FROM students s
      LEFT JOIN student_parents sp ON s.id = sp.student_id
      LEFT JOIN parents p ON sp.parent_id = p.id
      WHERE s.id = $1
      GROUP BY s.id
    `, [id]);
    
    return result.rows[0];
  }

  static async findByAdmissionNumber(admissionNumber) {
    const result = await pool.query(
      'SELECT * FROM students WHERE admission_number = $1',
      [admissionNumber]
    );
    return result.rows[0];
  }

  static async create(studentData) {
    const {
      name, email, phone, address, date_of_birth, gender,
      class: className, admission_number, parent_name, parent_phone, parent_email
    } = studentData;
    
    const result = await pool.query(
      `INSERT INTO students (name, email, phone, address, date_of_birth, gender, 
       class, admission_number, parent_name, parent_phone, parent_email, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
       RETURNING *`,
      [name, email, phone, address, date_of_birth, gender, className,
       admission_number, parent_name, parent_phone, parent_email]
    );
    return result.rows[0];
  }

  static async update(id, studentData) {
    const {
      name, email, phone, address, date_of_birth, gender,
      class: className, parent_name, parent_phone, parent_email, status
    } = studentData;
    
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
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const result = await pool.query(
      'UPDATE students SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  static async getStats() {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
        COUNT(CASE WHEN gender = 'Male' THEN 1 END) as male,
        COUNT(CASE WHEN gender = 'Female' THEN 1 END) as female,
        json_object_agg(class, count ORDER BY class) as by_class
      FROM (
        SELECT class, COUNT(*) as count
        FROM students
        WHERE status = 'active'
        GROUP BY class
      ) sub
    `);
    return result.rows[0];
  }

  static async getByClass(className) {
    const result = await pool.query(
      'SELECT * FROM students WHERE class = $1 AND status = \'active\' ORDER BY name',
      [className]
    );
    return result.rows;
  }

  static async search(query) {
    const result = await pool.query(
      `SELECT * FROM students 
       WHERE name ILIKE $1 
          OR admission_number ILIKE $1 
          OR email ILIKE $1
          OR parent_name ILIKE $1
       LIMIT 20`,
      [`%${query}%`]
    );
    return result.rows;
  }

  static async getFeeBalance(id) {
    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(total), 0) as total_fees,
        COALESCE(SUM(paid), 0) as total_paid,
        COALESCE(SUM(balance), 0) as total_balance
      FROM fee_records
      WHERE student_id = $1
    `, [id]);
    return result.rows[0];
  }

  static async addFeeRecord(studentId, feeData) {
    const { term, year, amount, due_date, description } = feeData;
    const result = await pool.query(
      `INSERT INTO fee_records (student_id, term, year, amount, paid, balance, due_date, description, status)
       VALUES ($1, $2, $3, $4, 0, $4, $5, $6, 'pending') RETURNING *`,
      [studentId, term, year, amount, due_date, description]
    );
    return result.rows[0];
  }

  static async addPayment(studentId, paymentData) {
    const { amount, payment_method, reference_number, notes } = paymentData;
    const result = await pool.query(
      `INSERT INTO fee_payments (student_id, amount, payment_method, reference_number, notes, status, payment_date)
       VALUES ($1, $2, $3, $4, $5, 'completed', CURRENT_DATE) RETURNING *`,
      [studentId, amount, payment_method, reference_number, notes]
    );
    return result.rows[0];
  }

  static async getAttendance(id, month, year) {
    let query = 'SELECT * FROM attendance WHERE student_id = $1';
    const params = [id];
    
    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`;
      params.push(month, year);
    }
    
    query += ' ORDER BY date DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async markAttendance(studentId, attendanceData) {
    const { date, status, remarks } = attendanceData;
    
    const existing = await pool.query(
      'SELECT id FROM attendance WHERE student_id = $1 AND date = $2',
      [studentId, date]
    );
    
    if (existing.rows.length > 0) {
      const result = await pool.query(
        `UPDATE attendance 
         SET status = $1, remarks = $2, updated_at = CURRENT_TIMESTAMP
         WHERE student_id = $3 AND date = $4 RETURNING *`,
        [status, remarks, studentId, date]
      );
      return result.rows[0];
    } else {
      const result = await pool.query(
        `INSERT INTO attendance (student_id, date, status, remarks)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [studentId, date, status, remarks]
      );
      return result.rows[0];
    }
  }

  static async addAcademicRecord(studentId, recordData) {
    const { term, year, subjects, total_marks, average, grade, position } = recordData;
    const result = await pool.query(
      `INSERT INTO academic_records (student_id, term, year, subjects, total_marks, average, grade, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [studentId, term, year, JSON.stringify(subjects), total_marks, average, grade, position]
    );
    return result.rows[0];
  }

  static async getAcademicRecords(id) {
    const result = await pool.query(
      `SELECT * FROM academic_records 
       WHERE student_id = $1 
       ORDER BY year DESC, term DESC`,
      [id]
    );
    return result.rows;
  }

  static async addParent(studentId, parentData) {
    const client = await pool.getClient();
    try {
      await client.query('BEGIN');
      
      const { name, email, phone, address, relationship, is_primary } = parentData;
      
      const parentResult = await client.query(
        `INSERT INTO parents (name, email, phone, address)
         VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING *`,
        [name, email, phone, address]
      );
      
      await client.query(
        `INSERT INTO student_parents (student_id, parent_id, relationship, is_primary)
         VALUES ($1, $2, $3, $4) ON CONFLICT (student_id, parent_id) DO NOTHING`,
        [studentId, parentResult.rows[0].id, relationship, is_primary || false]
      );
      
      if (is_primary) {
        await client.query(
          `UPDATE students 
           SET parent_name = $1, parent_email = $2, parent_phone = $3
           WHERE id = $4`,
          [name, email, phone, studentId]
        );
      }
      
      await client.query('COMMIT');
      return parentResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getParents(id) {
    const result = await pool.query(`
      SELECT p.*, sp.relationship, sp.is_primary
      FROM parents p
      JOIN student_parents sp ON p.id = sp.parent_id
      WHERE sp.student_id = $1
    `, [id]);
    return result.rows;
  }
}

module.exports = Student;