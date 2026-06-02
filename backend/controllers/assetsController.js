// backend/controllers/assetsController.js
const pool = require('../config/database');

// Asset Register
exports.getAssets = async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM assets WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR asset_tag ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    const countQuery = 'SELECT COUNT(*) FROM assets' + 
      (category || status || search ? ' WHERE ' + 
        (category ? 'category = $1' : '') + 
        ((category && status) || (category && search) ? ' AND ' : '') +
        (status ? 'status = $' + (category ? '2' : '1') : '') +
        ((status && search) ? ' AND ' : '') +
        (search ? '(name ILIKE $' + ((category && status) ? '3' : (category || status) ? '2' : '1') + ' OR asset_tag ILIKE $' + ((category && status) ? '3' : (category || status) ? '2' : '1') + ')' : '') : '');
    const countParams = [];
    if (category) countParams.push(category);
    if (status) countParams.push(status);
    if (search) countParams.push(`%${search}%`);
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      assets: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assets', error: error.message });
  }
};

exports.getAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT a.*,
             (SELECT json_agg(jsonb_build_object(
               'id', m.id, 'maintenance_date', m.maintenance_date,
               'maintenance_type', m.maintenance_type, 'cost', m.cost,
               'description', m.description, 'performed_by', m.performed_by
             ) ORDER BY m.maintenance_date DESC) as maintenance_records
      FROM assets a
      LEFT JOIN maintenance_records m ON a.id = m.asset_id
      WHERE a.id = $1
      GROUP BY a.id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching asset', error: error.message });
  }
};

exports.getAssetByTag = async (req, res) => {
  try {
    const { tag } = req.params;
    const result = await pool.query('SELECT * FROM assets WHERE asset_tag = $1', [tag]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching asset', error: error.message });
  }
};

exports.getAssetCategories = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM assets WHERE category IS NOT NULL ORDER BY category'
    );
    res.json(result.rows.map(r => r.category));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching asset categories', error: error.message });
  }
};

exports.createAsset = async (req, res) => {
  try {
    const {
      asset_tag, name, category, purchase_date, purchase_cost,
      current_value, location, status, description
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO assets (asset_tag, name, category, purchase_date, purchase_cost, 
       current_value, location, status, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [asset_tag, name, category, purchase_date, purchase_cost, 
       current_value || purchase_cost, location, status || 'active', description]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error creating asset', error: error.message });
  }
};

exports.updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, category, location, status, current_value, description
    } = req.body;
    
    const result = await pool.query(
      `UPDATE assets 
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           location = COALESCE($3, location),
           status = COALESCE($4, status),
           current_value = COALESCE($5, current_value),
           description = COALESCE($6, description),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [name, category, location, status, current_value, description, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating asset', error: error.message });
  }
};

exports.deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM assets WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting asset', error: error.message });
  }
};

// Maintenance Records
exports.getMaintenanceRecords = async (req, res) => {
  try {
    const { asset_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT m.*, a.name as asset_name, a.asset_tag
      FROM maintenance_records m
      JOIN assets a ON m.asset_id = a.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (asset_id) {
      query += ` AND m.asset_id = $${paramIndex}`;
      params.push(asset_id);
      paramIndex++;
    }
    
    query += ` ORDER BY m.maintenance_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    const countQuery = 'SELECT COUNT(*) FROM maintenance_records' + (asset_id ? ' WHERE asset_id = $1' : '');
    const countResult = await pool.query(countQuery, asset_id ? [asset_id] : []);
    
    res.json({
      records: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching maintenance records', error: error.message });
  }
};

exports.getMaintenanceRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT m.*, a.name as asset_name, a.asset_tag, a.location
      FROM maintenance_records m
      JOIN assets a ON m.asset_id = a.id
      WHERE m.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching maintenance record', error: error.message });
  }
};

exports.getUpcomingMaintenance = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, a.name as asset_name, a.asset_tag, a.location
      FROM maintenance_records m
      JOIN assets a ON m.asset_id = a.id
      WHERE m.next_maintenance_date <= CURRENT_DATE + INTERVAL '30 days'
        AND m.next_maintenance_date IS NOT NULL
      ORDER BY m.next_maintenance_date ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching upcoming maintenance', error: error.message });
  }
};

exports.getAssetMaintenanceHistory = async (req, res) => {
  try {
    const { assetId } = req.params;
    const result = await pool.query(`
      SELECT * FROM maintenance_records 
      WHERE asset_id = $1 
      ORDER BY maintenance_date DESC
    `, [assetId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching asset maintenance history', error: error.message });
  }
};

exports.scheduleMaintenance = async (req, res) => {
  try {
    const {
      asset_id, maintenance_date, maintenance_type, cost,
      description, performed_by, next_maintenance_date
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO maintenance_records (asset_id, maintenance_date, maintenance_type, 
       cost, description, performed_by, next_maintenance_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [asset_id, maintenance_date, maintenance_type, cost, description, performed_by, next_maintenance_date]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error scheduling maintenance', error: error.message });
  }
};

exports.updateMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      maintenance_type, cost, description, performed_by, next_maintenance_date
    } = req.body;
    
    const result = await pool.query(
      `UPDATE maintenance_records 
       SET maintenance_type = COALESCE($1, maintenance_type),
           cost = COALESCE($2, cost),
           description = COALESCE($3, description),
           performed_by = COALESCE($4, performed_by),
           next_maintenance_date = COALESCE($5, next_maintenance_date),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [maintenance_type, cost, description, performed_by, next_maintenance_date, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating maintenance record', error: error.message });
  }
};

exports.completeMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { completion_notes } = req.body;
    
    const result = await pool.query(
      `UPDATE maintenance_records 
       SET completion_date = CURRENT_DATE,
           completion_notes = $1,
           status = 'completed',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [completion_notes, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error completing maintenance', error: error.message });
  }
};

// Depreciation
exports.calculateDepreciation = async (req, res) => {
  try {
    const { id } = req.params;
    const { method = 'straight-line', years = 5 } = req.query;
    
    const asset = await pool.query('SELECT * FROM assets WHERE id = $1', [id]);
    
    if (asset.rows.length === 0) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    const assetData = asset.rows[0];
    const purchaseDate = new Date(assetData.purchase_date);
    const currentDate = new Date();
    const yearsOwned = (currentDate - purchaseDate) / (1000 * 60 * 60 * 24 * 365);
    
    let depreciationValue = 0;
    let currentValue = assetData.purchase_cost;
    
    if (method === 'straight-line') {
      const annualDepreciation = assetData.purchase_cost / years;
      depreciationValue = annualDepreciation * yearsOwned;
      currentValue = assetData.purchase_cost - depreciationValue;
    } else if (method === 'declining-balance') {
      const rate = 2 / years; // Double declining balance
      for (let i = 0; i < Math.floor(yearsOwned); i++) {
        currentValue = currentValue * (1 - rate);
      }
      depreciationValue = assetData.purchase_cost - currentValue;
    }
    
    res.json({
      asset_id: id,
      asset_name: assetData.name,
      original_cost: assetData.purchase_cost,
      current_value: Math.max(0, currentValue),
      depreciation_value: Math.max(0, depreciationValue),
      depreciation_rate: (depreciationValue / assetData.purchase_cost) * 100,
      years_owned: yearsOwned.toFixed(2),
      method: method
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating depreciation', error: error.message });
  }
};

exports.getDepreciationReport = async (req, res) => {
  try {
    const { as_of_date = new Date().toISOString().split('T')[0] } = req.query;
    
    const result = await pool.query(`
      SELECT 
        a.id, a.asset_tag, a.name, a.category,
        a.purchase_cost, a.purchase_date,
        EXTRACT(YEAR FROM AGE($1::date, a.purchase_date)) as years_owned,
        a.current_value,
        (a.purchase_cost - a.current_value) as total_depreciation,
        ((a.purchase_cost - a.current_value) / a.purchase_cost * 100) as depreciation_percentage
      FROM assets a
      ORDER BY total_depreciation DESC
    `, [as_of_date]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error generating depreciation report', error: error.message });
  }
};

exports.getAssetDepreciation = async (req, res) => {
  try {
    const { assetId } = req.params;
    const result = await pool.query(`
      SELECT 
        a.*,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.purchase_date)) as years_owned,
        (a.purchase_cost - a.current_value) as total_depreciation
      FROM assets a
      WHERE a.id = $1
    `, [assetId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching asset depreciation', error: error.message });
  }
};

exports.runDepreciation = async (req, res) => {
  try {
    const { as_of_date = new Date().toISOString().split('T')[0], method = 'straight-line' } = req.body;
    
    const assets = await pool.query('SELECT * FROM assets WHERE status = \'active\'');
    
    for (const asset of assets.rows) {
      const purchaseDate = new Date(asset.purchase_date);
      const asOf = new Date(as_of_date);
      const yearsOwned = (asOf - purchaseDate) / (1000 * 60 * 60 * 24 * 365);
      
      let currentValue = asset.purchase_cost;
      
      if (method === 'straight-line') {
        const usefulLife = 5; // Default 5 years
        const annualDepreciation = asset.purchase_cost / usefulLife;
        const depreciation = annualDepreciation * Math.min(yearsOwned, usefulLife);
        currentValue = Math.max(0, asset.purchase_cost - depreciation);
      }
      
      await pool.query(
        'UPDATE assets SET current_value = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [currentValue, asset.id]
      );
    }
    
    res.json({ message: 'Depreciation calculation completed', method, as_of_date });
  } catch (error) {
    res.status(500).json({ message: 'Error running depreciation', error: error.message });
  }
};

// Asset Reports
exports.getAssetReports = async (req, res) => {
  try {
    const { type } = req.query;
    
    let reportData = {};
    
    switch (type) {
      case 'asset-value-summary':
        const valueSummary = await pool.query(`
          SELECT 
            category,
            COUNT(*) as total_assets,
            SUM(purchase_cost) as total_cost,
            SUM(current_value) as total_current_value,
            SUM(purchase_cost - current_value) as total_depreciation
          FROM assets
          GROUP BY category
          ORDER BY category
        `);
        reportData = valueSummary.rows;
        break;
        
      case 'maintenance-cost':
        const maintenanceCost = await pool.query(`
          SELECT 
            a.category,
            COUNT(m.id) as maintenance_count,
            SUM(m.cost) as total_cost,
            AVG(m.cost) as avg_cost
          FROM maintenance_records m
          JOIN assets a ON m.asset_id = a.id
          GROUP BY a.category
          ORDER BY total_cost DESC
        `);
        reportData = maintenanceCost.rows;
        break;
        
      default:
        reportData = { message: 'Please specify report type: asset-value-summary or maintenance-cost' };
    }
    
    res.json(reportData);
  } catch (error) {
    res.status(500).json({ message: 'Error generating asset report', error: error.message });
  }
};

exports.getAssetValuation = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        SUM(purchase_cost) as total_original_value,
        SUM(current_value) as total_current_value,
        SUM(purchase_cost - current_value) as total_depreciation,
        COUNT(*) as total_assets,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_assets
      FROM assets
    `);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching asset valuation', error: error.message });
  }
};

exports.getAssetUtilization = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.category,
        COUNT(a.id) as total_assets,
        COUNT(CASE WHEN a.status = 'active' THEN 1 END) as active_assets,
        COUNT(DISTINCT m.id) as maintenance_events
      FROM assets a
      LEFT JOIN maintenance_records m ON a.id = m.asset_id
      GROUP BY a.category
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching asset utilization', error: error.message });
  }
};

exports.generateAssetReport = async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json' } = req.query;
    
    let reportData;
    
    if (type === 'full-asset-register') {
      const result = await pool.query(`
        SELECT 
          a.*,
          COUNT(m.id) as maintenance_count,
          SUM(m.cost) as total_maintenance_cost
        FROM assets a
        LEFT JOIN maintenance_records m ON a.id = m.asset_id
        GROUP BY a.id
        ORDER BY a.category, a.name
      `);
      reportData = result.rows;
    }
    
    if (format === 'json') {
      res.json(reportData);
    } else {
      res.json({ message: 'Report generation for ' + format + ' coming soon' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error generating asset report', error: error.message });
  }
};