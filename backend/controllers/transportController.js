// backend/controllers/transportController.js
const pool = require('../config/database');

// Vehicles
exports.getVehicles = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM vehicles WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (registration_number ILIKE $${paramIndex} OR model ILIKE $${paramIndex} OR driver_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    const countQuery = 'SELECT COUNT(*) FROM vehicles' + 
      (status || search ? ' WHERE ' + 
        (status ? 'status = $1' : '') + 
        (status && search ? ' AND ' : '') +
        (search ? '(registration_number ILIKE $' + (status ? '2' : '1') + ' OR model ILIKE $' + (status ? '2' : '1') + ')' : '') : '');
    const countParams = [];
    if (status) countParams.push(status);
    if (search) countParams.push(`%${search}%`);
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      vehicles: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicles', error: error.message });
  }
};

exports.getVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM vehicles WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicle', error: error.message });
  }
};

exports.getVehicleMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM vehicle_maintenance WHERE vehicle_id = $1 ORDER BY maintenance_date DESC',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicle maintenance', error: error.message });
  }
};

exports.createVehicle = async (req, res) => {
  try {
    const { registration_number, model, capacity, driver_name, driver_phone, status } = req.body;
    
    const result = await pool.query(
      `INSERT INTO vehicles (registration_number, model, capacity, driver_name, driver_phone, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [registration_number, model, capacity, driver_name, driver_phone, status || 'active']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error creating vehicle', error: error.message });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { model, capacity, driver_name, driver_phone, status } = req.body;
    
    const result = await pool.query(
      `UPDATE vehicles 
       SET model = COALESCE($1, model),
           capacity = COALESCE($2, capacity),
           driver_name = COALESCE($3, driver_name),
           driver_phone = COALESCE($4, driver_phone),
           status = COALESCE($5, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [model, capacity, driver_name, driver_phone, status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating vehicle', error: error.message });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM vehicles WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting vehicle', error: error.message });
  }
};

// Routes
exports.getRoutes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, 
             COUNT(DISTINCT rs.id) as stop_count,
             COUNT(DISTINCT st.id) as student_count
      FROM routes r
      LEFT JOIN route_stops rs ON r.id = rs.route_id
      LEFT JOIN student_transport st ON r.id = st.route_id AND st.status = 'active'
      GROUP BY r.id
      ORDER BY r.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching routes', error: error.message });
  }
};

exports.getRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT r.*, 
             json_agg(jsonb_build_object(
               'id', rs.id, 'stop_name', rs.stop_name, 'stop_order', rs.stop_order,
               'latitude', rs.latitude, 'longitude', rs.longitude, 'estimated_time', rs.estimated_time
             ) ORDER BY rs.stop_order) as stops
      FROM routes r
      LEFT JOIN route_stops rs ON r.id = rs.route_id
      WHERE r.id = $1
      GROUP BY r.id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Route not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching route', error: error.message });
  }
};

exports.getRouteStops = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM route_stops WHERE route_id = $1 ORDER BY stop_order',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching route stops', error: error.message });
  }
};

exports.createRoute = async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, start_point, end_point, distance, duration, stops } = req.body;
    
    await client.query('BEGIN');
    
    const result = await client.query(
      `INSERT INTO routes (name, start_point, end_point, distance, duration)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, start_point, end_point, distance, duration]
    );
    
    const route = result.rows[0];
    
    if (stops && stops.length > 0) {
      for (const stop of stops) {
        await client.query(
          `INSERT INTO route_stops (route_id, stop_name, stop_order, latitude, longitude, estimated_time)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [route.id, stop.stop_name, stop.stop_order, stop.latitude, stop.longitude, stop.estimated_time]
        );
      }
    }
    
    await client.query('COMMIT');
    res.status(201).json(route);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error creating route', error: error.message });
  } finally {
    client.release();
  }
};

