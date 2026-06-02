// backend/controllers/inventoryController.js
const pool = require('../config/database');

// Get all stock items
exports.getStockItems = async (req, res) => {
  try {
    const { category, search, lowStock, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
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
    
    if (lowStock === 'true') {
      query += ` AND quantity <= reorder_level`;
    }
    
    query += ` ORDER BY name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    const countQuery = 'SELECT COUNT(*) FROM stock_items' + 
      (category || search ? ' WHERE ' + 
        (category ? 'category = $1' : '') + 
        (category && search ? ' AND ' : '') +
        (search ? '(name ILIKE $' + (category ? '2' : '1') + ' OR sku ILIKE $' + (category ? '2' : '1') + ')' : '') : '');
    const countParams = [];
    if (category) countParams.push(category);
    if (search) countParams.push(`%${search}%`);
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      items: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stock items', error: error.message });
  }
};

// Get low stock items
exports.getLowStockItems = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM stock_items WHERE quantity <= reorder_level AND quantity > 0 ORDER BY quantity ASC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching low stock items', error: error.message });
  }
};

// Get expiring items (for perishable goods)
exports.getExpiringItems = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM stock_items 
       WHERE expiry_date IS NOT NULL 
       AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
       ORDER BY expiry_date ASC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expiring items', error: error.message });
  }
};

// Get single stock item
exports.getStockItem = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM stock_items WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stock item', error: error.message });
  }
};

// Create stock item
exports.createStockItem = async (req, res) => {
  try {
    const {
      sku, name, category, quantity, unit, unit_price,
      reorder_level, description, location, expiry_date
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO stock_items (sku, name, category, quantity, unit, unit_price, 
       reorder_level, description, location, expiry_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [sku, name, category, quantity || 0, unit || 'pcs', unit_price || 0,
       reorder_level || 0, description, location, expiry_date]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error creating stock item', error: error.message });
  }
};

// Update stock item
exports.updateStockItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, category, unit, unit_price, reorder_level,
      description, location, expiry_date
    } = req.body;
    
    const result = await pool.query(
      `UPDATE stock_items 
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           unit = COALESCE($3, unit),
           unit_price = COALESCE($4, unit_price),
           reorder_level = COALESCE($5, reorder_level),
           description = COALESCE($6, description),
           location = COALESCE($7, location),
           expiry_date = COALESCE($8, expiry_date),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 RETURNING *`,
      [name, category, unit, unit_price, reorder_level, description, location, expiry_date, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating stock item', error: error.message });
  }
};

// Delete stock item
exports.deleteStockItem = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM stock_items WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    
    res.json({ message: 'Stock item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting stock item', error: error.message });
  }
};

// Get categories
exports.getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM stock_items WHERE category IS NOT NULL ORDER BY category'
    );
    res.json(result.rows.map(r => r.category));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

// Create category
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const result = await pool.query(
      'INSERT INTO stock_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0] || { message: 'Category already exists' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

// Get stock in records
exports.getStockInRecords = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await pool.query(`
      SELECT sm.*, si.name as item_name, si.sku
      FROM stock_movements sm
      JOIN stock_items si ON sm.stock_item_id = si.id
      WHERE sm.movement_type = 'in'
      ORDER BY sm.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM stock_movements WHERE movement_type = 'in'"
    );
    
    res.json({
      records: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stock in records', error: error.message });
  }
};

// Get stock in by ID
exports.getStockInById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT sm.*, si.name as item_name, si.sku
      FROM stock_movements sm
      JOIN stock_items si ON sm.stock_item_id = si.id      WHERE sm.id = $1 AND sm.movement_type = 'in'
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Stock in record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stock in record', error: error.message });
  }
};

