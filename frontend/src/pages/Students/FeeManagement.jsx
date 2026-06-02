// frontend/src/pages/Students/FeeManagement.jsx
import React, { useState, useEffect } from 'react';
import { studentsAPI } from '../../services/api';

const FeeManagement = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [feeRecords, setFeeRecords] = useState([]);
  const [balance, setBalance] = useState({ total_fees: 0, total_paid: 0, total_balance: 0 });
  const [loading, setLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method: 'mpesa',
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchFeeRecords();
      fetchBalance();
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

  const fetchFeeRecords = async () => {
    setLoading(true);
    try {
      const response = await studentsAPI.getFeeRecords(selectedStudent);
      setFeeRecords(response.data);
    } catch (error) {
      console.error('Failed to fetch fee records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await studentsAPI.getFeeBalance(selectedStudent);
      setBalance(response.data);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await studentsAPI.payFees(selectedStudent, {
        amount: parseFloat(paymentData.amount),
        payment_method: paymentData.payment_method,
        reference_number: paymentData.reference_number,
        notes: paymentData.notes
      });
      setShowPaymentForm(false);
      fetchFeeRecords();
      fetchBalance();
      setPaymentData({
        amount: '',
        payment_method: 'mpesa',
        reference_number: '',
        notes: ''
      });
      alert('Payment recorded successfully!');
    } catch (error) {
      console.error('Failed to process payment:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (record) => {
    if (record.balance === 0) return 'badge-success';
    if (new Date(record.due_date) < new Date()) return 'badge-danger';
    return 'badge-warning';
  };

  const getStatusText = (record) => {
    if (record.balance === 0) return 'Paid';
    if (new Date(record.due_date) < new Date()) return 'Overdue';
    return 'Pending';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Fee Management</h1>
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
            onClick={() => setShowPaymentForm(true)}
            disabled={!selectedStudent}
          >
            <i className="bi bi-credit-card me-1"></i>
            Record Payment
          </button>
        </div>
      </div>

      {selectedStudent && (
        <>
          {/* Fee Summary */}
          <div className="stats-row">
            <div className="stat-mini-card">
              <div className="stat-value">KES {balance.total_fees?.toLocaleString() || 0}</div>
              <div className="stat-label">Total Fees</div>
            </div>
            <div className="stat-mini-card">
              <div className="stat-value text-success">KES {balance.total_paid?.toLocaleString() || 0}</div>
              <div className="stat-label">Total Paid</div>
            </div>
            <div className="stat-mini-card">
              <div className="stat-value text-danger">KES {balance.total_balance?.toLocaleString() || 0}</div>
              <div className="stat-label">Balance</div>
            </div>
          </div>

          {/* Fee Records Table */}
          {loading ? (
            <div className="loading-state">Loading fee records...</div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Term</th>
                    <th>Year</th>
                    <th>Amount (KES)</th>
                    <th>Paid (KES)</th>
                    <th>Balance (KES)</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {feeRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{record.term}</td>
                      <td>{record.year}</td>
                      <td>{record.amount?.toLocaleString()}</td>
                      <td>{record.paid?.toLocaleString()}</td>
                      <td className="text-danger">{record.balance?.toLocaleString()}</td>
                      <td>{new Date(record.due_date).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(record)}`}>
                          {getStatusText(record)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Payment Modal */}
      {showPaymentForm && (
        <div className="modal-overlay" onClick={() => setShowPaymentForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Fee Payment</h3>
              <button className="modal-close" onClick={() => setShowPaymentForm(false)}>&times;</button>
            </div>
            <form onSubmit={handlePayment}>
              <div className="form-group">
                <label className="form-label">Amount (KES)</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                  className="form-input"
                  required
                  min="1"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  value={paymentData.payment_method}
                  onChange={(e) => setPaymentData({...paymentData, payment_method: e.target.value})}
                  className="form-input"
                  required
                >
                  <option value="mpesa">M-Pesa</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Reference Number</label>
                <input
                  type="text"
                  value={paymentData.reference_number}
                  onChange={(e) => setPaymentData({...paymentData, reference_number: e.target.value})}
                  className="form-input"
                  placeholder="M-Pesa transaction ID or cheque number"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                  className="form-input"
                  rows="3"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowPaymentForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Processing...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeManagement;