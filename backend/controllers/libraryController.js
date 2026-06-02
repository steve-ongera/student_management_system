// backend/controllers/libraryController.js
const pool = require('../config/database');

// ==================== BOOK MANAGEMENT ====================

// Get all books with pagination, search and filters
exports.getBooks = async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT b.*, 
             COUNT(DISTINCT br.id) as borrowed_count,
             COUNT(CASE WHEN br.return_date IS NULL THEN 1 END) as currently_borrowed
      FROM books b
      LEFT JOIN borrowings br ON b.id = br.book_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      query += ` AND (b.title ILIKE $${paramIndex} OR b.author ILIKE $${paramIndex} OR b.isbn ILIKE $${paramIndex} OR b.publisher ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (category) {
      query += ` AND b.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (status === 'available') {
      query += ` AND b.available_copies > 0`;
    } else if (status === 'unavailable') {
      query += ` AND b.available_copies = 0`;
    }
    
    query += ` GROUP BY b.id ORDER BY b.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM books WHERE 1=1';
    const countParams = [];
    let countIndex = 1;
    
    if (search) {
      countQuery += ` AND (title ILIKE $${countIndex} OR author ILIKE $${countIndex} OR isbn ILIKE $${countIndex})`;
      countParams.push(`%${search}%`);
      countIndex++;
    }
    
    if (category) {
      countQuery += ` AND category = $${countIndex}`;
      countParams.push(category);
      countIndex++;
    }
    
    if (status === 'available') {
      countQuery += ` AND available_copies > 0`;
    } else if (status === 'unavailable') {
      countQuery += ` AND available_copies = 0`;
    }
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      books: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching books', error: error.message });
  }
};

// Get single book by ID
exports.getBook = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT b.*,
             (SELECT json_agg(jsonb_build_object(
               'id', br.id, 'student_name', s.name, 'admission_number', s.admission_number,
               'borrow_date', br.borrow_date, 'due_date', br.due_date, 'return_date', br.return_date
             )) FROM borrowings br 
             LEFT JOIN students s ON br.student_id = s.id
             WHERE br.book_id = b.id AND br.return_date IS NULL
             ORDER BY br.borrow_date DESC LIMIT 5) as current_borrowings,
             (SELECT COUNT(*) FROM borrowings WHERE book_id = b.id) as total_borrowings
      FROM books b
      WHERE b.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching book', error: error.message });
  }
};

// Get book by ISBN
exports.getBookByISBN = async (req, res) => {
  try {
    const { isbn } = req.params;
    const result = await pool.query('SELECT * FROM books WHERE isbn = $1', [isbn]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching book', error: error.message });
  }
};

// Create new book
exports.createBook = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      title, author, isbn, category, publisher, publication_year,
      edition, pages, language, total_copies, location, description,
      shelf_number, rack_number
    } = req.body;
    
    await client.query('BEGIN');
    
    // Check if ISBN already exists
    if (isbn) {
      const existing = await client.query(
        'SELECT id FROM books WHERE isbn = $1',
        [isbn]
      );
      
      if (existing.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Book with this ISBN already exists' });
      }
    }
    
    const result = await client.query(
      `INSERT INTO books (title, author, isbn, category, publisher, publication_year,
       edition, pages, language, total_copies, available_copies, location, description, shelf_number, rack_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, $11, $12, $13, $14) RETURNING *`,
      [title, author, isbn, category, publisher, publication_year, edition, pages,
       language, total_copies, location, description, shelf_number, rack_number]
    );
    
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error creating book', error: error.message });
  } finally {
    client.release();
  }
};

// Update book
exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, author, isbn, category, publisher, publication_year,
      edition, pages, language, total_copies, location, description,
      shelf_number, rack_number, status
    } = req.body;
    
    // Get current book to check available_copies constraint
    const currentBook = await pool.query('SELECT available_copies, total_copies FROM books WHERE id = $1', [id]);
    
    if (currentBook.rows.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    let newTotalCopies = total_copies || currentBook.rows[0].total_copies;
    let newAvailableCopies = currentBook.rows[0].available_copies;
    
    // If total copies changed, adjust available copies
    if (total_copies && total_copies !== currentBook.rows[0].total_copies) {
      const diff = total_copies - currentBook.rows[0].total_copies;
      newAvailableCopies = currentBook.rows[0].available_copies + diff;
    }
    
    const result = await pool.query(
      `UPDATE books 
       SET title = COALESCE($1, title),
           author = COALESCE($2, author),
           isbn = COALESCE($3, isbn),
           category = COALESCE($4, category),
           publisher = COALESCE($5, publisher),
           publication_year = COALESCE($6, publication_year),
           edition = COALESCE($7, edition),
           pages = COALESCE($8, pages),
           language = COALESCE($9, language),
           total_copies = COALESCE($10, total_copies),
           available_copies = $11,
           location = COALESCE($12, location),
           description = COALESCE($13, description),
           shelf_number = COALESCE($14, shelf_number),
           rack_number = COALESCE($15, rack_number),
           status = COALESCE($16, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $17 RETURNING *`,
      [title, author, isbn, category, publisher, publication_year, edition, pages,
       language, newTotalCopies, newAvailableCopies, location, description, shelf_number,
       rack_number, status, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating book', error: error.message });
  }
};

// Delete book
exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if book has any borrowings
    const borrowings = await pool.query(
      'SELECT COUNT(*) FROM borrowings WHERE book_id = $1 AND return_date IS NULL',
      [id]
    );
    
    if (parseInt(borrowings.rows[0].count) > 0) {
      return res.status(400).json({ message: 'Cannot delete book with active borrowings' });
    }
    
    const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting book', error: error.message });
  }
};

// Search books
exports.searchBooks = async (req, res) => {
  try {
    const { query, category, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let sqlQuery = `
      SELECT b.*, 
             CASE WHEN b.available_copies > 0 THEN 'Available' ELSE 'Borrowed' END as availability
      FROM books b
      WHERE (b.title ILIKE $1 OR b.author ILIKE $1 OR b.isbn ILIKE $1 OR b.publisher ILIKE $1)
    `;
    const params = [`%${query}%`];
    let paramIndex = 2;
    
    if (category) {
      sqlQuery += ` AND b.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    sqlQuery += ` ORDER BY b.title LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(sqlQuery, params);
    
    res.json({
      books: result.rows,
      page: parseInt(page),
      limit: parseInt(limit),
      total: result.rows.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error searching books', error: error.message });
  }
};

// Get book categories
exports.getBookCategories = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT category, COUNT(*) as count 
      FROM books 
      WHERE category IS NOT NULL 
      GROUP BY category 
      ORDER BY category
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

// Get book statistics
exports.getBookStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_books,
        SUM(total_copies) as total_copies,
        SUM(available_copies) as available_copies,
        COUNT(DISTINCT category) as categories,
        COUNT(DISTINCT author) as authors,
        COUNT(CASE WHEN available_copies = 0 THEN 1 END) as out_of_stock
      FROM books
    `);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching book stats', error: error.message });
  }
};

// ==================== BORROWING MANAGEMENT ====================

// Get all borrowings
exports.getBorrowings = async (req, res) => {
  try {
    const { status, student_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT b.*, s.name as student_name, s.admission_number, s.class,
             bk.title as book_title, bk.author as book_author, bk.isbn,
             CASE 
               WHEN b.return_date IS NOT NULL THEN 'Returned'
               WHEN b.due_date < CURRENT_DATE THEN 'Overdue'
               WHEN b.due_date >= CURRENT_DATE THEN 'Active'
               ELSE 'Pending'
             END as status_text,
             (SELECT COUNT(*) FROM fines WHERE borrowing_id = b.id AND status = 'pending') as has_fine
      FROM borrowings b
      JOIN students s ON b.student_id = s.id
      JOIN books bk ON b.book_id = bk.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (status === 'active') {
      query += ` AND b.return_date IS NULL`;
    } else if (status === 'returned') {
      query += ` AND b.return_date IS NOT NULL`;
    } else if (status === 'overdue') {
      query += ` AND b.return_date IS NULL AND b.due_date < CURRENT_DATE`;
    }
    
    if (student_id) {
      query += ` AND b.student_id = $${paramIndex}`;
      params.push(student_id);
      paramIndex++;
    }
    
    query += ` ORDER BY b.borrow_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    const countQuery = 'SELECT COUNT(*) FROM borrowings' + 
      ((status === 'active' || status === 'returned' || status === 'overdue' || student_id) ? ' WHERE ' + 
        (status === 'active' ? 'return_date IS NULL' : '') +
        (status === 'returned' ? 'return_date IS NOT NULL' : '') +
        (status === 'overdue' ? 'return_date IS NULL AND due_date < CURRENT_DATE' : '') +
        ((status === 'active' || status === 'returned' || status === 'overdue') && student_id ? ' AND ' : '') +
        (student_id ? 'student_id = $1' : '') : '');
    const countParams = [];
    if (student_id) countParams.push(student_id);
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      borrowings: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching borrowings', error: error.message });
  }
};

// Get single borrowing
exports.getBorrowing = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT b.*, s.name as student_name, s.admission_number, s.class, s.email, s.phone,
             bk.title as book_title, bk.author as book_author, bk.isbn, bk.location,
             (SELECT json_agg(jsonb_build_object('id', f.id, 'amount', f.amount, 'status', f.status)) 
              FROM fines f WHERE f.borrowing_id = b.id) as fines
      FROM borrowings b
      JOIN students s ON b.student_id = s.id
      JOIN books bk ON b.book_id = bk.id
      WHERE b.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Borrowing record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching borrowing', error: error.message });
  }
};

// Create new borrowing
exports.createBorrowing = async (req, res) => {
  const client = await pool.connect();
  try {
    const { student_id, book_id, due_date, notes } = req.body;
    
    await client.query('BEGIN');
    
    // Check if book is available
    const book = await client.query(
      'SELECT available_copies, title FROM books WHERE id = $1 FOR UPDATE',
      [book_id]
    );
    
    if (book.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Book not found' });
    }
    
    if (book.rows[0].available_copies <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Book not available for borrowing' });
    }
    
    // Check if student has overdue books
    const overdue = await client.query(
      `SELECT COUNT(*) FROM borrowings 
       WHERE student_id = $1 AND return_date IS NULL AND due_date < CURRENT_DATE`,
      [student_id]
    );
    
    if (parseInt(overdue.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Student has overdue books. Please clear fines first.' });
    }
    
    // Check maximum borrow limit (e.g., 5 books per student)
    const activeBorrowings = await client.query(
      `SELECT COUNT(*) FROM borrowings 
       WHERE student_id = $1 AND return_date IS NULL`,
      [student_id]
    );
    
    const MAX_BORROW_LIMIT = 5;
    if (parseInt(activeBorrowings.rows[0].count) >= MAX_BORROW_LIMIT) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Student has reached maximum borrow limit of ${MAX_BORROW_LIMIT} books` });
    }
    
    // Create borrowing record
    const result = await client.query(
      `INSERT INTO borrowings (student_id, book_id, borrow_date, due_date, notes, status)
       VALUES ($1, $2, CURRENT_DATE, $3, $4, 'active') RETURNING *`,
      [student_id, book_id, due_date, notes]
    );
    
    // Update available copies
    await client.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1',
      [book_id]
    );
    
    await client.query('COMMIT');
    res.status(201).json({
      borrowing: result.rows[0],
      message: `Book "${book.rows[0].title}" borrowed successfully`
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error creating borrowing', error: error.message });
  } finally {
    client.release();
  }
};

