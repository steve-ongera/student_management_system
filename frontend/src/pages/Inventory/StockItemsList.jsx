// frontend/src/pages/Inventory/StockItemsList.jsx
import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../../services/api';

const StockItemsList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockItems, setLowStockItems] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sku: '',
    quantity: 0,
    unit: 'pcs',
    unit_price: 0,
    reorder_level: 0,
    description: '',
    location: ''
  });

  useEffect(() => {
    fetchItems();
    fetchCategories();
    fetchLowStockItems();
  }, [selectedCategory]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = selectedCategory ? { category: selectedCategory } : {};
      const response = await inventoryAPI.getStockItems(params);
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch stock items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await inventoryAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchLowStockItems = async () => {
    try {
      const response = await inventoryAPI.getLowStockItems();
      setLowStockItems(response.data);
    } catch (error) {
      console.error('Failed to fetch low stock items:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await inventoryAPI.updateStockItem(editingItem.id, formData);
      } else {
        await inventoryAPI.createStockItem(formData);
      }
      setShowForm(false);
      setEditingItem(null);
      fetchItems();
      setFormData({
        name: '',
        category: '',
        sku: '',
        quantity: 0,
        unit: 'pcs',
        unit_price: 0,
        reorder_level: 0,
        description: '',
        location: ''
      });
    } catch (error) {
      console.error('Failed to save stock item:', error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await inventoryAPI.deleteStockItem(id);
        fetchItems();
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    }
  };

  const isLowStock = (item) => {
    return item.quantity <= item.reorder_level;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Stock Inventory</h1>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <i className="bi-plus-circle me-1"></i>
            Add Stock Item
          </button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="alert alert-warning">
          <i className="bi-exclamation-triangle me-2"></i>
          <strong>Low Stock Alert!</strong> {lowStockItems.length} items are below reorder level.
          <button className="alert-close">&times;</button>
        </div>
      )}

      <div className="filters-bar">
        <div className="search-box">
          <i className="bi-search"></i>
          <input type="text" placeholder="Search items..." className="form-input" />
        </div>
        <select 
          className="form-input" 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-state">Loading inventory...</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Unit Price</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className={isLowStock(item) ? 'low-stock-row' : ''}>
                  <td>{item.sku}</td>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.category}</td>
                  <td className={isLowStock(item) ? 'text-danger' : ''}>
                    {item.quantity.toLocaleString()}
                  </td>
                  <td>{item.unit}</td>
                  <td>KES {item.unit_price.toLocaleString()}</td>
                  <td>KES {(item.quantity * item.unit_price).toLocaleString()}</td>
                  <td>
                    {isLowStock(item) ? (
                      <span className="badge badge-danger">Low Stock</span>
                    ) : (
                      <span className="badge badge-success">In Stock</span>
                    )}
                  </td>
                  <td>
                    <button className="btn-icon" onClick={() => handleEdit(item)}>
                      <i className="bi-pencil"></i>
                    </button>
                    <button className="btn-icon" onClick={() => handleDelete(item.id)}>
                      <i className="bi-trash"></i>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Stock Item' : 'Add Stock Item'}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Item Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="form-input"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                    className="form-input"
                    required
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    className="form-input"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="liters">Liters (L)</option>
                    <option value="boxes">Boxes</option>
                    <option value="packs">Packs</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Unit Price (KES) *</label>
                  <input
                    type="number"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({...formData, unit_price: parseFloat(e.target.value)})}
                    className="form-input"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reorder Level</label>
                  <input
                    type="number"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({...formData, reorder_level: parseInt(e.target.value)})}
                    className="form-input"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="form-input"
                  placeholder="Warehouse/Shelf location"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="form-input"
                  rows="3"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Update' : 'Create'} Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockItemsList;