// frontend/src/pages/HealthCenter/ClinicVisitsList.jsx
import React, { useState, useEffect } from 'react';
import { healthAPI } from '../../services/api';

const ClinicVisitsList = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyStats, setDailyStats] = useState({ total: 0, treated: 0, referred: 0 });
  const [formData, setFormData] = useState({
    student_id: '',
    visit_date: new Date().toISOString().split('T')[0],
    symptoms: '',
    diagnosis: '',
    treatment: '',
    referred: false,
    referred_to: '',
    notes: ''
  });

  useEffect(() => {
    fetchVisits();
    fetchStudents();
    fetchDailyStats();
  }, [selectedDate]);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const response = await healthAPI.getClinicVisits({ date: selectedDate });
      setVisits(response.data);
    
    } catch (error) {
      console.error('Failed to fetch visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      // Fetch students from your API
      const response = await fetch('/api/students');
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const fetchDailyStats = async () => {
    try {
      const response = await healthAPI.getDailyVisits(selectedDate);
      setDailyStats(response.data);
    } catch (error) {
      console.error('Failed to fetch daily stats:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await healthAPI.createClinicVisit(formData);
      setShowForm(false);
      fetchVisits();
      fetchDailyStats();
      setFormData({
        student_id: '',
        visit_date: new Date().toISOString().split('T')[0],
        symptoms: '',
        diagnosis: '',
        treatment: '',
        referred: false,
        referred_to: '',
        notes: ''
      });
    } catch (error) {
      console.error('Failed to create clinic visit:', error);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Clinic Visits</h1>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <i className="bi-plus-circle me-1"></i>
            Record Visit
          </button>
        </div>
      </div>

      {/* Daily Statistics */}
      <div className="stats-row">
        <div className="stat-mini-card">
          <div className="stat-value">{dailyStats.total}</div>
          <div className="stat-label">Total Visits</div>
        </div>
        <div className="stat-mini-card">
          <div className="stat-value">{dailyStats.treated}</div>
          <div className="stat-label">Treated</div>
        </div>
        <div className="stat-mini-card">
          <div className="stat-value">{dailyStats.referred}</div>
          <div className="stat-label">Referred</div>
        </div>
      </div>

      <div className="filters-bar">
        <div className="form-group">
          <label className="form-label">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading clinic visits...</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Student Name</th>
                <th>Admission No</th>
                <th>Symptoms</th>
                <th>Diagnosis</th>
                <th>Treatment</th>
                <th>Referred</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => (
                <tr key={visit.id}>
                  <td>{new Date(visit.created_at).toLocaleTimeString()}</td>
                  <td>{visit.student_name}</td>
                  <td>{visit.admission_number}</td>
                  <td>{visit.symptoms.substring(0, 50)}...</td>
                  <td>{visit.diagnosis}</td>
                  <td>{visit.treatment}</td>
                  <td>
                    {visit.referred ? (
                      <span className="badge badge-warning">Yes</span>
                    ) : (
                      <span className="badge badge-success">No</span>
                    )}
                  </td>
                  <td>
                    <button className="btn-icon">
                      <i className="bi-eye"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Clinic Visit</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Student *</label>
                  <select
                    value={formData.student_id}
                    onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                    className="form-input"
                    required
                  >
                    <option value="">Select Student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} - {student.admission_number}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Visit Date *</label>
                  <input
                    type="date"
                    value={formData.visit_date}
                    onChange={(e) => setFormData({...formData, visit_date: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Symptoms *</label>
                <textarea
                  value={formData.symptoms}
                  onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                  className="form-input"
                  rows="3"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Diagnosis</label>
                <input
                  type="text"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Treatment Given</label>
                <textarea
                  value={formData.treatment}
                  onChange={(e) => setFormData({...formData, treatment: e.target.value})}
                  className="form-input"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.referred}
                    onChange={(e) => setFormData({...formData, referred: e.target.checked})}
                  />
                  Referred to External Facility
                </label>
              </div>

              {formData.referred && (
                <div className="form-group">
                  <label className="form-label">Referred To</label>
                  <input
                    type="text"
                    value={formData.referred_to}
                    onChange={(e) => setFormData({...formData, referred_to: e.target.value})}
                    className="form-input"
                    placeholder="Hospital/Facility name"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="form-input"
                  rows="2"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Record Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicVisitsList;