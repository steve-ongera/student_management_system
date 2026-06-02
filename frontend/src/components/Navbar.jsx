// frontend/src/components/Navbar.jsx
import React, { useState } from 'react';

const Navbar = ({ toggleSidebar, currentPage }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <i className="bi bi-list"></i>
        </button>
        <div className="navbar-title">{currentPage || 'Dashboard'}</div>
      </div>
      <div className="navbar-right">
        <button className="btn-icon">
          <i className="bi bi-bell"></i>
        </button>
        <button className="btn-icon">
          <i className="bi bi-envelope"></i>
        </button>
        <div className="navbar-user" onClick={() => setShowUserMenu(!showUserMenu)}>
          <div className="user-avatar">
            <i className="bi bi-person"></i>
          </div>
          <div>
            <div className="user-name">Steve Ongera</div>
            <div className="user-role">Administrator</div>
          </div>
          <i className="bi bi-chevron-down"></i>
        </div>
        {showUserMenu && (
          <div className="user-menu">
            <a href="/profile">
              <i className="bi bi-person"></i> Profile
            </a>
            <a href="/settings">
              <i className="bi bi-gear"></i> Settings
            </a>
            <hr />
            <a href="/logout">
              <i className="bi bi-box-arrow-right"></i> Logout
            </a>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;