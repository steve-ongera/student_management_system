// backend/routes/assets.js
const express = require('express');
const router = express.Router();
const assetsController = require('../controllers/assetsController');
const { protect, authorize } = require('../middleware/auth');

// Asset Register
router.get('/register', protect, assetsController.getAssets);
router.get('/register/:id', protect, assetsController.getAsset);
router.get('/register/tag/:tag', protect, assetsController.getAssetByTag);
router.get('/categories', protect, assetsController.getAssetCategories);
router.post('/register', protect, authorize('admin', 'assets'), assetsController.createAsset);
router.put('/register/:id', protect, authorize('admin', 'assets'), assetsController.updateAsset);
router.delete('/register/:id', protect, authorize('admin'), assetsController.deleteAsset);

// Maintenance
router.get('/maintenance', protect, assetsController.getMaintenanceRecords);
router.get('/maintenance/:id', protect, assetsController.getMaintenanceRecord);
router.get('/maintenance/upcoming', protect, assetsController.getUpcomingMaintenance);
router.get('/maintenance/asset/:assetId', protect, assetsController.getAssetMaintenanceHistory);
router.post('/maintenance', protect, authorize('admin', 'assets'), assetsController.scheduleMaintenance);
router.put('/maintenance/:id', protect, authorize('admin', 'assets'), assetsController.updateMaintenance);
router.post('/maintenance/:id/complete', protect, authorize('admin', 'assets'), assetsController.completeMaintenance);

// Depreciation
router.get('/depreciation/:id', protect, assetsController.calculateDepreciation);
router.get('/depreciation/report', protect, assetsController.getDepreciationReport);
router.get('/depreciation/asset/:assetId', protect, assetsController.getAssetDepreciation);
router.post('/depreciation/run', protect, authorize('admin', 'assets'), assetsController.runDepreciation);

// Reports
router.get('/reports', protect, assetsController.getAssetReports);
router.get('/reports/valuation', protect, assetsController.getAssetValuation);
router.get('/reports/utilization', protect, assetsController.getAssetUtilization);
router.post('/reports/:type', protect, assetsController.generateAssetReport);

module.exports = router;