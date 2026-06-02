// backend/models/Book.js
const pool = require('../config/database');

class Book {
  static async findAll(filters = {}) {
    const { search, category, page = 1, limit = 10 } = filters;
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
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(bookData) {
    const {
      title, author, isbn, category, publisher,
      publication_year, total_copies, description, location
    } = bookData;
    
    const result = await pool.query(
      `INSERT INTO books (title, author, isbn, category, publisher, 
       publication_year, total_copies, available_copies, description, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9) RETURNING *`,
      [title, author, isbn, category, publisher, publication_year, total_copies, description, location]
    );
    return result.rows[0];
  }

  static async update(id, bookData) {
    const {
      title, author, isbn, category, publisher,
      publication_year, total_copies, description, location
    } = bookData;
    
    const result = await pool.query(
      `UPDATE books 
       SET title = COALESCE($1, title),
           author = COALESCE($2, author),
           isbn = COALESCE($3, isbn),
           category = COALESCE($4, category),
           publisher = COALESCE($5, publisher),
           publication_year = COALESCE($6, publication_year),
           total_copies = COALESCE($7, total_copies),
           description = COALESCE($8, description),
           location = COALESCE($9, location),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 RETURNING *`,
      [title, author, isbn, category, publisher, publication_year, total_copies, description, location, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  static async updateAvailability(id, change) {
    const result = await pool.query(
      'UPDATE books SET available_copies = available_copies + $1 WHERE id = $2 RETURNING *',
      [change, id]
    );
    return result.rows[0];
  }

  static async getLowStock() {
    const result = await pool.query(
      'SELECT * FROM books WHERE available_copies <= 2 ORDER BY available_copies ASC'
    );
    return result.rows;
  }

  static async getStats() {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(total_copies) as total_copies,
        SUM(available_copies) as available_copies,
        COUNT(DISTINCT category) as categories
      FROM books
    `);
    return result.rows[0];
  }
}

module.exports = Book;