// frontend/src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalBooks: 0,
    totalEmployees: 0,
    pendingApprovals: 0,
    activeBorrowings: 0,
    vehiclesInUse: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, activitiesRes, chartsRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivities(10),
        dashboardAPI.getCharts()
      ]);
      
      setStats(statsRes.data);
      setRecentActivities(activitiesRes.data);
      setChartData(chartsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Students', value: stats.totalStudents, icon: 'bi-people', color: '#1e3a8a' },
    { title: 'Library Books', value: stats.totalBooks, icon: 'bi-book', color: '#3b82f6' },
    { title: 'Employees', value: stats.totalEmployees, icon: 'bi-person-badge', color: '#10b981' },
    { title: 'Pending Approvals', value: stats.pendingApprovals, icon: 'bi-clock-history', color: '#f59e0b' },
    { title: 'Active Borrowings', value: stats.activeBorrowings, icon: 'bi-arrow-left-right', color: '#8b5cf6' },
    { title: 'Vehicles in Use', value: stats.vehiclesInUse, icon: 'bi-bus-front', color: '#ec489a' }
  ];

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Welcome back, Steve! Here's what's happening today.</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-card-icon" style={{ backgroundColor: stat.color }}>
              <i className={stat.icon}></i>
            </div>
            <div className="stat-card-content">
              <div className="stat-card-value">{stat.value.toLocaleString()}</div>
              <div className="stat-card-title">{stat.title}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Recent Activities */}
        <div className="card">
          <div className="card-title">
            <i className="bi-activity me-2"></i>
            Recent Activities
          </div>
          <div className="activity-list">
            {recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  <i className={`bi-${activity.icon}`}></i>
                </div>
                <div className="activity-content">
                  <div className="activity-description">{activity.description}</div>
                  <div className="activity-time">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-title">
            <i className="bi-lightning me-2"></i>
            Quick Actions
          </div>
          <div className="quick-actions-grid">
            <button className="quick-action-btn">
              <i className="bi-plus-circle"></i>
              Add Student
            </button>
            <button className="quick-action-btn">
              <i className="bi-book"></i>
              Issue Book
            </button>
            <button className="quick-action-btn">
              <i className="bi-cart"></i>
              Create Requisition
            </button>
            <button className="quick-action-btn">
              <i className="bi-box-seam"></i>
              Add Stock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;