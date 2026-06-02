// backend/routes/inventory.js
const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

// Stock Items
router.get('/items', protect, inventoryController.getStockItems);
router.get('/items/low-stock', protect, inventoryController.getLowStockItems);
router.get('/items/expiring', protect, inventoryController.getExpiringItems);
router.get('/items/:id', protect, inventoryController.getStockItem);
router.post('/items', protect, authorize('admin', 'inventory'), inventoryController.createStockItem);
router.put('/items/:id', protect, authorize('admin', 'inventory'), inventoryController.updateStockItem);
router.delete('/items/:id', protect, authorize('admin'), inventoryController.deleteStockItem);

// Categories
router.get('/categories', protect, inventoryController.getCategories);
router.post('/categories', protect, authorize('admin'), inventoryController.createCategory);

// Stock In
router.get('/stock-in', protect, inventoryController.getStockInRecords);
router.get('/stock-in/:id', protect, inventoryController.getStockInById);
router.post('/stock-in', protect, authorize('admin', 'inventory'), inventoryController.addStock);

// Stock Out
router.get('/stock-out', protect, inventoryController.getStockOutRecords);
router.get('/stock-out/:id', protect, inventoryController.getStockOutById);
router.post('/stock-out', protect, authorize('admin', 'inventory'), inventoryController.removeStock);

// Reports
router.get('/reports', protect, inventoryController.getInventoryReports);
router.get('/reports/stock-value', protect, inventoryController.getStockValueReport);
router.get('/reports/movements', protect, inventoryController.getMovementReport);
router.post('/reports/:type', protect, inventoryController.generateInventoryReport);

module.exports = router;