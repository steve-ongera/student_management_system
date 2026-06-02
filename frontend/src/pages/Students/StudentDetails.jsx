// frontend/src/pages/Students/StudentDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { studentsAPI } from '../../services/api';

const StudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const response = await studentsAPI.getStudent(id);
      setStudent(response.data);
    } catch (error) {
      console.error('Failed to fetch student:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await studentsAPI.deleteStudent(id);
        navigate('/students');
      } catch (error) {
        console.error('Failed to delete student:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading student details...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="page-container">
        <div className="alert alert-danger">
          Student not found
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Student Details</h1>
        <div className="page-actions">
          <Link to="/students" className="btn btn-secondary">
            <i className="bi bi-arrow-left me-1"></i>
            Back
          </Link>
          <Link to={`/students/${id}/edit`} className="btn btn-primary">
            <i className="bi bi-pencil me-1"></i>
            Edit
          </Link>
          <button onClick={handleDelete} className="btn btn-danger">
            <i className="bi bi-trash me-1"></i>
            Delete
          </button>
        </div>
      </div>

      <div className="student-profile">
        <div className="profile-header">
          <div className="profile-avatar">
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h2>{student.name}</h2>
            <p className="text-muted">Admission: {student.admission_number} | Class: {student.class}</p>
            <p className="text-muted">Status: <span className={`badge badge-${student.status === 'active' ? 'success' : 'danger'}`}>{student.status}</span></p>
          </div>
        </div>

        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`tab ${activeTab === 'academic' ? 'active' : ''}`}
            onClick={() => setActiveTab('academic')}
          >
            Academic Records
          </button>
          <button 
            className={`tab ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            Attendance
          </button>
          <button 
            className={`tab ${activeTab === 'fees' ? 'active' : ''}`}
            onClick={() => setActiveTab('fees')}
          >
            Fee Records
          </button>
          <button 
            className={`tab ${activeTab === 'parents' ? 'active' : ''}`}
            onClick={() => setActiveTab('parents')}
          >
            Parents
          </button>
        </div>

        <div className="tab-content-wrapper">
          {activeTab === 'profile' && (
            <div className="tab-content active">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Personal Information</h3>
                </div>
                <div className="card-body">
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Admission Number</label>
                      <p>{student.admission_number}</p>
                    </div>
                    <div className="info-item">
                      <label>Full Name</label>
                      <p>{student.name}</p>
                    </div>
                    <div className="info-item">
                      <label>Email</label>
                      <p>{student.email || 'Not provided'}</p>
                    </div>
                    <div className="info-item">
                      <label>Phone</label>
                      <p>{student.phone || 'Not provided'}</p>
                    </div>
                    <div className="info-item">
                      <label>Date of Birth</label>
                      <p>{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
                    </div>
                    <div className="info-item">
                      <label>Gender</label>
                      <p>{student.gender || 'Not specified'}</p>
                    </div>
                    <div className="info-item">
                      <label>Class</label>
                      <p>{student.class}</p>
                    </div>
                    <div className="info-item">
                      <label>Address</label>
                      <p>{student.address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'academic' && (
            <div className="tab-content active">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Academic Records</h3>
                  <button className="btn btn-sm btn-primary">Add Record</button>
                </div>
                <div className="card-body">
                  <p className="text-muted">Academic records will be displayed here</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="tab-content active">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Attendance Records</h3>
                </div>
                <div className="card-body">
                  <p className="text-muted">Attendance records will be displayed here</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fees' && (
            <div className="tab-content active">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Fee Records</h3>
                  <button className="btn btn-sm btn-primary">Add Payment</button>
                </div>
                <div className="card-body">
                  <p className="text-muted">Fee records will be displayed here</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'parents' && (
            <div className="tab-content active">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Parent/Guardian Information</h3>
                </div>
                <div className="card-body">
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Parent Name</label>
                      <p>{student.parent_name || 'Not provided'}</p>
                    </div>
                    <div className="info-item">
                      <label>Parent Phone</label>
                      <p>{student.parent_phone || 'Not provided'}</p>
                    </div>
                    <div className="info-item">
                      <label>Parent Email</label>
                      <p>{student.parent_email || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;