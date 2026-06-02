// frontend/src/pages/HumanResources/EmployeesList.jsx
import React, { useState, useEffect } from 'react';
import { hrAPI } from '../../services/api';
import { debounce } from '../../services/apiHelper';
import EmployeeForm from './EmployeeForm';

const EmployeesList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [department, setDepartment] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    onLeave: 0,
    departments: []
  });

  useEffect(() => {
    fetchEmployees();
    fetchStats();
  }, [department]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await hrAPI.getEmployees({
        search: searchTerm,
        department: department || undefined
      });
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await hrAPI.getEmployeeStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const debouncedSearch = debounce(fetchEmployees, 500);

  useEffect(() => {
    debouncedSearch();
  }, [searchTerm]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await hrAPI.deleteEmployee(id);
        fetchEmployees();
        fetchStats();
      } catch (error) {
        console.error('Failed to delete employee:', error);
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Employee Management</h1>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <i className="bi-plus-circle me-1"></i>
            Add Employee
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-row">
        <div className="stat-mini-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Employees</div>
        </div>
        <div className="stat-mini-card">
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-mini-card">
          <div className="stat-value">{stats.onLeave}</div>
          <div className="stat-label">On Leave</div>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <i className="bi-search"></i>
          <input
            type="text"
            placeholder="Search employees by name, email, or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
        </div>
        <select 
          className="form-input" 
          value={department} 
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="">All Departments</option>
          {stats.departments.map((dept, index) => (
            <option key={index} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-state">Loading employees...</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Position</th>
                <th>Department</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.employee_id}</td>
                  <td>
                    <div className="employee-name">
                      <div className="employee-avatar">
                        {employee.name.charAt(0)}
                      </div>
                      <div>
                        <div>{employee.name}</div>
                        <div className="text-small">{employee.position}</div>
                      </div>
                    </div>
                  </td>
                  <td>{employee.position}</td>
                  <td>{employee.department}</td>
                  <td>{employee.email}</td>
                  <td>{employee.phone}</td>
                  <td>
                    <span className={`badge badge-${employee.status === 'active' ? 'success' : employee.status === 'on_leave' ? 'warning' : 'danger'}`}>
                      {employee.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <button className="btn-icon" onClick={() => {
                      setEditingEmployee(employee);
                      setShowForm(true);
                    }}>
                      <i className="bi-pencil"></i>
                    </button>
                    <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(employee.id)}>
                      <i className="bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <EmployeeForm 
          employee={editingEmployee} 
          onClose={() => {
            setShowForm(false);
            setEditingEmployee(null);
            fetchEmployees();
            fetchStats();
          }} 
        />
      )}
    </div>
  );
};

export default EmployeesList;