// Return book
exports.returnBook = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    await client.query('BEGIN');
    
    // Get borrowing details
    const borrowing = await client.query(
      `SELECT b.*, bk.title, bk.id as book_id, s.name as student_name
       FROM borrowings b
       JOIN books bk ON b.book_id = bk.id
       JOIN students s ON b.student_id = s.id
       WHERE b.id = $1 AND b.return_date IS NULL`,
      [id]
    );
    
    if (borrowing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Active borrowing record not found' });
    }
    
    const borrowData = borrowing.rows[0];
    const returnDate = new Date();
    const dueDate = new Date(borrowData.due_date);
    
    // Calculate fine if overdue
    let fineAmount = 0;
    if (returnDate > dueDate) {
      const daysOverdue = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
      fineAmount = daysOverdue * 50; // KES 50 per day
      
      if (fineAmount > 0) {
        await client.query(
          `INSERT INTO fines (student_id, borrowing_id, amount, status)
           VALUES ($1, $2, $3, 'pending')`,
          [borrowData.student_id, id, fineAmount]
        );
      }
    }
    
    // Update borrowing record
    const result = await client.query(
      `UPDATE borrowings 
       SET return_date = CURRENT_DATE, 
           status = 'returned',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id]
    );
    
    // Update available copies
    await client.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id = $1',
      [borrowData.book_id]
    );
    
    await client.query('COMMIT');
    
    res.json({
      borrowing: result.rows[0],
      fine_amount: fineAmount,
      message: fineAmount > 0 
        ? `Book returned successfully. Fine of KES ${fineAmount} has been applied.`
        : 'Book returned successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error returning book', error: error.message });
  } finally {
    client.release();
  }
};

// Get active borrowings
exports.getActiveBorrowings = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, s.name as student_name, s.admission_number, s.class,
             bk.title as book_title, bk.author as book_author,
             CASE WHEN b.due_date < CURRENT_DATE THEN true ELSE false END as is_overdue,
             EXTRACT(DAY FROM (CURRENT_DATE - b.due_date)) as days_overdue
      FROM borrowings b
      JOIN students s ON b.student_id = s.id
      JOIN books bk ON b.book_id = bk.id
      WHERE b.return_date IS NULL
      ORDER BY b.due_date ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active borrowings', error: error.message });
  }
};

// Get student borrowings
exports.getStudentBorrowings = async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await pool.query(`
      SELECT b.*, bk.title as book_title, bk.author as book_author, bk.isbn,
             CASE WHEN b.return_date IS NULL AND b.due_date < CURRENT_DATE THEN true ELSE false END as is_overdue
      FROM borrowings b
      JOIN books bk ON b.book_id = bk.id
      WHERE b.student_id = $1
      ORDER BY b.borrow_date DESC
    `, [studentId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student borrowings', error: error.message });
  }
};

// ==================== FINE MANAGEMENT ====================

// Get all fines
exports.getFines = async (req, res) => {
  try {
    const { status, student_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT f.*, s.name as student_name, s.admission_number, s.class,
             bk.title as book_title, b.due_date, b.return_date
      FROM fines f
      JOIN students s ON f.student_id = s.id
      JOIN borrowings b ON f.borrowing_id = b.id
      JOIN books bk ON b.book_id = bk.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND f.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (student_id) {
      query += ` AND f.student_id = $${paramIndex}`;
      params.push(student_id);
      paramIndex++;
    }
    
    query += ` ORDER BY f.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    const countQuery = 'SELECT COUNT(*) FROM fines' + 
      (status || student_id ? ' WHERE ' + 
        (status ? 'status = $1' : '') + 
        (status && student_id ? ' AND ' : '') +
        (student_id ? 'student_id = $' + (status ? '2' : '1') : '') : '');
    const countParams = [];
    if (status) countParams.push(status);
    if (student_id) countParams.push(student_id);
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      fines: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fines', error: error.message });
  }
};

