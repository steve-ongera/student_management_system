// backend/controllers/healthController.js
const pool = require('../config/database');

// Medical Records
exports.getMedicalRecords = async (req, res) => {
  try {
    const { student_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT mr.*, s.name as student_name, s.admission_number
      FROM medical_records mr
      JOIN students s ON mr.student_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (student_id) {
      query += ` AND mr.student_id = $${paramIndex}`;
      params.push(student_id);
      paramIndex++;
    }
    
    query += ` ORDER BY mr.record_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    const countQuery = 'SELECT COUNT(*) FROM medical_records' + (student_id ? ' WHERE student_id = $1' : '');
    const countResult = await pool.query(countQuery, student_id ? [student_id] : []);
    
    res.json({
      records: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching medical records', error: error.message });
  }
};

exports.getMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT mr.*, s.name as student_name, s.admission_number, s.class
      FROM medical_records mr
      JOIN students s ON mr.student_id = s.id
      WHERE mr.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Medical record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching medical record', error: error.message });
  }
};

exports.getStudentMedicalHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await pool.query(`
      SELECT * FROM medical_records 
      WHERE student_id = $1 
      ORDER BY record_date DESC
    `, [studentId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student medical history', error: error.message });
  }
};

exports.createMedicalRecord = async (req, res) => {
  try {
    const {
      student_id, record_type, diagnosis, prescription,
      doctor_name, record_date, notes
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO medical_records (student_id, record_type, diagnosis, prescription, doctor_name, record_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [student_id, record_type, diagnosis, prescription, doctor_name, record_date, notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error creating medical record', error: error.message });
  }
};

exports.updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnosis, prescription, notes } = req.body;
    
    const result = await pool.query(
      `UPDATE medical_records 
       SET diagnosis = COALESCE($1, diagnosis),
           prescription = COALESCE($2, prescription),
           notes = COALESCE($3, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [diagnosis, prescription, notes, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Medical record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating medical record', error: error.message });
  }
};

exports.deleteMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM medical_records WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Medical record not found' });
    }
    
    res.json({ message: 'Medical record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting medical record', error: error.message });
  }
};

// Clinic Visits
exports.getClinicVisits = async (req, res) => {
  try {
    const { date, student_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT cv.*, s.name as student_name, s.admission_number, s.class
      FROM clinic_visits cv
      JOIN students s ON cv.student_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (date) {
      query += ` AND cv.visit_date = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }
    
    if (student_id) {
      query += ` AND cv.student_id = $${paramIndex}`;
      params.push(student_id);
      paramIndex++;
    }
    
    query += ` ORDER BY cv.visit_date DESC, cv.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching clinic visits', error: error.message });
  }
};

exports.getClinicVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT cv.*, s.name as student_name, s.admission_number, s.class, s.parent_phone
      FROM clinic_visits cv
      JOIN students s ON cv.student_id = s.id
      WHERE cv.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Clinic visit not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching clinic visit', error: error.message });
  }
};

exports.getDailyVisits = async (req, res) => {
  try {
    const { date } = req.query;
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN referred = true THEN 1 END) as referred,
        COUNT(CASE WHEN referred = false THEN 1 END) as treated
      FROM clinic_visits
      WHERE visit_date = $1
    `, [date || new Date().toISOString().split('T')[0]]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching daily visits', error: error.message });
  }
};

exports.getVisitStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const result = await pool.query(`
      SELECT 
        DATE(visit_date) as date,
        COUNT(*) as total_visits,
        COUNT(CASE WHEN referred = true THEN 1 END) as referrals,
        json_agg(jsonb_build_object(
          'student_name', s.name,
          'diagnosis', cv.diagnosis,
          'referred', cv.referred
        )) as visits
      FROM clinic_visits cv
      JOIN students s ON cv.student_id = s.id
      WHERE visit_date BETWEEN $1 AND $2
      GROUP BY DATE(visit_date)
      ORDER BY date DESC
    `, [start_date, end_date]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching visit stats', error: error.message });
  }
};

exports.createClinicVisit = async (req, res) => {
  try {
    const {
      student_id, visit_date, symptoms, diagnosis,
      treatment, referred, referred_to, notes
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO clinic_visits (student_id, visit_date, symptoms, diagnosis, treatment, referred, referred_to, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [student_id, visit_date, symptoms, diagnosis, treatment, referred || false, referred_to, notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error creating clinic visit', error: error.message });
  }
};

exports.updateClinicVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const { symptoms, diagnosis, treatment, referred, referred_to, notes } = req.body;
    
    const result = await pool.query(
      `UPDATE clinic_visits 
       SET symptoms = COALESCE($1, symptoms),
           diagnosis = COALESCE($2, diagnosis),
           treatment = COALESCE($3, treatment),
           referred = COALESCE($4, referred),
           referred_to = COALESCE($5, referred_to),
           notes = COALESCE($6, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [symptoms, diagnosis, treatment, referred, referred_to, notes, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Clinic visit not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating clinic visit', error: error.message });
  }
};

// Emergency Contacts
exports.getEmergencyContacts = async (req, res) => {
  try {
    const { student_id } = req.query;
    let query = `
      SELECT ec.*, s.name as student_name, s.admission_number
      FROM emergency_contacts ec
      JOIN students s ON ec.student_id = s.id
    `;
    const params = [];
    
    if (student_id) {
      query += ` WHERE ec.student_id = $1`;
      params.push(student_id);
    }
    
    query += ` ORDER BY ec.name`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching emergency contacts', error: error.message });
  }
};

exports.getEmergencyContact = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT ec.*, s.name as student_name, s.admission_number
      FROM emergency_contacts ec
      JOIN students s ON ec.student_id = s.id
      WHERE ec.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Emergency contact not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching emergency contact', error: error.message });
  }
};

