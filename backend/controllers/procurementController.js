// backend/controllers/procurementController.js
const pool = require('../config/database');

exports.getRequisitions = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT r.*, d.name as department_name, 
             u.name as requested_by_name
      FROM requisitions r
      LEFT JOIN departments d ON r.department_id = d.id
      LEFT JOIN users u ON r.requested_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND r.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    query += ` ORDER BY r.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM requisitions' + (status ? ' WHERE status = $1' : ''),
      status ? [status] : []
    );
    
    res.json({
      requisitions: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requisitions', error: error.message });
  }
};

exports.getRequisition = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT r.*, d.name as department_name, u.name as requested_by_name,
             (SELECT json_agg(json_build_object(
               'id', ri.id, 'item_name', ri.item_name, 'quantity', ri.quantity,
               'estimated_cost', ri.estimated_cost, 'description', ri.description
             )) FROM requisition_items ri WHERE ri.requisition_id = r.id) as items
      FROM requisitions r
      LEFT JOIN departments d ON r.department_id = d.id
      LEFT JOIN users u ON r.requested_by = u.id
      WHERE r.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Requisition not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requisition', error: error.message });
  }
};

exports.createRequisition = async (req, res) => {
  const client = await pool.connect();
  try {
    const { department_id, items, notes, priority } = req.body;
    const requested_by = req.user.id;
    
    await client.query('BEGIN');
    
    // Generate requisition number
    const year = new Date().getFullYear();
    const numberResult = await client.query(
      "SELECT COUNT(*) FROM requisitions WHERE EXTRACT(YEAR FROM created_at) = $1",
      [year]
    );
    const requisitionNumber = `REQ-${year}-${(parseInt(numberResult.rows[0].count) + 1).toString().padStart(4, '0')}`;
    
    // Create requisition
    const requisitionResult = await client.query(
      `INSERT INTO requisitions (requisition_number, department_id, requested_by, notes, priority, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [requisitionNumber, department_id, requested_by, notes, priority || 'medium']
    );
    
    const requisition = requisitionResult.rows[0];
    
    // Add items
    for (const item of items) {
      await client.query(
        `INSERT INTO requisition_items (requisition_id, item_name, quantity, estimated_cost, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [requisition.id, item.item_name, item.quantity, item.estimated_cost, item.description]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(201).json(requisition);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error creating requisition', error: error.message });
  } finally {
    client.release();
  }
};

exports.updateRequisition = async (req, res) => {
  try {
    const { id } = req.params;
    const { department_id, notes, priority } = req.body;
    
    const result = await pool.query(
      `UPDATE requisitions 
       SET department_id = COALESCE($1, department_id),
           notes = COALESCE($2, notes),
           priority = COALESCE($3, priority),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND status = 'pending'
       RETURNING *`,
      [department_id, notes, priority, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Requisition not found or cannot be updated' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating requisition', error: error.message });
  }
};

exports.approveRequisition = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { comment } = req.body;
    
    await client.query('BEGIN');
    
    const result = await client.query(
      `UPDATE requisitions 
       SET status = 'approved', 
           approval_comment = $1,
           approved_by = $2,
           approved_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND status = 'pending'
       RETURNING *`,
      [comment, req.user.id, id]
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Requisition not found or already processed' });
    }
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error approving requisition', error: error.message });
  } finally {
    client.release();
  }
};

exports.rejectRequisition = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    
    const result = await pool.query(
      `UPDATE requisitions 
       SET status = 'rejected', 
           approval_comment = $1,
           approved_by = $2,
           approved_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND status = 'pending'
       RETURNING *`,
      [comment, req.user.id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Requisition not found or already processed' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting requisition', error: error.message });
  }
};

exports.getSuppliers = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM suppliers WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR contact_person ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ' ORDER BY name';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching suppliers', error: error.message });
  }
};

exports.getSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching supplier', error: error.message });
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const {
      name, contact_person, email, phone, address,
      tax_id, payment_terms, category
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO suppliers (name, contact_person, email, phone, address, tax_id, payment_terms, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, contact_person, email, phone, address, tax_id, payment_terms, category]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error creating supplier', error: error.message });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, contact_person, email, phone, address,
      tax_id, payment_terms, category
    } = req.body;
    
    const result = await pool.query(
      `UPDATE suppliers 
       SET name = COALESCE($1, name),
           contact_person = COALESCE($2, contact_person),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           address = COALESCE($5, address),
           tax_id = COALESCE($6, tax_id),
           payment_terms = COALESCE($7, payment_terms),
           category = COALESCE($8, category),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 RETURNING *`,
      [name, contact_person, email, phone, address, tax_id, payment_terms, category, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating supplier', error: error.message });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM suppliers WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting supplier', error: error.message });
  }
};

exports.getSupplierPerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        COUNT(po.id) as total_orders,
        SUM(po.total_amount) as total_spent,
        AVG(EXTRACT(DAY FROM (po.delivery_date - po.order_date))) as avg_delivery_days,
        COUNT(CASE WHEN po.status = 'received' THEN 1 END) as completed_orders
      FROM purchase_orders po
      WHERE po.supplier_id = $1
    `, [id]);
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching supplier performance', error: error.message });
  }
};

