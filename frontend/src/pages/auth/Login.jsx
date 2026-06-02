// frontend/src/pages/auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberedEmail, setRememberedEmail] = useState('');

  useEffect(() => {
    // Check if already authenticated
    if (isAuthenticated) {
      navigate('/dashboard');
    }

    // Load remembered email from localStorage
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setRememberedEmail(savedEmail);
      setFormData(prev => ({ ...prev, email: savedEmail, rememberMe: true }));
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password
      });

      // Handle remember me
      if (formData.rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Call the login function from auth context
      await login(formData.email, formData.password);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        general: error.response?.data?.message || 'Invalid email or password. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setErrors({ email: 'Please enter your email address to reset password' });
      return;
    }

    try {
      await authAPI.forgotPassword(formData.email);
      alert('Password reset instructions have been sent to your email.');
    } catch (error) {
      setErrors({
        general: error.response?.data?.message || 'Failed to send reset email. Please try again.'
      });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-card">
          {/* Logo and Title */}
          <div className="auth-header">
            <div className="auth-logo">
              <i className="bi bi-mortarboard-fill"></i>
            </div>
            <h1 className="auth-title">StudentSys</h1>
            <p className="auth-subtitle">School Management System</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {errors.general && (
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {errors.general}
              </div>
            )}

            <div className="form-group">
              <label className="form-label required">Email Address</label>
              <div className="input-group">
                <span className="input-group-icon">
                  <i className="bi bi-envelope-fill"></i>
                </span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="admin@studentsys.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label className="form-label required">Password</label>
              <div className="input-group">
                <span className="input-group-icon">
                  <i className="bi bi-lock-fill"></i>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-group-icon password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bi bi-${showPassword ? 'eye-slash-fill' : 'eye-fill'}`}></i>
                </button>
              </div>
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>

            <div className="form-group auth-options">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <span className="form-checkbox-label">Remember me</span>
              </label>
              <button
                type="button"
                className="auth-link"
                onClick={handleForgotPassword}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-sm"></span>
                  Signing in...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="auth-demo">
            <p className="auth-demo-title">Demo Credentials</p>
            <div className="auth-demo-grid">
              <div className="auth-demo-item">
                <i className="bi bi-person-badge"></i>
                <div>
                  <div>Admin</div>
                  <small>admin@studentsys.com</small>
                </div>
              </div>
              <div className="auth-demo-item">
                <i className="bi bi-person"></i>
                <div>
                  <div>Staff</div>
                  <small>staff@studentsys.com</small>
                </div>
              </div>
            </div>
            <p className="auth-demo-note">Password: <strong>password123</strong></p>
          </div>

          {/* Footer */}
          <div className="auth-footer">
            <p>&copy; 2024 StudentSys. All rights reserved.</p>
            <p>Developed by Steve Ongera</p>
          </div>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="auth-bg-decoration">
        <div className="auth-bg-circle auth-bg-circle-1"></div>
        <div className="auth-bg-circle auth-bg-circle-2"></div>
        <div className="auth-bg-circle auth-bg-circle-3"></div>
      </div>
    </div>
  );
};

export default Login;