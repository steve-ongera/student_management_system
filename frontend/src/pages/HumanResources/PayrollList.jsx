// frontend/src/pages/HumanResources/PayrollList.jsx
import React, { useState, useEffect } from 'react';
import { hrAPI } from '../../services/api';

const PayrollList = () => {
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [summary, setSummary] = useState({
    totalGross: 0,
    totalDeductions: 0,
    totalNet: 0,
    employeeCount: 0
  });

  useEffect(() => {
    fetchPayroll();
  }, [selectedMonth]);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const response = await hrAPI.getPayroll({ month: selectedMonth });
      setPayroll(response.data);
      calculateSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch payroll:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data) => {
    const summaryData = data.reduce((acc, curr) => {
      acc.totalGross += curr.basic_salary + curr.allowances;
      acc.totalDeductions += curr.deductions;
      acc.totalNet += curr.net_pay;
      return acc;
    }, { totalGross: 0, totalDeductions: 0, totalNet: 0, employeeCount: data.length });
    setSummary(summaryData);
  };

  const handleGeneratePayroll = async () => {
    try {
      await hrAPI.generatePayroll({ month: selectedMonth });
      fetchPayroll();
      setShowGenerateModal(false);
    } catch (error) {
      console.error('Failed to generate payroll:', error);
    }
  };

  const handleProcessPayment = async (id) => {
    if (window.confirm('Process payment for this employee?')) {
      try {
        await hrAPI.processPayroll(id);
        fetchPayroll();
      } catch (error) {
        console.error('Failed to process payment:', error);
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Payroll Management</h1>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowGenerateModal(true)}>
            <i className="bi-plus-circle me-1"></i>
            Generate Payroll
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-row">
        <div className="stat-mini-card">
          <div className="stat-label">Total Gross Salary</div>
          <div className="stat-value">KES {summary.totalGross.toLocaleString()}</div>
        </div>
        <div className="stat-mini-card">
          <div className="stat-label">Total Deductions</div>
          <div className="stat-value">KES {summary.totalDeductions.toLocaleString()}</div>
        </div>
        <div className="stat-mini-card">
          <div className="stat-label">Total Net Pay</div>
          <div className="stat-value">KES {summary.totalNet.toLocaleString()}</div>
        </div>
        <div className="stat-mini-card">
          <div className="stat-label">Employees</div>
          <div className="stat-value">{summary.employeeCount}</div>
        </div>
      </div>

      <div className="filters-bar">
        <div className="form-group">
          <label className="form-label">Payroll Month</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading payroll data...</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Position</th>
                <th>Basic Salary</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net Pay</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payroll.map((record) => (
                <tr key={record.id}>
                  <td>{record.employee_name}</td>
                  <td>{record.position}</td>
                  <td>KES {record.basic_salary.toLocaleString()}</td>
                  <td>KES {record.allowances.toLocaleString()}</td>
                  <td>KES {record.deductions.toLocaleString()}</td>
                  <td className="text-primary">KES {record.net_pay.toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${record.status === 'paid' ? 'success' : 'warning'}`}>
                      {record.status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    {record.status === 'pending' && (
                      <button 
                        className="btn-icon btn-icon-success"
                        onClick={() => handleProcessPayment(record.id)}
                      >
                        <i className="bi-credit-card"></i>
                      </button>
                    )}
                    <button className="btn-icon">
                      <i className="bi-download"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showGenerateModal && (
        <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Generate Payroll</h3>
              <button className="modal-close" onClick={() => setShowGenerateModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Generate payroll for {new Date(selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}?</p>
              <p className="text-warning">This will create payroll records for all active employees.</p>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowGenerateModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleGeneratePayroll}>Generate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollList;