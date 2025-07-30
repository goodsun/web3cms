import React, { useState, useEffect } from 'react';
import './FolderForm.css';

const FolderForm = ({ folder, folders, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    status: 'public',
  });

  useEffect(() => {
    if (folder) {
      setFormData({
        name: folder.name || '',
        status: folder.status || 'public',
      });
    }
  }, [folder]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form className="folder-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">フォルダ名 *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="フォルダ名を入力"
        />
      </div>

      <div className="form-group">
        <label htmlFor="status">ステータス</label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
        >
          <option value="public">公開</option>
          <option value="limited">限定公開</option>
          <option value="hidden">非公開</option>
        </select>
      </div>


      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {folder ? '更新' : '作成'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          キャンセル
        </button>
      </div>
    </form>
  );
};

export default FolderForm;