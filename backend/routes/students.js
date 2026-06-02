// backend/routes/students.js
const express = require('express');
const router = express.Router();
const studentsController = require('../controllers/studentsController');
const { protect, authorize } = require('../middleware/auth');

// Student routes
router.get('/', protect, studentsController.getStudents);
router.get('/stats', protect, studentsController.getStudentStats);
router.get('/:id', protect, studentsController.getStudent);
router.get('/admission/:admissionNumber', protect, studentsController.getStudentByAdmission);
router.post('/', protect, authorize('admin', 'registrar'), studentsController.createStudent);
router.put('/:id', protect, authorize('admin', 'registrar'), studentsController.updateStudent);
router.delete('/:id', protect, authorize('admin'), studentsController.deleteStudent);
router.post('/:id/activate', protect, authorize('admin'), studentsController.activateStudent);
router.post('/:id/deactivate', protect, authorize('admin'), studentsController.deactivateStudent);
router.get('/class/:className', protect, studentsController.getStudentsByClass);
router.get('/search/:query', protect, studentsController.searchStudents);

// Student academic records
router.get('/:id/academic-records', protect, studentsController.getAcademicRecords);
router.post('/:id/academic-records', protect, authorize('admin', 'teacher'), studentsController.addAcademicRecord);
router.put('/academic-records/:recordId', protect, authorize('admin', 'teacher'), studentsController.updateAcademicRecord);

// Student attendance
router.get('/:id/attendance', protect, studentsController.getAttendance);
router.post('/:id/attendance', protect, authorize('admin', 'teacher'), studentsController.markAttendance);

// Student fees
router.get('/:id/fees', protect, studentsController.getFeeRecords);
router.post('/:id/fees/pay', protect, authorize('admin', 'accounts'), studentsController.payFees);
router.get('/:id/fees/balance', protect, studentsController.getFeeBalance);

// Student documents
router.get('/:id/documents', protect, studentsController.getDocuments);
router.post('/:id/documents', protect, authorize('admin', 'registrar'), studentsController.uploadDocument);
router.delete('/documents/:documentId', protect, authorize('admin'), studentsController.deleteDocument);

// Student parents/guardians
router.get('/:id/parents', protect, studentsController.getParents);
router.post('/:id/parents', protect, authorize('admin', 'registrar'), studentsController.addParent);
router.put('/parents/:parentId', protect, authorize('admin', 'registrar'), studentsController.updateParent);
router.delete('/parents/:parentId', protect, authorize('admin'), studentsController.deleteParent);

module.exports = router;