import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './FolderForm.css';

const FolderForm = ({ folder, folders, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    status: 'public',
    contents: '',
  });
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (folder) {
      setFormData({
        name: folder.name || '',
        status: folder.status || 'public',
        contents: folder.contents || '',
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

      <div className="form-group">
        <div className="content-editor-header">
          <label htmlFor="contents">フォルダの説明（Markdown形式対応）</label>
          <div className="editor-tabs">
            <button
              type="button"
              className={`tab-button ${!showPreview ? 'active' : ''}`}
              onClick={() => setShowPreview(false)}
            >
              編集
            </button>
            <button
              type="button"
              className={`tab-button ${showPreview ? 'active' : ''}`}
              onClick={() => setShowPreview(true)}
            >
              プレビュー
            </button>
          </div>
        </div>
        {showPreview ? (
          <div className="markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {formData.contents || '*説明がありません*'}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            id="contents"
            name="contents"
            value={formData.contents}
            onChange={handleChange}
            rows="10"
            placeholder="フォルダの説明を入力&#10;&#10;## 概要&#10;このフォルダについての説明...&#10;&#10;## 使い方&#10;- 項目1&#10;- 項目2"
            className="markdown-textarea"
          />
        )}
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