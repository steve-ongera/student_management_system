// frontend/src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import HumanResources from './pages/HumanResources';
import Procurement from './pages/Procurement';
import Inventory from './pages/Inventory';
import HealthCenter from './pages/HealthCenter';
import Transport from './pages/Transport';
import Assets from './pages/Assets';
import './styles/main.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('Dashboard');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Router>
      <div className="app-container">
        <Sidebar isOpen={sidebarOpen} />
        <div className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
          <Navbar toggleSidebar={toggleSidebar} currentPage={currentPage} />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/library/*" element={<Library />} />
            <Route path="/hr/*" element={<HumanResources />} />
            <Route path="/procurement/*" element={<Procurement />} />
            <Route path="/inventory/*" element={<Inventory />} />
            <Route path="/health/*" element={<HealthCenter />} />
            <Route path="/transport/*" element={<Transport />} />
            <Route path="/assets/*" element={<Assets />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;