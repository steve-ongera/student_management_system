// frontend/src/pages/Procurement/PurchaseOrdersList.jsx
import React, { useState, useEffect } from 'react';
import { procurementAPI } from '../../services/api';

const PurchaseOrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    items: [],
    notes: ''
  });

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await procurementAPI.getPurchaseOrders();
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await procurementAPI.getSuppliers();
      setSuppliers(response.data);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await procurementAPI.createPurchaseOrder(formData);
      setShowForm(false);
      fetchOrders();
      setFormData({
        supplier_id: '',
        order_date: new Date().toISOString().split('T')[0],
        delivery_date: '',
        items: [],
        notes: ''
      });
    } catch (error) {
      console.error('Failed to create purchase order:', error);
    }
  };

  const handleReceiveOrder = async (id) => {
    if (window.confirm('Confirm receipt of this order?')) {
      try {
        await procurementAPI.receiveOrder(id);
        fetchOrders();
      } catch (error) {
        console.error('Failed to receive order:', error);
      }
    }
  };

  const handleApprove = async (id) => {
    try {
      await procurementAPI.approvePurchaseOrder(id);
      fetchOrders();
    } catch (error) {
      console.error('Failed to approve order:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      approved: 'badge-info',
      received: 'badge-success',
      cancelled: 'badge-danger'
    };
    return badges[status] || 'badge-secondary';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Purchase Orders</h1>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <i className="bi-plus-circle me-1"></i>
            Create Order
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading purchase orders...</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Supplier</th>
                <th>Order Date</th>
                <th>Delivery Date</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.order_number}</td>
                  <td>{order.supplier_name}</td>
                  <td>{new Date(order.order_date).toLocaleDateString()}</td>
                  <td>{new Date(order.delivery_date).toLocaleDateString()}</td>
                  <td className="text-primary">KES {order.total_amount?.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    {order.status === 'pending' && (
                      <button 
                        className="btn-icon btn-icon-success"
                        onClick={() => handleApprove(order.id)}
                      >
                        <i className="bi-check-circle"></i>
                      </button>
                    )}
                    {order.status === 'approved' && (
                      <button 
                        className="btn-icon btn-icon-info"
                        onClick={() => handleReceiveOrder(order.id)}
                      >
                        <i className="bi-box-seam"></i>
                      </button>
                    )}
                    <button 
                      className="btn-icon"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <i className="bi-eye"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Purchase Order</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Supplier *</label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                  className="form-input"
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Order Date</label>
                  <input
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({...formData, order_date: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({...formData, delivery_date: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="form-input"
                  rows="3"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrdersList;