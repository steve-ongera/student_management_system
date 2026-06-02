// frontend/src/pages/Unauthorized.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-card">
        {/* Animated Icon */}
        <div className="unauthorized-icon-wrapper">
          <div className="unauthorized-icon">
            <i className="bi bi-shield-exclamation"></i>
          </div>
          <div className="unauthorized-icon-pulse"></div>
        </div>

        {/* Error Code */}
        <div className="unauthorized-code">
          <span className="code-digit">4</span>
          <span className="code-digit">0</span>
          <span className="code-digit">3</span>
        </div>

        {/* Title */}
        <h1 className="unauthorized-title">Access Denied</h1>
        
        {/* Message */}
        <p className="unauthorized-message">
          You don't have permission to access this page. 
          This area is restricted to authorized personnel only.
        </p>

        {/* User Info (if logged in) */}
        {user && (
          <div className="unauthorized-user-info">
            <div className="user-info-card">
              <i className="bi bi-person-circle"></i>
              <div>
                <div className="user-info-label">Logged in as</div>
                <div className="user-info-name">{user.name}</div>
                <div className="user-info-role">{user.role?.replace('_', ' ').toUpperCase()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="unauthorized-actions">
          <Link to="/dashboard" className="btn btn-primary">
            <i className="bi bi-house-door me-2"></i>
            Go to Dashboard
          </Link>
          
          <button onClick={handleGoBack} className="btn btn-secondary">
            <i className="bi bi-arrow-left me-2"></i>
            Go Back
          </button>
          
          <button onClick={handleLogout} className="btn btn-outline-secondary">
            <i className="bi bi-box-arrow-right me-2"></i>
            Sign Out
          </button>
        </div>

        {/* Help Text */}
        <div className="unauthorized-help">
          <i className="bi bi-question-circle"></i>
          <p>
            Need access? Contact your system administrator to request 
            appropriate permissions for this resource.
          </p>
        </div>

        {/* Footer */}
        <div className="unauthorized-footer">
          <p>If you believe this is an error, please contact support</p>
          <p className="support-email">
            <i className="bi bi-envelope"></i>
            support@studentsys.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;