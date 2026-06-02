// frontend/src/components/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ isOpen }) => {
  const [openMenus, setOpenMenus] = useState({});

  const toggleSubmenu = (menuName) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: 'bi-speedometer2',
      path: '/dashboard',
      submenu: null
    },
    {
      title: 'Library',
      icon: 'bi-book',
      path: '/library',
      submenu: [
        { title: 'Books', path: '/library/books', icon: 'bi-journal-bookmark-fill' },
        { title: 'Borrowing', path: '/library/borrowing', icon: 'bi-arrow-left-right' },
        { title: 'Returns', path: '/library/returns', icon: 'bi-arrow-return-left' },
        { title: 'Fines', path: '/library/fines', icon: 'bi-exclamation-triangle' }
      ]
    },
    {
      title: 'Human Resources',
      icon: 'bi-people',
      path: '/hr',
      submenu: [
        { title: 'Employees', path: '/hr/employees', icon: 'bi-person-badge' },
        { title: 'Payroll', path: '/hr/payroll', icon: 'bi-calculator' },
        { title: 'Leave Management', path: '/hr/leave', icon: 'bi-calendar-check' },
        { title: 'Performance Reviews', path: '/hr/performance', icon: 'bi-star' }
      ]
    },
    {
      title: 'Procurement',
      icon: 'bi-cart',
      path: '/procurement',
      submenu: [
        { title: 'Requisitions', path: '/procurement/requisitions', icon: 'bi-file-text' },
        { title: 'Suppliers', path: '/procurement/suppliers', icon: 'bi-truck' },
        { title: 'Purchase Orders', path: '/procurement/orders', icon: 'bi-receipt' },
        { title: 'Approvals', path: '/procurement/approvals', icon: 'bi-check-circle' }
      ]
    },
    {
      title: 'Inventory',
      icon: 'bi-box-seam',
      path: '/inventory',
      submenu: [
        { title: 'Stock Items', path: '/inventory/items', icon: 'bi-cubes' },
        { title: 'Stock In', path: '/inventory/stock-in', icon: 'bi-arrow-down-circle' },
        { title: 'Stock Out', path: '/inventory/stock-out', icon: 'bi-arrow-up-circle' },
        { title: 'Inventory Reports', path: '/inventory/reports', icon: 'bi-file-bar-graph' }
      ]
    },
    {
      title: 'Health Center',
      icon: 'bi-hospital',
      path: '/health',
      submenu: [
        { title: 'Medical Records', path: '/health/records', icon: 'bi-file-medical' },
        { title: 'Clinic Visits', path: '/health/visits', icon: 'bi-activity' },
        { title: 'Emergency Contacts', path: '/health/emergency', icon: 'bi-telephone-plus' }
      ]
    },
    {
      title: 'Transport',
      icon: 'bi-bus-front',
      path: '/transport',
      submenu: [
        { title: 'Vehicles', path: '/transport/vehicles', icon: 'bi-truck' },
        { title: 'Routes', path: '/transport/routes', icon: 'bi-map' },
        { title: 'Students', path: '/transport/students', icon: 'bi-person-walking' },
        { title: 'GPS Tracking', path: '/transport/gps', icon: 'bi-geo-alt' }
      ]
    },
    {
      title: 'Assets',
      icon: 'bi-building',
      path: '/assets',
      submenu: [
        { title: 'Asset Register', path: '/assets/register', icon: 'bi-clipboard-data' },
        { title: 'Maintenance', path: '/assets/maintenance', icon: 'bi-tools' },
        { title: 'Depreciation', path: '/assets/depreciation', icon: 'bi-graph-down' },
        { title: 'Asset Reports', path: '/assets/reports', icon: 'bi-file-text' }
      ]
    }
  ];

  return (
    <div className={`sidebar ${!isOpen ? 'closed' : ''}`}>
      <div className="sidebar-header">
        <h3>
          <i className="bi bi-mortarboard me-2"></i>
          StudentSys
        </h3>
      </div>
      <div className="sidebar-nav">
        {menuItems.map((item, index) => (
          <div key={index} className="nav-section">
            {item.submenu ? (
              <>
                <div 
                  className="nav-item" 
                  onClick={() => toggleSubmenu(item.title)}
                >
                  <i className={`${item.icon} nav-icon`}></i>
                  <span>{item.title}</span>
                  <i className={`bi bi-chevron-${openMenus[item.title] ? 'down' : 'right'} submenu-toggle`}></i>
                </div>
                {openMenus[item.title] && (
                  <div className="submenu">
                    {item.submenu.map((subItem, subIndex) => (
                      <NavLink 
                        key={subIndex} 
                        to={subItem.path} 
                        className="nav-item"
                      >
                        <i className={`${subItem.icon} nav-icon`}></i>
                        <span>{subItem.title}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink to={item.path} className="nav-item">
                <i className={`${item.icon} nav-icon`}></i>
                <span>{item.title}</span>
              </NavLink>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;