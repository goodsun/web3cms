import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './ContentForm.css';

const ContentForm = ({ content, folders, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'draft',
  });
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (content) {
      setFormData({
        title: content.title || '',
        content: content.content || '',
        status: content.status || 'draft',
      });
    }
  }, [content]);

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
    <form className="content-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="title">タイトル *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="コンテンツのタイトルを入力"
        />
      </div>

      <div className="form-group">
        <div className="content-editor-header">
          <label htmlFor="content">内容（Markdown形式対応）</label>
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
              {formData.content || '*プレビューする内容がありません*'}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows="15"
            placeholder="コンテンツの内容を入力&#10;&#10;## 見出し&#10;**太字** *斜体*&#10;- リスト&#10;[リンク](url)"
            className="markdown-textarea"
          />
        )}
      </div>

      <div className="form-group">
        <label htmlFor="status">ステータス</label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
        >
          <option value="draft">下書き</option>
          <option value="review">レビュー中</option>
          <option value="standby">待機中</option>
          <option value="published">公開</option>
        </select>
      </div>


      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {content ? '更新' : '作成'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          キャンセル
        </button>
      </div>
    </form>
  );
};

export default ContentForm;