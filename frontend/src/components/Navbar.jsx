// frontend/src/components/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ toggleSidebar, currentPage }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Book Added', message: 'The Great Gatsby has been added to library', time: '5 min ago', read: false },
    { id: 2, title: 'Leave Request', message: 'John Doe requested annual leave', time: '1 hour ago', read: false },
    { id: 3, title: 'Payment Received', message: 'Fee payment of KES 25,000 received', time: '2 hours ago', read: true },
    { id: 4, title: 'Maintenance Due', message: 'Vehicle KCA 001A due for service', time: '1 day ago', read: true }
  ]);
  
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markNotificationAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <i className="bi bi-list"></i>
        </button>
        <div className="navbar-title">{currentPage || 'Dashboard'}</div>
      </div>
      
      <div className="navbar-right">
        {/* Notifications Dropdown */}
        <div className="dropdown-wrapper" ref={notificationRef}>
          <button 
            className="navbar-icon" 
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <i className="bi bi-bell"></i>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
          
          {showNotifications && (
            <div className="dropdown-menu notifications-menu">
              <div className="dropdown-header">
                <h4>Notifications</h4>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="dropdown-link">
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="dropdown-list">
                {notifications.length === 0 ? (
                  <div className="dropdown-empty">
                    <i className="bi bi-bell-slash"></i>
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`dropdown-item notification-item ${!notif.read ? 'unread' : ''}`}
                      onClick={() => markNotificationAsRead(notif.id)}
                    >
                      <div className="notification-icon">
                        <i className="bi bi-info-circle"></i>
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">{notif.title}</div>
                        <div className="notification-message">{notif.message}</div>
                        <div className="notification-time">{notif.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="dropdown-footer">
                <Link to="/notifications" className="dropdown-link">
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Messages Dropdown */}
        <div className="dropdown-wrapper">
          <button className="navbar-icon">
            <i className="bi bi-envelope"></i>
          </button>
        </div>

        {/* User Menu Dropdown */}
        <div className="dropdown-wrapper" ref={userMenuRef}>
          <div className="navbar-user" onClick={() => setShowUserMenu(!showUserMenu)}>
            <div className="user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : <i className="bi bi-person"></i>}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'Steve Ongera'}</div>
              <div className="user-role">{user?.role?.replace('_', ' ') || 'Administrator'}</div>
            </div>
            <i className={`bi bi-chevron-${showUserMenu ? 'up' : 'down'}`}></i>
          </div>
          
          {showUserMenu && (
            <div className="dropdown-menu user-menu">
              <div className="dropdown-user-info">
                <div className="user-avatar-large">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div className="user-details">
                  <div className="user-fullname">{user?.name || 'Steve Ongera'}</div>
                  <div className="user-email">{user?.email || 'steve@studentsys.com'}</div>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <Link to="/profile" className="dropdown-item">
                <i className="bi bi-person"></i>
                My Profile
              </Link>
              <Link to="/settings" className="dropdown-item">
                <i className="bi bi-gear"></i>
                Settings
              </Link>
              <Link to="/change-password" className="dropdown-item">
                <i className="bi bi-lock"></i>
                Change Password
              </Link>
              <div className="dropdown-divider"></div>
              <button onClick={handleLogout} className="dropdown-item logout-item">
                <i className="bi bi-box-arrow-right"></i>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;