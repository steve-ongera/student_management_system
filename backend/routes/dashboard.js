// backend/routes/dashboard.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = {};
    
    // Total students
    const students = await pool.query('SELECT COUNT(*) FROM students');
    stats.totalStudents = parseInt(students.rows[0]?.count || 0);
    
    // Total books
    const books = await pool.query('SELECT COUNT(*) FROM books');
    stats.totalBooks = parseInt(books.rows[0]?.count || 0);
    
    // Total employees (active)
    const employees = await pool.query("SELECT COUNT(*) FROM employees WHERE status = 'active'");
    stats.totalEmployees = parseInt(employees.rows[0]?.count || 0);
    
    // Pending approvals (purchase orders)
    const pendingApprovals = await pool.query(
      "SELECT COUNT(*) FROM purchase_orders WHERE status = 'pending'"
    );
    stats.pendingApprovals = parseInt(pendingApprovals.rows[0]?.count || 0);
    
    // Active borrowings
    const activeBorrowings = await pool.query(
      'SELECT COUNT(*) FROM borrowings WHERE return_date IS NULL'
    );
    stats.activeBorrowings = parseInt(activeBorrowings.rows[0]?.count || 0);
    
    // Vehicles in use (active vehicles)
    const vehiclesInUse = await pool.query(
      "SELECT COUNT(*) FROM vehicles WHERE status = 'active'"
    );
    stats.vehiclesInUse = parseInt(vehiclesInUse.rows[0]?.count || 0);
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return default stats instead of error
    res.json({
      totalStudents: 0,
      totalBooks: 0,
      totalEmployees: 0,
      pendingApprovals: 0,
      activeBorrowings: 0,
      vehiclesInUse: 0
    });
  }
});

// Get recent activities
router.get('/activities', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const activities = [];
    
    // Recent borrowings
    const borrowings = await pool.query(`
      SELECT 
        b.id, 
        'borrowing' as type, 
        b.created_at,
        CONCAT(s.name, ' borrowed "', bk.title, '"') as description
      FROM borrowings b
      JOIN students s ON b.student_id = s.id
      JOIN books bk ON b.book_id = bk.id
      ORDER BY b.created_at DESC
      LIMIT $1
    `, [limit]);
    
    // Recent purchase orders
    const purchaseOrders = await pool.query(`
      SELECT 
        po.id, 
        'purchase_order' as type, 
        po.created_at,
        CONCAT('Purchase order #', po.order_number, ' created') as description
      FROM purchase_orders po
      ORDER BY po.created_at DESC
      LIMIT $1
    `, [limit]);
    
    // Recent clinic visits
    const clinicVisits = await pool.query(`
      SELECT 
        cv.id, 
        'clinic_visit' as type, 
        cv.created_at,
        CONCAT(s.name, ' visited the clinic') as description
      FROM clinic_visits cv
      JOIN students s ON cv.student_id = s.id
      ORDER BY cv.created_at DESC
      LIMIT $1
    `, [limit]);
    
    activities.push(...borrowings.rows, ...purchaseOrders.rows, ...clinicVisits.rows);
    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const icons = {
      borrowing: 'book',
      purchase_order: 'cart',
      clinic_visit: 'activity'
    };
    
    const formattedActivities = activities.slice(0, limit).map(activity => ({
      id: activity.id,
      description: activity.description,
      time: activity.created_at ? new Date(activity.created_at).toLocaleString() : new Date().toLocaleString(),
      icon: icons[activity.type] || 'bell'
    }));
    
    res.json(formattedActivities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.json([]);
  }
});

// Get chart data
router.get('/charts', async (req, res) => {
  try {
    const chartData = {};
    
    // Monthly borrowings for the last 6 months
    const monthlyBorrowings = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', borrow_date), 'Mon YYYY') as month,
        COUNT(*) as count
      FROM borrowings
      WHERE borrow_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', borrow_date)
      ORDER BY DATE_TRUNC('month', borrow_date) ASC
    `);
    chartData.monthlyBorrowings = monthlyBorrowings.rows;
    
    // Books by category
    const booksByCategory = await pool.query(`
      SELECT 
        COALESCE(category, 'Uncategorized') as category, 
        COUNT(*) as count
      FROM books
      GROUP BY category
    `);
    chartData.booksByCategory = booksByCategory.rows;
    
    // Employee distribution by department
    const employeesByDepartment = await pool.query(`
      SELECT 
        COALESCE(d.name, 'Unassigned') as department, 
        COUNT(e.id) as count
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      GROUP BY d.name
    `);
    chartData.employeesByDepartment = employeesByDepartment.rows;
    
    // Stock value by category
    const stockValue = await pool.query(`
      SELECT 
        COALESCE(category, 'Uncategorized') as category, 
        COALESCE(SUM(quantity * unit_price), 0) as value
      FROM stock_items
      GROUP BY category
    `);
    chartData.stockValue = stockValue.rows;
    
    res.json(chartData);
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.json({});
  }
});

module.exports = router;