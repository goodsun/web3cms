import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ItemCard from '../components/ItemCard';
import ItemForm from '../components/ItemForm';
import './HomePage.css';

const HomePage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getItems();
      setItems(response.items || []);
    } catch (err) {
      console.error('Failed to load items:', err);
      setError('Failed to load items. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (itemData) => {
    try {
      await api.createItem(itemData);
      await loadItems();
      setShowForm(false);
    } catch (err) {
      console.error('Failed to create item:', err);
      throw new Error('Failed to create item. Please try again.');
    }
  };

  const handleUpdate = async (itemData) => {
    try {
      await api.updateItem(editingItem.id, itemData);
      await loadItems();
      setEditingItem(null);
      setShowForm(false);
    } catch (err) {
      console.error('Failed to update item:', err);
      throw new Error('Failed to update item. Please try again.');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await api.deleteItem(id);
      await loadItems();
    } catch (err) {
      console.error('Failed to delete item:', err);
      setError('Failed to delete item. Please try again.');
    }
  };

  return (
    <div className="home-page">
      <div className="page-header">
        <h1>Items</h1>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              setEditingItem(null);
            }
          }}
        >
          {showForm ? 'Cancel' : 'Add New Item'}
        </button>
      </div>

      {showForm && (
        <ItemForm 
          item={editingItem}
          onSubmit={editingItem ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading items...</p>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="empty-state">
          <p>No items found. Create your first item!</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="items-grid">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;