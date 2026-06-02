// frontend/src/pages/Dashboard.jsx
import React from 'react';

const Dashboard = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">System overview and statistics</p>
      </div>
      <div className="grid">
        <div className="card">
          <div className="card-title">Total Students</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>1,234</div>
        </div>
        <div className="card">
          <div className="card-title">Active Borrowings</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>45</div>
        </div>
        <div className="card">
          <div className="card-title">Pending Approvals</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>12</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;