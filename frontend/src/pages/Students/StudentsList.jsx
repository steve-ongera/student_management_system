// frontend/src/pages/Students/StudentsList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentsAPI } from '../../services/api';
import { debounce } from '../../services/apiHelper';

const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    male: 0,
    female: 0
  });

  useEffect(() => {
    fetchStudents();
    fetchStats();
  }, [currentPage, selectedClass, selectedStatus]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await studentsAPI.getStudents({
        page: currentPage,
        limit: 10,
        class: selectedClass,
        status: selectedStatus,
        search: searchTerm
      });
      setStudents(response.data.students);
      setTotalPages(response.data.totalPages);
      setTotalStudents(response.data.total);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await studentsAPI.getStudentStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const debouncedSearch = debounce(() => {
    setCurrentPage(1);
    fetchStudents();
  }, 500);

  useEffect(() => {
    if (searchTerm !== undefined) {
      debouncedSearch();
    }
  }, [searchTerm]);

  const handleStatusChange = async (id, status) => {
    try {
      if (status === 'active') {
        await studentsAPI.activateStudent(id);
      } else {
        await studentsAPI.deactivateStudent(id);
      }
      fetchStudents();
      fetchStats();
    } catch (error) {
      console.error('Failed to update student status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      try {
        await studentsAPI.deleteStudent(id);
        fetchStudents();
        fetchStats();
      } catch (error) {
        console.error('Failed to delete student:', error);
      }
    }
  };

  const classes = ['Form 1A', 'Form 1B', 'Form 2A', 'Form 2B', 'Form 3A', 'Form 3B', 'Form 4A', 'Form 4B'];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Students Management</h1>
        <div className="page-actions">
          <Link to="/students/add" className="btn btn-primary">
            <i className="bi bi-plus-circle me-1"></i>
            Add New Student
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-row">
        <div className="stat-mini-card">
          <div className="stat-value">{stats.total || totalStudents}</div>
          <div className="stat-label">Total Students</div>
        </div>
        <div className="stat-mini-card">
          <div className="stat-value">{stats.active || 0}</div>
          <div className="stat-label">Active Students</div>
        </div>
        <div className="stat-mini-card">
          <div className="stat-value">{stats.male || 0}</div>
          <div className="stat-label">Male</div>
        </div>
        <div className="stat-mini-card">
          <div className="stat-value">{stats.female || 0}</div>
          <div className="stat-label">Female</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search by name, admission number, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
        </div>
        <select 
          className="form-input" 
          value={selectedClass} 
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">All Classes</option>
          {classes.map(cls => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
        <select 
          className="form-input" 
          value={selectedStatus} 
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading students...</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Gender</th>
                  <th>Parent Name</th>
                  <th>Parent Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td><strong>{student.admission_number}</strong></td>
                    <td>
                      <Link to={`/students/${student.id}`} className="student-link">
                        {student.name}
                      </Link>
                    </td>
                    <td>{student.class}</td>
                    <td>{student.gender}</td>
                    <td>{student.parent_name}</td>
                    <td>{student.parent_phone}</td>
                    <td>
                      <span className={`badge badge-${student.status === 'active' ? 'success' : 'danger'}`}>
                        {student.status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/students/${student.id}`} className="btn-icon">
                        <i className="bi bi-eye"></i>
                      </Link>
                      <Link to={`/students/${student.id}/edit`} className="btn-icon">
                        <i className="bi bi-pencil"></i>
                      </Link>
                      <button 
                        className="btn-icon btn-icon-danger" 
                        onClick={() => handleDelete(student.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                      {student.status === 'active' ? (
                        <button 
                          className="btn-icon btn-icon-warning"
                          onClick={() => handleStatusChange(student.id, 'inactive')}
                        >
                          <i className="bi bi-ban"></i>
                        </button>
                      ) : (
                        <button 
                          className="btn-icon btn-icon-success"
                          onClick={() => handleStatusChange(student.id, 'active')}
                        >
                          <i className="bi bi-check-circle"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="btn" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button 
                className="btn" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentsList;