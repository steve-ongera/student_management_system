// backend/routes/procurement.js
const express = require('express');
const router = express.Router();
const procurementController = require('../controllers/procurementController');
const { protect, authorize } = require('../middleware/auth');

// Requisitions
router.get('/requisitions', protect, procurementController.getRequisitions);
router.get('/requisitions/:id', protect, procurementController.getRequisition);
router.post('/requisitions', protect, procurementController.createRequisition);
router.put('/requisitions/:id', protect, procurementController.updateRequisition);
router.post('/requisitions/:id/approve', protect, authorize('admin', 'manager'), procurementController.approveRequisition);
router.post('/requisitions/:id/reject', protect, authorize('admin', 'manager'), procurementController.rejectRequisition);

// Suppliers
router.get('/suppliers', protect, procurementController.getSuppliers);
router.get('/suppliers/:id', protect, procurementController.getSupplier);
router.post('/suppliers', protect, authorize('admin', 'procurement'), procurementController.createSupplier);
router.put('/suppliers/:id', protect, authorize('admin', 'procurement'), procurementController.updateSupplier);
router.delete('/suppliers/:id', protect, authorize('admin'), procurementController.deleteSupplier);
router.get('/suppliers/:id/performance', protect, procurementController.getSupplierPerformance);

// Purchase Orders
router.get('/orders', protect, procurementController.getPurchaseOrders);
router.get('/orders/:id', protect, procurementController.getPurchaseOrder);
router.post('/orders', protect, authorize('admin', 'procurement'), procurementController.createPurchaseOrder);
router.put('/orders/:id', protect, authorize('admin', 'procurement'), procurementController.updatePurchaseOrder);
router.post('/orders/:id/approve', protect, authorize('admin', 'manager'), procurementController.approvePurchaseOrder);
router.post('/orders/:id/receive', protect, procurementController.receiveOrder);
router.post('/orders/:id/cancel', protect, procurementController.cancelPurchaseOrder);

// Approvals
router.get('/approvals/pending', protect, authorize('admin', 'manager'), procurementController.getPendingApprovals);
router.post('/approvals/:id/approve', protect, authorize('admin', 'manager'), procurementController.approve);
router.post('/approvals/:id/reject', protect, authorize('admin', 'manager'), procurementController.reject);

module.exports = router;