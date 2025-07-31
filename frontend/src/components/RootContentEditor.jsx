import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './RootContentEditor.css';

const RootContentEditor = ({ initialContent, onSubmit, onCancel }) => {
  const [content, setContent] = useState(initialContent || '');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setContent(initialContent || '');
  }, [initialContent]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(content);
  };

  return (
    <form className="root-content-editor" onSubmit={handleSubmit}>
      <div className="form-group">
        <div className="content-editor-header">
          <label htmlFor="content">トップページコンテンツ（Markdown形式対応）</label>
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
              {content || '*プレビューする内容がありません*'}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            id="content"
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="15"
            placeholder="トップページに表示するコンテンツを入力&#10;&#10;# Welcome to Web3CMS&#10;&#10;ここにサイトの説明を記載..."
            className="markdown-textarea"
          />
        )}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          保存
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          キャンセル
        </button>
      </div>
    </form>
  );
};

export default RootContentEditor;