// frontend/src/components/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ isOpen }) => {
  const [openMenus, setOpenMenus] = useState({
    library: false,
    hr: false,
    procurement: false,
    inventory: false,
    health: false,
    transport: false,
    assets: false
  });

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
      key: 'dashboard'
    },
    {
      title: 'Library',
      icon: 'bi-book',
      key: 'library',
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
      key: 'hr',
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
      key: 'procurement',
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
      key: 'inventory',
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
      key: 'health',
      submenu: [
        { title: 'Medical Records', path: '/health/records', icon: 'bi-file-medical' },
        { title: 'Clinic Visits', path: '/health/visits', icon: 'bi-activity' },
        { title: 'Emergency Contacts', path: '/health/emergency', icon: 'bi-telephone-plus' }
      ]
    },
    {
      title: 'Transport',
      icon: 'bi-bus-front',
      key: 'transport',
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
      key: 'assets',
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
        {menuItems.map((item) => (
          <div key={item.key} className="nav-section">
            {item.submenu ? (
              <>
                <div 
                  className="nav-item" 
                  onClick={() => toggleSubmenu(item.key)}
                >
                  <i className={`${item.icon} nav-icon`}></i>
                  <span>{item.title}</span>
                  <i className={`bi bi-chevron-${openMenus[item.key] ? 'down' : 'right'} submenu-toggle`}></i>
                </div>
                {openMenus[item.key] && (
                  <div className="submenu">
                    {item.submenu.map((subItem, idx) => (
                      <NavLink 
                        key={idx} 
                        to={subItem.path} 
                        className={({ isActive }) => 
                          `nav-item ${isActive ? 'active' : ''}`
                        }
                      >
                        <i className={`${subItem.icon} nav-icon`}></i>
                        <span>{subItem.title}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink 
                to={item.path} 
                className={({ isActive }) => 
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
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