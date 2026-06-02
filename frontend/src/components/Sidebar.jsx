// frontend/src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({
    students: false,
    library: false,
    hr: false,
    procurement: false,
    inventory: false,
    health: false,
    transport: false,
    assets: false
  });

  // Auto-expand submenu based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    const newOpenMenus = { ...openMenus };
    
    // Check which submenu should be open based on current path
    if (currentPath.includes('/students')) {
      newOpenMenus.students = true;
    }
    if (currentPath.includes('/library')) {
      newOpenMenus.library = true;
    }
    if (currentPath.includes('/hr')) {
      newOpenMenus.hr = true;
    }
    if (currentPath.includes('/procurement')) {
      newOpenMenus.procurement = true;
    }
    if (currentPath.includes('/inventory')) {
      newOpenMenus.inventory = true;
    }
    if (currentPath.includes('/health')) {
      newOpenMenus.health = true;
    }
    if (currentPath.includes('/transport')) {
      newOpenMenus.transport = true;
    }
    if (currentPath.includes('/assets')) {
      newOpenMenus.assets = true;
    }
    
    setOpenMenus(newOpenMenus);
  }, [location.pathname]);

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
      title: 'Students',
      icon: 'bi-people-fill',
      key: 'students',
      submenu: [
        { title: 'All Students', path: '/students', icon: 'bi-person-vcard' },
        { title: 'Add Student', path: '/students/add', icon: 'bi-person-plus' },
        { title: 'Academic Records', path: '/students/academic-records', icon: 'bi-journal-bookmark-fill' },
        { title: 'Attendance', path: '/students/attendance', icon: 'bi-calendar-check' },
        { title: 'Fee Management', path: '/students/fees', icon: 'bi-calculator' },
        { title: 'Parents', path: '/students/parents', icon: 'bi-people' }
      ]
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
        { title: 'Student Transport', path: '/transport/students', icon: 'bi-person-walking' },
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
                  className={`nav-item ${openMenus[item.key] ? 'open' : ''}`}
                  onClick={() => toggleSubmenu(item.key)}
                >
                  <i className={`${item.icon} nav-icon`}></i>
                  <span>{item.title}</span>
                  <i className={`bi bi-chevron-${openMenus[item.key] ? 'down' : 'right'} submenu-toggle`}></i>
                </div>
                <div className={`submenu ${openMenus[item.key] ? 'open' : ''}`}>
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