exports.updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, start_point, end_point, distance, duration } = req.body;
    
    const result = await pool.query(
      `UPDATE routes 
       SET name = COALESCE($1, name),
           start_point = COALESCE($2, start_point),
           end_point = COALESCE($3, end_point),
           distance = COALESCE($4, distance),
           duration = COALESCE($5, duration),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [name, start_point, end_point, distance, duration, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Route not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating route', error: error.message });
  }
};

exports.deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM routes WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Route not found' });
    }
    
    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting route', error: error.message });
  }
};

// Student Transport Assignments
exports.getStudentAssignments = async (req, res) => {
  try {
    const { route_id, vehicle_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT st.*, s.name as student_name, s.admission_number, s.class,
             v.registration_number, v.model,
             r.name as route_name
      FROM student_transport st
      JOIN students s ON st.student_id = s.id
      JOIN vehicles v ON st.vehicle_id = v.id
      JOIN routes r ON st.route_id = r.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (route_id) {
      query += ` AND st.route_id = $${paramIndex}`;
      params.push(route_id);
      paramIndex++;
    }
    
    if (vehicle_id) {
      query += ` AND st.vehicle_id = $${paramIndex}`;
      params.push(vehicle_id);
      paramIndex++;
    }
    
    query += ` ORDER BY st.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    const countQuery = 'SELECT COUNT(*) FROM student_transport' + 
      (route_id || vehicle_id ? ' WHERE ' + 
        (route_id ? 'route_id = $1' : '') + 
        (route_id && vehicle_id ? ' AND ' : '') +
        (vehicle_id ? 'vehicle_id = $' + (route_id ? '2' : '1') : '') : '');
    const countParams = [];
    if (route_id) countParams.push(route_id);
    if (vehicle_id) countParams.push(vehicle_id);
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      assignments: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student assignments', error: error.message });
  }
};

exports.getStudentAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT st.*, s.name as student_name, s.admission_number, s.class, s.parent_phone,
             v.registration_number, v.model, v.driver_name, v.driver_phone,
             r.name as route_name
      FROM student_transport st
      JOIN students s ON st.student_id = s.id
      JOIN vehicles v ON st.vehicle_id = v.id
      JOIN routes r ON st.route_id = r.id
      WHERE st.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignment', error: error.message });
  }
};

exports.assignStudent = async (req, res) => {
  try {
    const { student_id, vehicle_id, route_id, pickup_point, pickup_time, dropoff_time } = req.body;
    
    // Check if student already has active assignment
    const existing = await pool.query(
      'SELECT id FROM student_transport WHERE student_id = $1 AND status = \'active\'',
      [student_id]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Student already has an active transport assignment' });
    }
    
    const result = await pool.query(
      `INSERT INTO student_transport (student_id, vehicle_id, route_id, pickup_point, pickup_time, dropoff_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active') RETURNING *`,
      [student_id, vehicle_id, route_id, pickup_point, pickup_time, dropoff_time]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error assigning student', error: error.message });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicle_id, route_id, pickup_point, pickup_time, dropoff_time, status } = req.body;
    
    const result = await pool.query(
      `UPDATE student_transport 
       SET vehicle_id = COALESCE($1, vehicle_id),
           route_id = COALESCE($2, route_id),
           pickup_point = COALESCE($3, pickup_point),
           pickup_time = COALESCE($4, pickup_time),
           dropoff_time = COALESCE($5, dropoff_time),
           status = COALESCE($6, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [vehicle_id, route_id, pickup_point, pickup_time, dropoff_time, status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating assignment', error: error.message });
  }
};

exports.removeAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE student_transport SET status = \'inactive\', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    res.json({ message: 'Assignment removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing assignment', error: error.message });
  }
};

// GPS Tracking
exports.getAllVehicleLocations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.id, v.registration_number, v.model, v.driver_name,
             gl.latitude, gl.longitude, gl.speed, gl.heading, gl.last_update
      FROM vehicles v
      LEFT JOIN gps_locations gl ON v.id = gl.vehicle_id AND gl.last_update > NOW() - INTERVAL '5 minutes'
      WHERE v.status = 'active'
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicle locations', error: error.message });
  }
};

exports.getVehicleLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT * FROM gps_locations 
      WHERE vehicle_id = $1 
      ORDER BY last_update DESC 
      LIMIT 1
    `, [id]);
    
    res.json(result.rows[0] || { message: 'No location data available' });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicle location', error: error.message });
  }
};

exports.updateVehicleLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, speed, heading } = req.body;
    
    const result = await pool.query(
      `INSERT INTO gps_locations (vehicle_id, latitude, longitude, speed, heading, last_update)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (vehicle_id) DO UPDATE 
       SET latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude,
           speed = EXCLUDED.speed,
           heading = EXCLUDED.heading,
           last_update = EXCLUDED.last_update
       RETURNING *`,
      [id, latitude, longitude, speed, heading]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating vehicle location', error: error.message });
  }
};

exports.getLocationHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, limit = 100 } = req.query;
    
    const result = await pool.query(`
      SELECT * FROM gps_location_history 
      WHERE vehicle_id = $1 
        AND recorded_at BETWEEN $2 AND $3
      ORDER BY recorded_at DESC
      LIMIT $4
    `, [id, start_date, end_date, limit]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching location history', error: error.message });
  }
};

// Drivers
exports.getDrivers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, v.registration_number as assigned_vehicle
      FROM drivers d
      LEFT JOIN vehicles v ON d.id = v.driver_id
      ORDER BY d.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching drivers', error: error.message });
  }
};

exports.createDriver = async (req, res) => {
  try {
    const { name, license_number, phone, email, address, hire_date } = req.body;
    
    const result = await pool.query(
      `INSERT INTO drivers (name, license_number, phone, email, address, hire_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active') RETURNING *`,
      [name, license_number, phone, email, address, hire_date]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error creating driver', error: error.message });
  }
};

exports.updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, license_number, phone, email, address, status } = req.body;
    
    const result = await pool.query(
      `UPDATE drivers 
       SET name = COALESCE($1, name),
           license_number = COALESCE($2, license_number),
           phone = COALESCE($3, phone),
           email = COALESCE($4, email),
           address = COALESCE($5, address),
           status = COALESCE($6, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [name, license_number, phone, email, address, status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating driver', error: error.message });
  }
};

// Transport Reports
exports.getTransportReports = async (req, res) => {
  try {
    const { type, start_date, end_date } = req.query;
    
    let reportData = {};
    
    switch (type) {
      case 'vehicle-utilization':
        const utilization = await pool.query(`
          SELECT 
            v.id, v.registration_number, v.model,
            COUNT(DISTINCT st.id) as assigned_students,
            COUNT(DISTINCT CASE WHEN st.status = 'active' THEN st.id END) as active_assignments
          FROM vehicles v
          LEFT JOIN student_transport st ON v.id = st.vehicle_id
          GROUP BY v.id
          ORDER BY assigned_students DESC
        `);
        reportData = utilization.rows;
        break;
        
      case 'route-usage':
        const routeUsage = await pool.query(`
          SELECT 
            r.id, r.name, r.distance,
            COUNT(DISTINCT st.id) as assigned_students,
            COUNT(DISTINCT v.id) as assigned_vehicles
          FROM routes r
          LEFT JOIN student_transport st ON r.id = st.route_id AND st.status = 'active'
          LEFT JOIN vehicles v ON st.vehicle_id = v.id
          GROUP BY r.id
          ORDER BY assigned_students DESC
        `);
        reportData = routeUsage.rows;
        break;
        
      default:
        reportData = { message: 'Please specify report type: vehicle-utilization or route-usage' };
    }
    
    res.json(reportData);
  } catch (error) {
    res.status(500).json({ message: 'Error generating transport report', error: error.message });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json' } = req.query;
    
    let reportData;
    
    if (type === 'student-transport-list') {
      const result = await pool.query(`
        SELECT 
          s.name, s.admission_number, s.class, s.parent_phone,
          v.registration_number, v.model, v.driver_name, v.driver_phone,
          r.name as route_name, st.pickup_point, st.pickup_time
        FROM student_transport st
        JOIN students s ON st.student_id = s.id
        JOIN vehicles v ON st.vehicle_id = v.id
        JOIN routes r ON st.route_id = r.id
        WHERE st.status = 'active'
        ORDER BY r.name, st.pickup_time
      `);
      reportData = result.rows;
    }
    
    if (format === 'json') {
      res.json(reportData);
    } else {
      res.json({ message: 'Report generation for ' + format + ' coming soon' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
};