// Add stock (Stock In)
exports.addStock = async (req, res) => {
  const client = await pool.connect();
  try {
    const { item_id, quantity, reference, notes } = req.body;
    
    await client.query('BEGIN');
    
    // Update stock quantity
    const updateResult = await client.query(
      'UPDATE stock_items SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [quantity, item_id]
    );
    
    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Stock item not found' });
    }
    
    // Record movement
    const movementResult = await client.query(
      `INSERT INTO stock_movements (stock_item_id, movement_type, quantity, reference, notes)
       VALUES ($1, 'in', $2, $3, $4) RETURNING *`,
      [item_id, quantity, reference, notes]
    );
    
    await client.query('COMMIT');
    res.status(201).json({
      item: updateResult.rows[0],
      movement: movementResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error adding stock', error: error.message });
  } finally {
    client.release();
  }
};

// Get stock out records
exports.getStockOutRecords = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await pool.query(`
      SELECT sm.*, si.name as item_name, si.sku
      FROM stock_movements sm
      JOIN stock_items si ON sm.stock_item_id = si.id
      WHERE sm.movement_type = 'out'
      ORDER BY sm.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM stock_movements WHERE movement_type = 'out'"
    );
    
    res.json({
      records: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stock out records', error: error.message });
  }
};

// Get stock out by ID
exports.getStockOutById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT sm.*, si.name as item_name, si.sku
      FROM stock_movements sm
      JOIN stock_items si ON sm.stock_item_id = si.id
      WHERE sm.id = $1 AND sm.movement_type = 'out'
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Stock out record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stock out record', error: error.message });
  }
};

// Remove stock (Stock Out)
exports.removeStock = async (req, res) => {
  const client = await pool.connect();
  try {
    const { item_id, quantity, reference, notes } = req.body;
    
    await client.query('BEGIN');
    
    // Check if sufficient stock is available
    const stockItem = await client.query(
      'SELECT quantity FROM stock_items WHERE id = $1',
      [item_id]
    );
    
    if (stockItem.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Stock item not found' });
    }
    
    if (stockItem.rows[0].quantity < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Insufficient stock available' });
    }
    
    // Update stock quantity
    const updateResult = await client.query(
      'UPDATE stock_items SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [quantity, item_id]
    );
    
    // Record movement
    const movementResult = await client.query(
      `INSERT INTO stock_movements (stock_item_id, movement_type, quantity, reference, notes)
       VALUES ($1, 'out', $2, $3, $4) RETURNING *`,
      [item_id, quantity, reference, notes]
    );
    
    await client.query('COMMIT');
    res.status(201).json({
      item: updateResult.rows[0],
      movement: movementResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error removing stock', error: error.message });
  } finally {
    client.release();
  }
};

// Get inventory reports
exports.getInventoryReports = async (req, res) => {
  try {
    const { type, start_date, end_date } = req.query;
    
    let reportData = {};
    
    switch (type) {
      case 'stock-value':
        const stockValue = await pool.query(`
          SELECT 
            SUM(quantity * unit_price) as total_value,
            category,
            SUM(quantity * unit_price) as category_value
          FROM stock_items
          GROUP BY category
        `);
        reportData = stockValue.rows;
        break;
        
      case 'movements':
        const movements = await pool.query(`
          SELECT 
            DATE(created_at) as date,
            COUNT(CASE WHEN movement_type = 'in' THEN 1 END) as total_in,
            SUM(CASE WHEN movement_type = 'in' THEN quantity ELSE 0 END) as quantity_in,
            COUNT(CASE WHEN movement_type = 'out' THEN 1 END) as total_out,
            SUM(CASE WHEN movement_type = 'out' THEN quantity ELSE 0 END) as quantity_out
          FROM stock_movements
          WHERE created_at BETWEEN $1 AND $2
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `, [start_date, end_date]);
        reportData = movements.rows;
        break;
        
      default:
        reportData = { message: 'Please specify report type: stock-value or movements' };
    }
    
    res.json(reportData);
  } catch (error) {
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
};

// Get stock value report
exports.getStockValueReport = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        SUM(quantity * unit_price) as total_value,
        COUNT(*) as total_items,
        SUM(quantity) as total_quantity
      FROM stock_items
    `);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stock value', error: error.message });
  }
};

// Get movement report
exports.getMovementReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        movement_type,
        COUNT(*) as transactions,
        SUM(quantity) as total_quantity
      FROM stock_movements
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY DATE(created_at), movement_type
      ORDER BY date DESC, movement_type
    `, [start_date, end_date]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching movement report', error: error.message });
  }
};

// Generate inventory report
exports.generateInventoryReport = async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json' } = req.query;
    
    let reportData;
    
    if (type === 'stock-summary') {
      const result = await pool.query(`
        SELECT 
          category,
          COUNT(*) as item_count,
          SUM(quantity) as total_quantity,
          SUM(quantity * unit_price) as total_value,
          COUNT(CASE WHEN quantity <= reorder_level THEN 1 END) as low_stock_items
        FROM stock_items
        GROUP BY category
        ORDER BY category
      `);
      reportData = result.rows;
    }
    
    if (format === 'json') {
      res.json(reportData);
    } else {
      // For CSV or PDF export, you would generate file here
      res.json({ message: 'Report generation for ' + format + ' coming soon' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
};