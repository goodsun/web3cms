import React, { useState, useEffect, useMemo } from 'react';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';
import './ContentForm.css';

const ContentForm = ({ content, folders, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'draft',
  });

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
        <label htmlFor="content">内容</label>
        <SimpleMDE
          value={formData.content}
          onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
          options={{
            spellChecker: false,
            placeholder: "コンテンツの内容を入力（Markdown形式対応）",
            status: false,
            toolbar: [
              "bold", "italic", "heading", "|",
              "quote", "unordered-list", "ordered-list", "|",
              "link", "image", "|",
              "preview", "side-by-side", "fullscreen"
            ],
            previewRender: (plainText) => {
              const ReactMarkdown = require('react-markdown').default;
              const remarkGfm = require('remark-gfm').default;
              const div = document.createElement('div');
              const root = require('react-dom/client').createRoot(div);
              root.render(
                React.createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, plainText)
              );
              return div.innerHTML;
            }
          }}
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