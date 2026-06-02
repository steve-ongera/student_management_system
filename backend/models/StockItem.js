// backend/models/StockItem.js
const pool = require('../config/database');

class StockItem {
  static async findAll(filters = {}) {
    const { category, search, lowStock } = filters;
    let query = 'SELECT * FROM stock_items WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR sku ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (lowStock) {
      query += ` AND quantity <= reorder_level`;
    }
    
    query += ` ORDER BY name`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM stock_items WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(itemData) {
    const {
      sku, name, category, quantity, unit,
      unit_price, reorder_level, description, location
    } = itemData;
    
    const result = await pool.query(
      `INSERT INTO stock_items (sku, name, category, quantity, unit, 
       unit_price, reorder_level, description, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [sku, name, category, quantity || 0, unit || 'pcs', 
       unit_price || 0, reorder_level || 0, description, location]
    );
    return result.rows[0];
  }

  static async update(id, itemData) {
    const {
      name, category, unit, unit_price, reorder_level, description, location
    } = itemData;
    
    const result = await pool.query(
      `UPDATE stock_items 
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           unit = COALESCE($3, unit),
           unit_price = COALESCE($4, unit_price),
           reorder_level = COALESCE($5, reorder_level),
           description = COALESCE($6, description),
           location = COALESCE($7, location),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [name, category, unit, unit_price, reorder_level, description, location, id]
    );
    return result.rows[0];
  }

  static async updateQuantity(id, quantityChange) {
    const result = await pool.query(
      'UPDATE stock_items SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [quantityChange, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM stock_items WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  static async getLowStock() {
    const result = await pool.query(
      'SELECT * FROM stock_items WHERE quantity <= reorder_level AND quantity > 0 ORDER BY quantity ASC'
    );
    return result.rows;
  }

  static async getOutOfStock() {
    const result = await pool.query(
      'SELECT * FROM stock_items WHERE quantity = 0 ORDER BY name'
    );
    return result.rows;
  }

  static async getCategories() {
    const result = await pool.query(
      'SELECT DISTINCT category FROM stock_items WHERE category IS NOT NULL ORDER BY category'
    );
    return result.rows.map(r => r.category);
  }

  static async getTotalValue() {
    const result = await pool.query(
      'SELECT SUM(quantity * unit_price) as total_value FROM stock_items'
    );
    return result.rows[0].total_value || 0;
  }

  static async recordMovement(itemId, type, quantity, reference, notes) {
    const result = await pool.query(
      `INSERT INTO stock_movements (stock_item_id, movement_type, quantity, reference, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [itemId, type, quantity, reference, notes]
    );
    return result.rows[0];
  }

  static async getMovements(itemId, limit = 50) {
    const result = await pool.query(
      `SELECT * FROM stock_movements 
       WHERE stock_item_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [itemId, limit]
    );
    return result.rows;
  }
}

module.exports = StockItem;