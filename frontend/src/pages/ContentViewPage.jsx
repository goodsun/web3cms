import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';
import api from '../services/api';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import './ContentViewPage.css';

const ContentViewPage = () => {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [folder, setFolder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

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
          <SimpleMDE
            value={editedContent}
            onChange={setEditedContent}
            options={{
              spellChecker: false,
              placeholder: "コンテンツを編集",
              status: false,
              toolbar: [
                "bold", "italic", "heading", "|",
                "quote", "unordered-list", "ordered-list", "|",
                "link", "image", "|",
                "preview", "side-by-side", "fullscreen"
              ],
              previewRender: (plainText) => {
                const div = document.createElement('div');
                const root = require('react-dom/client').createRoot(div);
                root.render(
                  React.createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, plainText)
                );
                return div.innerHTML;
              }
            }}
          />
          <div className="editor-actions">
            <button onClick={handleSave} className="save-button">保存</button>
            <button onClick={() => {
              setIsEditing(false);
              setEditedContent(content.content || content.data || '');
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
          <Link to="/columns">Columns</Link>
          {folder && (
            <>
              <span className="separator">/</span>
              <Link to={`/columns/folder/${folder.id}`}>{folder.name}</Link>
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