exports.getPurchaseOrders = async (req, res) => {
  try {
    const { status, supplier_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT po.*, s.name as supplier_name
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND po.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (supplier_id) {
      query += ` AND po.supplier_id = $${paramIndex}`;
      params.push(supplier_id);
      paramIndex++;
    }
    
    query += ` ORDER BY po.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    const countQuery = 'SELECT COUNT(*) FROM purchase_orders' + 
      (status || supplier_id ? ' WHERE ' + 
        (status ? 'status = $1' : '') + 
        (status && supplier_id ? ' AND ' : '') +
        (supplier_id ? 'supplier_id = $' + (status ? '2' : '1') : '') : '');
    const countParams = [];
    if (status) countParams.push(status);
    if (supplier_id) countParams.push(supplier_id);
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      orders: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching purchase orders', error: error.message });
  }
};

exports.getPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT po.*, s.name as supplier_name, s.email, s.phone
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching purchase order', error: error.message });
  }
};

exports.createPurchaseOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const { supplier_id, order_date, delivery_date, items, notes } = req.body;
    
    await client.query('BEGIN');
    
    // Generate order number
    const year = new Date().getFullYear();
    const numberResult = await client.query(
      "SELECT COUNT(*) FROM purchase_orders WHERE EXTRACT(YEAR FROM created_at) = $1",
      [year]
    );
    const orderNumber = `PO-${year}-${(parseInt(numberResult.rows[0].count) + 1).toString().padStart(4, '0')}`;
    
    // Calculate total amount
    let total_amount = 0;
    for (const item of items) {
      total_amount += item.quantity * item.unit_price;
    }
    
    const result = await client.query(
      `INSERT INTO purchase_orders (order_number, supplier_id, order_date, delivery_date, total_amount, notes, status)
       V// backend/controllers/procurementController.js (continued)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *`,
      [orderNumber, supplier_id, order_date, delivery_date, total_amount, notes]
    );
    
    const purchaseOrder = result.rows[0];
    
    // Add items to purchase order items table
    for (const item of items) {
      await client.query(
        `INSERT INTO purchase_order_items (purchase_order_id, item_name, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [purchaseOrder.id, item.item_name, item.quantity, item.unit_price, item.quantity * item.unit_price]
      );
    }
    
    await client.query('COMMIT');
    res.status(201).json(purchaseOrder);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error creating purchase order', error: error.message });
  } finally {
    client.release();
  }
};

exports.updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_date, notes } = req.body;
    
    const result = await pool.query(
      `UPDATE purchase_orders 
       SET delivery_date = COALESCE($1, delivery_date),
           notes = COALESCE($2, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND status = 'pending'
       RETURNING *`,
      [delivery_date, notes, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Purchase order not found or cannot be updated' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating purchase order', error: error.message });
  }
};

exports.approvePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE purchase_orders 
       SET status = 'approved', 
           approved_by = $1,
           approved_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND status = 'pending'
       RETURNING *`,
      [req.user.id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Purchase order not found or already processed' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error approving purchase order', error: error.message });
  }
};

exports.receiveOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    await client.query('BEGIN');
    
    const result = await client.query(
      `UPDATE purchase_orders 
       SET status = 'received', 
           received_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'approved'
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Purchase order not found or cannot be received' });
    }
    
    // Get order items to update inventory
    const items = await client.query(
      'SELECT item_name, quantity FROM purchase_order_items WHERE purchase_order_id = $1',
      [id]
    );
    
    // Update or create stock items
    for (const item of items.rows) {
      const stockItem = await client.query(
        'SELECT id FROM stock_items WHERE name = $1',
        [item.item_name]
      );
      
      if (stockItem.rows.length > 0) {
        await client.query(
          'UPDATE stock_items SET quantity = quantity + $1 WHERE id = $2',
          [item.quantity, stockItem.rows[0].id]
        );
      } else {
        await client.query(
          `INSERT INTO stock_items (name, quantity, unit, created_at)
           VALUES ($1, $2, 'pcs', CURRENT_TIMESTAMP)`,
          [item.item_name, item.quantity]
        );
      }
    }
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error receiving order', error: error.message });
  } finally {
    client.release();
  }
};

exports.cancelPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const result = await pool.query(
      `UPDATE purchase_orders 
       SET status = 'cancelled', 
           cancellation_reason = $1,
           cancelled_by = $2,
           cancelled_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND status IN ('pending', 'approved')
       RETURNING *`,
      [reason, req.user.id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Purchase order not found or cannot be cancelled' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling purchase order', error: error.message });
  }
};

exports.getPendingApprovals = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        'requisition' as type,
        r.id,
        r.requisition_number as reference,
        r.created_at,
        d.name as department,
        u.name as requested_by
      FROM requisitions r
      JOIN departments d ON r.department_id = d.id
      JOIN users u ON r.requested_by = u.id
      WHERE r.status = 'pending'
      
      UNION ALL
      
      SELECT 
        'purchase_order' as type,
        po.id,
        po.order_number as reference,
        po.created_at,
        s.name as department,
        'System' as requested_by
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.status = 'pending'
      
      ORDER BY created_at ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending approvals', error: error.message });
  }
};

exports.approve = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, comment } = req.body;
    
    if (type === 'requisition') {
      const result = await pool.query(
        `UPDATE requisitions 
         SET status = 'approved', 
             approval_comment = $1,
             approved_by = $2,
             approved_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND status = 'pending'
         RETURNING *`,
        [comment, req.user.id, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Requisition not found' });
      }
      res.json(result.rows[0]);
    } else {
      const result = await pool.query(
        `UPDATE purchase_orders 
         SET status = 'approved', 
             notes = CASE WHEN notes IS NULL THEN $1 ELSE notes || '\n' || $1 END,
             approved_by = $2,
             approved_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND status = 'pending'
         RETURNING *`,
        [comment, req.user.id, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Purchase order not found' });
      }
      res.json(result.rows[0]);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error approving request', error: error.message });
  }
};

exports.reject = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, comment } = req.body;
    
    if (type === 'requisition') {
      const result = await pool.query(
        `UPDATE requisitions 
         SET status = 'rejected', 
             approval_comment = $1,
             approved_by = $2,
             approved_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND status = 'pending'
         RETURNING *`,
        [comment, req.user.id, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Requisition not found' });
      }
      res.json(result.rows[0]);
    } else {
      const result = await pool.query(
        `UPDATE purchase_orders 
         SET status = 'rejected', 
             cancellation_reason = $1,
             cancelled_by = $2,
             cancelled_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND status = 'pending'
         RETURNING *`,
        [comment, req.user.id, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Purchase order not found' });
      }
      res.json(result.rows[0]);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting request', error: error.message });
  }
};