// Get student fines
exports.getStudentFines = async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await pool.query(`
      SELECT f.*, bk.title as book_title, b.due_date, b.return_date,
             EXTRACT(DAY FROM (b.return_date - b.due_date)) as days_overdue
      FROM fines f
      JOIN borrowings b ON f.borrowing_id = b.id
      JOIN books bk ON b.book_id = bk.id
      WHERE f.student_id = $1 AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `, [studentId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student fines', error: error.message });
  }
};

// Pay fine
exports.payFine = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { payment_method, reference_number } = req.body;
    
    await client.query('BEGIN');
    
    const result = await client.query(
      `UPDATE fines 
       SET status = 'paid', 
           paid_date = CURRENT_DATE,
           payment_method = $1,
           reference_number = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND status = 'pending'
       RETURNING *`,
      [payment_method, reference_number, id]
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Fine not found or already paid' });
    }
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error paying fine', error: error.message });
  } finally {
    client.release();
  }
};

// Waive fine (admin only)
exports.waiveFine = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const result = await pool.query(
      `UPDATE fines 
       SET status = 'waived', 
           waived_reason = $1,
           waived_by = $2,
           waived_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND status = 'pending'
       RETURNING *`,
      [reason, req.user.id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Fine not found or already processed' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error waiving fine', error: error.message });
  }
};

