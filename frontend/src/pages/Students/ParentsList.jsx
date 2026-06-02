// frontend/src/pages/Students/ParentsList.jsx
import React, { useState, useEffect } from 'react';
import { studentsAPI } from '../../services/api';

const ParentsList = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    relationship: '',
    is_primary: false
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchParents();
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

  const fetchParents = async () => {
    setLoading(true);
    try {
      const response = await studentsAPI.getParents(selectedStudent);
      setParents(response.data);
    } catch (error) {
      console.error('Failed to fetch parents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await studentsAPI.addParent(selectedStudent, formData);
      setShowForm(false);
      fetchParents();
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        relationship: '',
        is_primary: false
      });
    } catch (error) {
      console.error('Failed to add parent:', error);
      alert('Failed to add parent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (parentId) => {
    if (window.confirm('Are you sure you want to remove this parent?')) {
      try {
        await studentsAPI.deleteParent(parentId);
        fetchParents();
      } catch (error) {
        console.error('Failed to delete parent:', error);
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Parent/Guardian Management</h1>
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
            Add Parent/Guardian
          </button>
        </div>
      </div>

      {selectedStudent && (
        loading ? (
          <div className="loading-state">Loading parents...</div>
        ) : parents.length === 0 ? (
          <div className="card">
            <p className="text-center">No parents/guardians found for this student.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Relationship</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Primary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parents.map((parent) => (
                  <tr key={parent.id}>
                    <td><strong>{parent.name}</strong></td>
                    <td>{parent.relationship}</td>
                    <td>{parent.phone}</td>
                    <td>{parent.email || '-'}</td>
                    <td>
                      {parent.is_primary ? (
                        <span className="badge badge-success">Yes</span>
                      ) : (
                        <span className="badge badge-secondary">No</span>
                      )}
                    </td>
                    <td>
                      <button className="btn-icon">
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button 
                        className="btn-icon btn-icon-danger"
                        onClick={() => handleDelete(parent.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Add Parent Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Parent/Guardian</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Relationship *</label>
                <select
                  value={formData.relationship}
                  onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                  className="form-input"
                  required
                >
                  <option value="">Select Relationship</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Grandparent">Grandparent</option>
                  <option value="Sibling">Sibling</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="form-input"
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.is_primary}
                    onChange={(e) => setFormData({...formData, is_primary: e.target.checked})}
                  />
                  <span className="form-checkbox-label">Set as Primary Contact</span>
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Parent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentsList;