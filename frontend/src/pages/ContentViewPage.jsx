import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSettings } from '../contexts/SettingsContext';
import api from '../services/api';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import './ContentViewPage.css';

const ContentViewPage = () => {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [content, setContent] = useState(null);
  const [folder, setFolder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchContentData();
  }, [contentId]);

  const fetchContentData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch content using public API
      const contentResponse = await api.getPublicContent(contentId);
      if (!contentResponse.content) {
        setError('Content not found');
        setIsLoading(false);
        return;
      }

      const contentData = contentResponse.content;
      setContent(contentData);
      setEditedContent(contentData.content || contentData.data || '');

      // Fetch folder info if content has folder_id
      if (contentData.folder_id) {
        const foldersResponse = await api.getPublicFolders();
        const parentFolder = foldersResponse.folders?.find(f => f.id === contentData.folder_id);
        setFolder(parentFolder);
      }
    } catch (err) {
      console.error('Error fetching content:', err);
      setError('Failed to load content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('You need to be logged in to edit content');
        return;
      }

      const response = await api.updateContent(contentId, {
        ...content,
        content: editedContent,
        data: editedContent
      });

      setContent({
        ...content,
        content: editedContent,
        data: editedContent
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving content:', err);
      alert('Failed to save content. Please try again.');
    }
  };

  const renderContent = () => {
    if (!content) return null;
    
    if (isEditing) {
      return (
        <div className="content-editor">
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
          {showPreview ? (
            <div className="markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {editedContent || '*プレビューする内容がありません*'}
              </ReactMarkdown>
            </div>
          ) : (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="edit-textarea"
              rows="20"
              placeholder="コンテンツを編集（Markdown形式対応）"
            />
          )}
          <div className="editor-actions">
            <button onClick={handleSave} className="save-button">保存</button>
            <button onClick={() => {
              setIsEditing(false);
              setEditedContent(content.content || content.data || '');
              setShowPreview(false);
            }} className="cancel-button">キャンセル</button>
          </div>
        </div>
      );
    }
    
    // contentTypeがない場合もtextとして扱い、Markdownをレンダリング
    switch (content.contentType || content.type || 'text') {
      case 'text':
      case 'markdown':
      case 'md':
        return (
          <div className="content-body text-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content.content || content.data || ''}</ReactMarkdown>
          </div>
        );
        
      case 'html':
        return (
          <div className="content-body html-content">
            <div dangerouslySetInnerHTML={{ __html: content.content || content.data }} />
          </div>
        );

      case 'image':
        return (
          <div className="content-body image-content">
            <img src={content.content || content.data} alt={content.title} />
          </div>
        );

      case 'video':
        return (
          <div className="content-body video-content">
            <video controls>
              <source src={content.content || content.data} />
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'iframe':
        return (
          <div className="content-body iframe-content">
            <iframe
              src={content.content || content.data}
              title={content.title}
              frameBorder="0"
              allowFullScreen
            />
          </div>
        );

      case 'link':
        return (
          <div className="content-body link-content">
            <a href={content.content || content.data} target="_blank" rel="noopener noreferrer">
              {content.content || content.data}
            </a>
          </div>
        );

      default:
        // デフォルトでもMarkdownとして扱う
        return (
          <div className="content-body text-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content.content || content.data || ''}</ReactMarkdown>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="content-view-page">
        <LoadingState message="Loading content..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-view-page">
        <ErrorState message={error} onRetry={fetchContentData} />
      </div>
    );
  }

  return (
    <div className="content-view-page">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">{settings?.title || 'Web3CMS'}</Link>
          {folder && (
            <>
              <span className="separator">/</span>
              <Link to={`/folder/${folder.id}`}>{folder.name}</Link>
            </>
          )}
          <span className="separator">/</span>
          <span>{content?.title}</span>
        </div>
        <h1>{content?.title}</h1>
        {content?.description && (
          <p className="content-description">{content.description}</p>
        )}
        <div className="content-meta">
          <span className="content-type">{content?.type}</span>
          {content?.priority > 0 && (
            <span className="content-priority">Priority: {content.priority}</span>
          )}
          {content?.created_at && (
            <span className="content-date">
              Created: {new Date(content.created_at).toLocaleDateString()}
            </span>
          )}
          {localStorage.getItem('authToken') && !isEditing && (
            <button onClick={() => setIsEditing(true)} className="edit-button">
              編集
            </button>
          )}
        </div>
      </div>

      <div className="content-container">
        {renderContent()}
      </div>
    </div>
  );
};

export default ContentViewPage;