// Get fine summary
exports.getFineSummary = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_fines,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_collected,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count
      FROM fines
    `);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fine summary', error: error.message });
  }
};

// ==================== RETURNS MANAGEMENT ====================

// Get all returns
exports.getReturns = async (req, res) => {
  try {
    const { start_date, end_date, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT b.*, s.name as student_name, s.admission_number, s.class,
             bk.title as book_title, bk.author as book_author,
             (SELECT amount FROM fines WHERE borrowing_id = b.id) as fine_amount,
             (SELECT status FROM fines WHERE borrowing_id = b.id) as fine_status
      FROM borrowings b
      JOIN students s ON b.student_id = s.id
      JOIN books bk ON b.book_id = bk.id
      WHERE b.return_date IS NOT NULL
    `;
    const params = [];
    let paramIndex = 1;
    
    if (start_date) {
      query += ` AND b.return_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }
    
    if (end_date) {
      query += ` AND b.return_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }
    
    query += ` ORDER BY b.return_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      returns: result.rows,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching returns', error: error.message });
  }
};

// ==================== LIBRARY REPORTS ====================

// Get library reports
exports.getLibraryReport = async (req, res) => {
  try {
    const { type, start_date, end_date } = req.query;
    
    let reportData = {};
    
    switch (type) {
      case 'borrowing-trends':
        const trends = await pool.query(`
          SELECT 
            DATE_TRUNC('month', borrow_date) as month,
            COUNT(*) as total_borrowings,
            COUNT(DISTINCT student_id) as unique_borrowers,
            COUNT(CASE WHEN return_date IS NOT NULL THEN 1 END) as returns,
            COUNT(CASE WHEN return_date IS NULL THEN 1 END) as active_borrowings
          FROM borrowings
          WHERE borrow_date BETWEEN $1 AND $2
          GROUP BY DATE_TRUNC('month', borrow_date)
          ORDER BY month DESC
        `, [start_date, end_date]);
        reportData = trends.rows;
        break;
        
      case 'popular-books':
        const popularBooks = await pool.query(`
          SELECT 
            bk.id, bk.title, bk.author, bk.category,
            COUNT(b.id) as times_borrowed,
            AVG(EXTRACT(DAY FROM (b.return_date - b.borrow_date))) as avg_borrow_days
          FROM books bk
          JOIN borrowings b ON bk.id = b.book_id
          WHERE b.borrow_date BETWEEN $1 AND $2
          GROUP BY bk.id
          ORDER BY times_borrowed DESC
          LIMIT 20
        `, [start_date, end_date]);
        reportData = popularBooks.rows;
        break;
        
      case 'active-members':
        const activeMembers = await pool.query(`
          SELECT 
            s.id, s.name, s.admission_number, s.class,
            COUNT(b.id) as books_borrowed,
            COUNT(DISTINCT b.book_id) as unique_books,
            SUM(CASE WHEN b.return_date IS NULL THEN 1 ELSE 0 END) as current_borrowings
          FROM students s
          JOIN borrowings b ON s.id = b.student_id
          WHERE b.borrow_date BETWEEN $1 AND $2
          GROUP BY s.id
          HAVING COUNT(b.id) > 0
          ORDER BY books_borrowed DESC
          LIMIT 20
        `, [start_date, end_date]);
        reportData = activeMembers.rows;
        break;
        
      default:
        reportData = { message: 'Please specify report type: borrowing-trends, popular-books, or active-members' };
    }
    
    res.json(reportData);
  } catch (error) {
    res.status(500).json({ message: 'Error generating library report', error: error.message });
  }
};