exports.getStudentEmergencyContacts = async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await pool.query(
      'SELECT * FROM emergency_contacts WHERE student_id = $1 ORDER BY name',
      [studentId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student emergency contacts', error: error.message });
  }
};

exports.createEmergencyContact = async (req, res) => {
  try {
    const { student_id, name, relationship, phone, alternate_phone, address } = req.body;
    
    const result = await pool.query(
      `INSERT INTO emergency_contacts (student_id, name, relationship, phone, alternate_phone, address)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [student_id, name, relationship, phone, alternate_phone, address]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error creating emergency contact', error: error.message });
  }
};

exports.updateEmergencyContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, relationship, phone, alternate_phone, address } = req.body;
    
    const result = await pool.query(
      `UPDATE emergency_contacts 
       SET name = COALESCE($1, name),
           relationship = COALESCE($2, relationship),
           phone = COALESCE($3, phone),
           alternate_phone = COALESCE($4, alternate_phone),
           address = COALESCE($5, address),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [name, relationship, phone, alternate_phone, address, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Emergency contact not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating emergency contact', error: error.message });
  }
};

exports.deleteEmergencyContact = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM emergency_contacts WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Emergency contact not found' });
    }
    
    res.json({ message: 'Emergency contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting emergency contact', error: error.message });
  }
};

// Prescriptions
exports.getPrescriptions = async (req, res) => {
  try {
    const { student_id } = req.query;
    let query = `
      SELECT p.*, s.name as student_name, cv.visit_date
      FROM prescriptions p
      JOIN clinic_visits cv ON p.clinic_visit_id = cv.id
      JOIN students s ON cv.student_id = s.id
    `;
    const params = [];
    
    if (student_id) {
      query += ` WHERE s.id = $1`;
      params.push(student_id);
    }
    
    query += ` ORDER BY p.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching prescriptions', error: error.message });
  }
};

exports.createPrescription = async (req, res) => {
  try {
    const { clinic_visit_id, medication, dosage, frequency, duration, notes } = req.body;
    
    const result = await pool.query(
      `INSERT INTO prescriptions (clinic_visit_id, medication, dosage, frequency, duration, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [clinic_visit_id, medication, dosage, frequency, duration, notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error creating prescription', error: error.message });
  }
};

// Health Reports
exports.getHealthReports = async (req, res) => {
  try {
    const { type, start_date, end_date } = req.query;
    
    let reportData = {};
    
    switch (type) {
      case 'monthly-summary':
        const monthly = await pool.query(`
          SELECT 
            DATE_TRUNC('month', visit_date) as month,
            COUNT(*) as total_visits,
            COUNT(CASE WHEN referred = true THEN 1 END) as referrals,
            AVG(CASE WHEN referred = false THEN 1 ELSE 0 END) * 100 as treatment_rate
          FROM clinic_visits
          WHERE visit_date BETWEEN $1 AND $2
          GROUP BY DATE_TRUNC('month', visit_date)
          ORDER BY month DESC
        `, [start_date, end_date]);
        reportData = monthly.rows;
        break;
        
      case 'common-diagnoses':
        const diagnoses = await pool.query(`
          SELECT 
            diagnosis,
            COUNT(*) as frequency,
            ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
          FROM clinic_visits
          WHERE diagnosis IS NOT NULL
          GROUP BY diagnosis
          ORDER BY frequency DESC
          LIMIT 10
        `);
        reportData = diagnoses.rows;
        break;
        
      default:
        reportData = { message: 'Please specify report type: monthly-summary or common-diagnoses' };
    }
    
    res.json(reportData);
  } catch (error) {
    res.status(500).json({ message: 'Error generating health report', error: error.message });
  }
};

exports.generateHealthReport = async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json', start_date, end_date } = req.query;
    
    let reportData;
    
    if (type === 'student-health-summary') {
      const result = await pool.query(`
        SELECT 
          s.id, s.name, s.admission_number, s.class,
          COUNT(DISTINCT cv.id) as clinic_visits,
          COUNT(DISTINCT mr.id) as medical_records,
          COUNT(DISTINCT ec.id) as emergency_contacts
        FROM students s
        LEFT JOIN clinic_visits cv ON s.id = cv.student_id AND cv.visit_date BETWEEN $1 AND $2
        LEFT JOIN medical_records mr ON s.id = mr.student_id
        LEFT JOIN emergency_contacts ec ON s.id = ec.student_id
        WHERE s.status = 'active'
        GROUP BY s.id
        ORDER BY clinic_visits DESC
      `, [start_date, end_date]);
      reportData = result.rows;
    }
    
    if (format === 'json') {
      res.json(reportData);
    } else {
      res.json({ message: 'Report generation for ' + format + ' coming soon' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error generating health report', error: error.message });
  }
};