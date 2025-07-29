import React from 'react';
import './ItemCard.css';

const ItemCard = ({ item, onDelete }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="item-card">
      <div className="item-header">
        <h3>{item.name}</h3>
        <span className="item-category">{item.category}</span>
      </div>
      
      <p className="item-description">{item.description}</p>
      
      <div className="item-meta">
        <small>ID: {item.id}</small>
        <small>Created: {formatDate(item.createdAt)}</small>
      </div>
      
      <div className="item-actions">
        <button 
          className="btn btn-danger"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default ItemCard;