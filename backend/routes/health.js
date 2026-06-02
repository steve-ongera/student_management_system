// backend/routes/health.js
const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const { protect, authorize } = require('../middleware/auth');

// Medical Records
router.get('/records', protect, healthController.getMedicalRecords);
router.get('/records/:id', protect, healthController.getMedicalRecord);
router.get('/records/student/:studentId', protect, healthController.getStudentMedicalHistory);
router.post('/records', protect, authorize('admin', 'health_staff'), healthController.createMedicalRecord);
router.put('/records/:id', protect, authorize('admin', 'health_staff'), healthController.updateMedicalRecord);
router.delete('/records/:id', protect, authorize('admin'), healthController.deleteMedicalRecord);

// Clinic Visits
router.get('/visits', protect, healthController.getClinicVisits);
router.get('/visits/:id', protect, healthController.getClinicVisit);
router.get('/visits/daily', protect, healthController.getDailyVisits);
router.get('/visits/stats', protect, healthController.getVisitStats);
router.post('/visits', protect, authorize('admin', 'health_staff'), healthController.createClinicVisit);
router.put('/visits/:id', protect, authorize('admin', 'health_staff'), healthController.updateClinicVisit);

// Emergency Contacts
router.get('/emergency', protect, healthController.getEmergencyContacts);
router.get('/emergency/:id', protect, healthController.getEmergencyContact);
router.get('/emergency/student/:studentId', protect, healthController.getStudentEmergencyContacts);
router.post('/emergency', protect, healthController.createEmergencyContact);
router.put('/emergency/:id', protect, healthController.updateEmergencyContact);
router.delete('/emergency/:id', protect, authorize('admin'), healthController.deleteEmergencyContact);

// Prescriptions
router.get('/prescriptions', protect, healthController.getPrescriptions);
router.post('/prescriptions', protect, authorize('admin', 'health_staff'), healthController.createPrescription);

// Reports
router.get('/reports', protect, healthController.getHealthReports);
router.post('/reports/:type', protect, authorize('admin', 'health_staff'), healthController.generateHealthReport);

module.exports = router;