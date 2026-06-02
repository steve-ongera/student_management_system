// frontend/src/pages/Students/AcademicRecords.jsx
import React, { useState, useEffect } from 'react';
import { studentsAPI } from '../../services/api';

const AcademicRecords = () => {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    term: '',
    year: new Date().getFullYear(),
    subjects: [],
    total_marks: 0,
    average: 0,
    grade: '',
    position: 0
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchRecords();
    }
  }, [selectedStudent]);

  const fetchStudents = async () => {
    try {
      const response = await studentsAPI.getStudents({ limit: 100 });
      setStudents(response.data.students);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await studentsAPI.getAcademicRecords(selectedStudent);
      setRecords(response.data);
    } catch (error) {
      console.error('Failed to fetch academic records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await studentsAPI.addAcademicRecord(selectedStudent, formData);
      setShowForm(false);
      fetchRecords();
      setFormData({
        student_id: '',
        term: '',
        year: new Date().getFullYear(),
        subjects: [],
        total_marks: 0,
        average: 0,
        grade: '',
        position: 0
      });
    } catch (error) {
      console.error('Failed to add academic record:', error);
    }
  };

  const getGradeColor = (grade) => {
    const colors = {
      'A': 'success',
      'A-': 'success',
      'B+': 'info',
      'B': 'info',
      'B-': 'info',
      'C+': 'warning',
      'C': 'warning',
      'C-': 'warning',
      'D+': 'danger',
      'D': 'danger',
      'D-': 'danger',
      'E': 'danger'
    };
    return colors[grade] || 'secondary';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Academic Records</h1>
      </div>

      <div className="filters-bar">
        <div className="form-group">
          <label className="form-label">Select Student</label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="form-input"
          >
            <option value="">Choose a student...</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.admission_number} - {student.name} ({student.class})
              </option>
            ))}
          </select>
        </div>
        <div className="page-actions">
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(true)}
            disabled={!selectedStudent}
          >
            <i className="bi bi-plus-circle me-1"></i>
            Add Record
          </button>
        </div>
      </div>

      {selectedStudent && (
        loading ? (
          <div className="loading-state">Loading records...</div>
        ) : records.length === 0 ? (
          <div className="card">
            <p className="text-center">No academic records found for this student.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Term</th>
                  <th>Year</th>
                  <th>Total Marks</th>
                  <th>Average</th>
                  <th>Grade</th>
                  <th>Position</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.term}</td>
                    <td>{record.year}</td>
                    <td>{record.total_marks}</td>
                    <td>{record.average}%</td>
                    <td>
                      <span className={`badge badge-${getGradeColor(record.grade)}`}>
                        {record.grade}
                      </span>
                    </td>
                    <td>{record.position}</td>
                    <td>
                      <button className="btn-icon">
                        <i className="bi bi-eye"></i>
                      </button>
                      <button className="btn-icon">
                        <i className="bi bi-pencil"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Academic Record</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Term</label>
                  <select
                    value={formData.term}
                    onChange={(e) => setFormData({...formData, term: e.target.value})}
                    className="form-input"
                    required
                  >
                    <option value="">Select Term</option>
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Total Marks</label>
                <input
                  type="number"
                  value={formData.total_marks}
                  onChange={(e) => setFormData({...formData, total_marks: parseInt(e.target.value)})}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Average (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.average}
                  onChange={(e) => setFormData({...formData, average: parseFloat(e.target.value)})}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Grade</label>
                <input
                  type="text"
                  value={formData.grade}
                  onChange={(e) => setFormData({...formData, grade: e.target.value})}
                  className="form-input"
                  required
                  placeholder="e.g., A, B+, C-"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Position</label>
                <input
                  type="number"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: parseInt(e.target.value)})}
                  className="form-input"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicRecords;