// backend/routes/library.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all books with pagination and search
router.get('/books', async (req, res) => {
  try {
    const { search, page = 1, limit = 10, category } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT b.*, 
             COUNT(DISTINCT br.id) as borrowed_count
      FROM books b
      LEFT JOIN borrowings br ON b.id = br.book_id AND br.return_date IS NULL
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      query += ` AND (b.title ILIKE $${paramIndex} OR b.author ILIKE $${paramIndex} OR b.isbn ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (category) {
      query += ` AND b.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
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
    }
    
    const totalCount = await pool.query(countQuery, countParams);
    
    res.json({
      books: result.rows,
      totalPages: Math.ceil(totalCount.rows[0].count / limit),
      currentPage: parseInt(page),
      total: parseInt(totalCount.rows[0].count)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching books', error: error.message });
  }
});

// Get single book
router.get('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching book', error: error.message });
  }
});

// Create book
router.post('/books', async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      category,
      publisher,
      publication_year,
      total_copies,
      available_copies,
      description,
      location
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO books (title, author, isbn, category, publisher, publication_year, 
       total_copies, available_copies, description, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [title, author, isbn, category, publisher, publication_year, 
       total_copies, total_copies, description, location]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error creating book', error: error.message });
  }
});

// Update book
router.put('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      author,
      isbn,
      category,
      publisher,
      publication_year,
      total_copies,
      description,
      location
    } = req.body;
    
    const result = await pool.query(
      `UPDATE books 
       SET title = $1, author = $2, isbn = $3, category = $4, 
           publisher = $5, publication_year = $6, total_copies = $7,
           description = $8, location = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 RETURNING *`,
      [title, author, isbn, category, publisher, publication_year, 
       total_copies, description, location, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating book', error: error.message });
  }
});

// Delete book
router.delete('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if book has active borrowings
    const borrowings = await pool.query(
      'SELECT * FROM borrowings WHERE book_id = $1 AND return_date IS NULL',
      [id]
    );
    
    if (borrowings.rows.length > 0) {
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
});

// Get borrowings
router.get('/borrowing', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT b.*, s.name as student_name, s.admission_number,
             bk.title as book_title, bk.author as book_author
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
    }
    
    query += ` ORDER BY b.borrow_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching borrowings', error: error.message });
  }
});

// Create borrowing
router.post('/borrowing', async (req, res) => {
  const client = await pool.connect();
  try {
    const { student_id, book_id, due_date } = req.body;
    
    await client.query('BEGIN');
    
    // Check if book is available
    const book = await client.query(
      'SELECT available_copies FROM books WHERE id = $1 FOR UPDATE',
      [book_id]
    );
    
    if (book.rows[0].available_copies <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Book not available' });
    }
    
    // Create borrowing record
    const result = await client.query(
      `INSERT INTO borrowings (student_id, book_id, borrow_date, due_date)
       VALUES ($1, $2, CURRENT_DATE, $3) RETURNING *`,
      [student_id, book_id, due_date]
    );
    
    // Update available copies
    await client.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1',
      [book_id]
    );
    
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error creating borrowing', error: error.message });
  } finally {
    client.release();
  }
});

// Return book
router.post('/return/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    await client.query('BEGIN');
    
    const result = await client.query(
      `UPDATE borrowings 
       SET return_date = CURRENT_DATE, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND return_date IS NULL RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Borrowing record not found or already returned' });
    }
    
    // Update available copies
    await client.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id = $1',
      [result.rows[0].book_id]
    );
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error returning book', error: error.message });
  } finally {
    client.release();
  }
});

// Get fines
router.get('/fines', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, s.name as student_name, s.admission_number,
             bk.title as book_title, b.due_date, b.return_date
      FROM fines f
      JOIN students s ON f.student_id = s.id
      JOIN borrowings b ON f.borrowing_id = b.id
      JOIN books bk ON b.book_id = bk.id
      ORDER BY f.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fines', error: error.message });
  }
});

// Pay fine
router.post('/fines/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE fines 
       SET status = 'paid', paid_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Fine not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error paying fine', error: error.message });
  }
});

module.exports = router;