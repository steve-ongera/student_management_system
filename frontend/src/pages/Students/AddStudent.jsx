// frontend/src/pages/Students/AddStudent.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentsAPI } from '../../services/api';

const AddStudent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    admission_number: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: '',
    class: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    status: 'active'
  });

  const classes = ['Form 1A', 'Form 1B', 'Form 2A', 'Form 2B', 'Form 3A', 'Form 3B', 'Form 4A', 'Form 4B'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Student name is required';
    if (!formData.admission_number) newErrors.admission_number = 'Admission number is required';
    if (!formData.class) newErrors.class = 'Class is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.parent_name) newErrors.parent_name = 'Parent name is required';
    if (!formData.parent_phone) newErrors.parent_phone = 'Parent phone is required';
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (formData.parent_email && !/\S+@\S+\.\S+/.test(formData.parent_email)) {
      newErrors.parent_email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      await studentsAPI.createStudent(formData);
      navigate('/students');
    } catch (error) {
      console.error('Failed to create student:', error);
      setErrors({ submit: error.message || 'Failed to create student' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Add New Student</h1>
        <div className="page-actions">
          <button onClick={() => navigate('/students')} className="btn btn-secondary">
            <i className="bi bi-arrow-left me-1"></i>
            Back to Students
          </button>
        </div>
      </div>

      {errors.submit && (
        <div className="alert alert-danger">
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="student-form">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Personal Information</h3>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Admission Number</label>
                <input
                  type="text"
                  name="admission_number"
                  value={formData.admission_number}
                  onChange={handleChange}
                  className={`form-input ${errors.admission_number ? 'error' : ''}`}
                  placeholder="e.g., 2024001"
                />
                {errors.admission_number && <div className="form-error">{errors.admission_number}</div>}
              </div>
              
              <div className="form-group">
                <label className="form-label required">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="Enter student's full name"
                />
                {errors.name && <div className="form-error">{errors.name}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="student@example.com"
                />
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>
              
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., 0712345678"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label required">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`form-input ${errors.gender ? 'error' : ''}`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {errors.gender && <div className="form-error">{errors.gender}</div>}
              </div>
              
              <div className="form-group">
                <label className="form-label required">Class</label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  className={`form-input ${errors.class ? 'error' : ''}`}
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
                {errors.class && <div className="form-error">{errors.class}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="form-input"
                rows="2"
                placeholder="Enter student's home address"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Parent/Guardian Information</h3>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Parent/Guardian Name</label>
                <input
                  type="text"
                  name="parent_name"
                  value={formData.parent_name}
                  onChange={handleChange}
                  className={`form-input ${errors.parent_name ? 'error' : ''}`}
                  placeholder="Parent's full name"
                />
                {errors.parent_name && <div className="form-error">{errors.parent_name}</div>}
              </div>
              
              <div className="form-group">
                <label className="form-label required">Parent Phone</label>
                <input
                  type="tel"
                  name="parent_phone"
                  value={formData.parent_phone}
                  onChange={handleChange}
                  className={`form-input ${errors.parent_phone ? 'error' : ''}`}
                  placeholder="e.g., 0712345678"
                />
                {errors.parent_phone && <div className="form-error">{errors.parent_phone}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Parent Email</label>
                <input
                  type="email"
                  name="parent_email"
                  value={formData.parent_email}
                  onChange={handleChange}
                  className={`form-input ${errors.parent_email ? 'error' : ''}`}
                  placeholder="parent@example.com"
                />
                {errors.parent_email && <div className="form-error">{errors.parent_email}</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/students')} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Student'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddStudent;