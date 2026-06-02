// frontend/src/pages/HumanResources/LeaveRequests.jsx
import React, { useState, useEffect } from 'react';
import { hrAPI } from '../../services/api';

const LeaveRequests = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: ''
  });

  useEffect(() => {
    fetchLeaveRequests();
    fetchEmployees();
    fetchLeaveTypes();
  }, []);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const response = await hrAPI.getLeaveRequests();
      setLeaveRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await hrAPI.getEmployees();
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const response = await hrAPI.getLeaveTypes();
      setLeaveTypes(response.data);
    } catch (error) {
      console.error('Failed to fetch leave types:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await hrAPI.createLeaveRequest(formData);
      setShowForm(false);
      fetchLeaveRequests();
      setFormData({
        employee_id: '',
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: ''
      });
    } catch (error) {
      console.error('Failed to create leave request:', error);
    }
  };

  const handleAction = async (id, action, comment = '') => {
    try {
      if (action === 'approve') {
        await hrAPI.approveLeave(id, comment);
      } else {
        await hrAPI.rejectLeave(id, comment);
      }
      fetchLeaveRequests();
    } catch (error) {
      console.error(`Failed to ${action} leave request:`, error);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Leave Management</h1>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <i className="bi-plus-circle me-1"></i>
            Request Leave
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading leave requests...</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Duration (Days)</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((request) => {
                const duration = Math.ceil(
                  (new Date(request.end_date) - new Date(request.start_date)) / 
                  (1000 * 60 * 60 * 24)
                ) + 1;
                
                return (
                  <tr key={request.id}>
                    <td>{request.employee_name}</td>
                    <td>{request.leave_type}</td>
                    <td>{new Date(request.start_date).toLocaleDateString()}</td>
                    <td>{new Date(request.end_date).toLocaleDateString()}</td>
                    <td>{duration}</td>
                    <td>{request.reason}</td>
                    <td>
                      <span className={`badge badge-${request.status === 'approved' ? 'success' : request.status === 'pending' ? 'warning' : 'danger'}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>
                      {request.status === 'pending' && (
                        <>
                          <button 
                            className="btn-icon btn-icon-success"
                            onClick={() => handleAction(request.id, 'approve')}
                          >
                            <i className="bi-check-circle"></i>
                          </button>
                          <button 
                            className="btn-icon btn-icon-danger"
                            onClick={() => handleAction(request.id, 'reject')}
                          >
                            <i className="bi-x-circle"></i>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request Leave</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Employee *</label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                  className="form-input"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.position}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Leave Type *</label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
                  className="form-input"
                  required
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.name}>
                      {type.name} ({type.days_allowed} days allowed)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="form-input"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="form-input"
                    required
                    min={formData.start_date || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason *</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="form-input"
                  rows="4"
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequests;