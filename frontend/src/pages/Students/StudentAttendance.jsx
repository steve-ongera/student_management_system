// frontend/src/pages/Students/StudentAttendance.jsx
import React, { useState, useEffect } from 'react';
import { studentsAPI } from '../../services/api';

const StudentAttendance = () => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');

  const classes = ['Form 1A', 'Form 1B', 'Form 2A', 'Form 2B', 'Form 3A', 'Form 3B', 'Form 4A', 'Form 4B'];

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await studentsAPI.getStudents({ class: selectedClass, limit: 100 });
      setStudents(response.data.students);
      
      // Initialize attendance object
      const initialAttendance = {};
      response.data.students.forEach(student => {
        initialAttendance[student.id] = 'present';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const promises = Object.entries(attendance).map(([studentId, status]) => {
        return studentsAPI.markAttendance(studentId, {
          date: selectedDate,
          status,
          remarks: ''
        });
      });
      
      await Promise.all(promises);
      alert('Attendance saved successfully!');
    } catch (error) {
      console.error('Failed to save attendance:', error);
      alert('Failed to save attendance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusSummary = () => {
    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0
    };
    
    Object.values(attendance).forEach(status => {
      summary[status]++;
    });
    
    return summary;
  };

  const summary = getStatusSummary();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Student Attendance</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="filters-bar">
          <div className="form-group">
            <label className="form-label">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="form-input"
              required
            >
              <option value="">Choose a class...</option>
              {classes.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-input"
              required
            />
          </div>
        </div>

        {selectedClass && (
          <>
            {/* Attendance Summary */}
            <div className="stats-row">
              <div className="stat-mini-card">
                <div className="stat-value">{summary.present}</div>
                <div className="stat-label">Present</div>
              </div>
              <div className="stat-mini-card">
                <div className="stat-value">{summary.absent}</div>
                <div className="stat-label">Absent</div>
              </div>
              <div className="stat-mini-card">
                <div className="stat-value">{summary.late}</div>
                <div className="stat-label">Late</div>
              </div>
              <div className="stat-mini-card">
                <div className="stat-value">{summary.excused}</div>
                <div className="stat-label">Excused</div>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">Loading students...</div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Admission No</th>
                      <th>Student Name</th>
                      <th>Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td>{student.admission_number}</td>
                        <td>{student.name}</td>
                        <td>
                          <div className="attendance-buttons">
                            <button
                              type="button"
                              className={`btn btn-sm ${attendance[student.id] === 'present' ? 'btn-success' : 'btn-outline-success'}`}
                              onClick={() => handleAttendanceChange(student.id, 'present')}
                            >
                              <i className="bi bi-check-circle"></i> Present
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm ${attendance[student.id] === 'absent' ? 'btn-danger' : 'btn-outline-danger'}`}
                              onClick={() => handleAttendanceChange(student.id, 'absent')}
                            >
                              <i className="bi bi-x-circle"></i> Absent
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm ${attendance[student.id] === 'late' ? 'btn-warning' : 'btn-outline-warning'}`}
                              onClick={() => handleAttendanceChange(student.id, 'late')}
                            >
                              <i className="bi bi-clock"></i> Late
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm ${attendance[student.id] === 'excused' ? 'btn-info' : 'btn-outline-info'}`}
                              onClick={() => handleAttendanceChange(student.id, 'excused')}
                            >
                              <i className="bi bi-envelope"></i> Excused
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default StudentAttendance;