// backend/routes/transport.js
const express = require('express');
const router = express.Router();
const transportController = require('../controllers/transportController');
const { protect, authorize } = require('../middleware/auth');

// Vehicles
router.get('/vehicles', protect, transportController.getVehicles);
router.get('/vehicles/:id', protect, transportController.getVehicle);
router.get('/vehicles/:id/maintenance', protect, transportController.getVehicleMaintenance);
router.post('/vehicles', protect, authorize('admin', 'transport'), transportController.createVehicle);
router.put('/vehicles/:id', protect, authorize('admin', 'transport'), transportController.updateVehicle);
router.delete('/vehicles/:id', protect, authorize('admin'), transportController.deleteVehicle);

// Routes
router.get('/routes', protect, transportController.getRoutes);
router.get('/routes/:id', protect, transportController.getRoute);
router.get('/routes/:id/stops', protect, transportController.getRouteStops);
router.post('/routes', protect, authorize('admin', 'transport'), transportController.createRoute);
router.put('/routes/:id', protect, authorize('admin', 'transport'), transportController.updateRoute);
router.delete('/routes/:id', protect, authorize('admin'), transportController.deleteRoute);

// Student Transport
router.get('/students', protect, transportController.getStudentAssignments);
router.get('/students/:id', protect, transportController.getStudentAssignment);
router.post('/students', protect, authorize('admin', 'transport'), transportController.assignStudent);
router.put('/students/:id', protect, authorize('admin', 'transport'), transportController.updateAssignment);
router.delete('/students/:id', protect, authorize('admin'), transportController.removeAssignment);

// GPS Tracking
router.get('/gps/all', protect, transportController.getAllVehicleLocations);
router.get('/gps/:id', protect, transportController.getVehicleLocation);
router.put('/gps/:id', protect, authorize('transport'), transportController.updateVehicleLocation);
router.get('/gps/:id/history', protect, transportController.getLocationHistory);

// Drivers
router.get('/drivers', protect, transportController.getDrivers);
router.post('/drivers', protect, authorize('admin', 'transport'), transportController.createDriver);
router.put('/drivers/:id', protect, authorize('admin', 'transport'), transportController.updateDriver);

// Reports
router.get('/reports', protect, transportController.getTransportReports);
router.post('/reports/:type', protect, transportController.generateReport);

module.exports = router;