import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ContentForm from './ContentForm';
import './ContentManagement.css';

const ContentManagement = () => {
  const [contents, setContents] = useState([]);
  const [folders, setFolders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingContent, setEditingContent] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [contentsResponse, foldersResponse] = await Promise.all([
        api.getContents(),
        api.getFolders()
      ]);
      // コンテンツを優先度でソート（降順）、同じ優先度の場合はタイトルでソート
      const sortedContents = (contentsResponse.contents || []).sort((a, b) => {
        if (b.priority !== a.priority) {
          return (b.priority || 0) - (a.priority || 0);
        }
        return a.title.localeCompare(b.title);
      });
      setContents(sortedContents);
      setFolders(foldersResponse.folders || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data) => {
    try {
      await api.createContent(data);
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error('Error creating content:', err);
      alert('コンテンツの作成に失敗しました');
    }
  };

  const handleUpdate = async (data) => {
    try {
      await api.updateContent(editingContent.id, data);
      setEditingContent(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error('Error updating content:', err);
      alert('コンテンツの更新に失敗しました');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('このコンテンツを削除してもよろしいですか？')) {
      return;
    }

    try {
      await api.deleteContent(id);
      fetchData();
    } catch (err) {
      console.error('Error deleting content:', err);
      alert('コンテンツの削除に失敗しました');
    }
  };

  const handleEdit = (content) => {
    setEditingContent(content);
    setShowForm(true);
  };

  const handleCancel = () => {
    setEditingContent(null);
    setShowForm(false);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft': return '下書き';
      case 'review': return 'レビュー中';
      case 'standby': return '待機中';
      case 'published': return '公開';
      default: return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'draft': return 'status-draft';
      case 'review': return 'status-review';
      case 'standby': return 'status-standby';
      case 'published': return 'status-published';
      default: return '';
    }
  };

  // 優先度を変更
  const handlePriorityChange = async (content, direction) => {
    const currentPriority = content.priority || 0;
    const newPriority = direction === 'up' ? currentPriority + 10 : Math.max(0, currentPriority - 10);

    try {
      await api.updateContent(content.id, {
        ...content,
        priority: newPriority
      });
      fetchData();
    } catch (err) {
      console.error('Error updating content priority:', err);
      alert('優先度の更新に失敗しました');
    }
  };

  if (isLoading) {
    return <div className="loading">読み込み中...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="content-management">
      <div className="management-header">
        <h2>コンテンツ管理</h2>
        {!showForm && (
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            新規コンテンツ作成
          </button>
        )}
      </div>

      {showForm && (
        <ContentForm
          content={editingContent}
          folders={folders}
          onSubmit={editingContent ? handleUpdate : handleCreate}
          onCancel={handleCancel}
        />
      )}

      {!showForm && (
        <div className="contents-table">
          {contents.length === 0 ? (
            <p className="empty-state">コンテンツがありません</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>タイトル</th>
                  <th>フォルダ</th>
                  <th>ステータス</th>
                  <th>優先度</th>
                  <th>更新日時</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {contents.map((content, index) => {
                  const folder = folders.find(f => f.id === content.folderId);
                  return (
                    <tr key={content.id}>
                      <td className="content-title">{content.title}</td>
                      <td>{folder?.name || '不明'}</td>
                      <td>
                        <span className={`status ${getStatusClass(content.status)}`}>
                          {getStatusLabel(content.status)}
                        </span>
                      </td>
                      <td>
                        <div className="priority-cell">
                          <span>{content.priority || 0}</span>
                          <div className="priority-controls">
                            <button
                              className="btn-icon-small"
                              onClick={() => handlePriorityChange(content, 'up')}
                              disabled={index === 0}
                              title="優先度を上げる"
                            >
                              ⬆️
                            </button>
                            <button
                              className="btn-icon-small"
                              onClick={() => handlePriorityChange(content, 'down')}
                              disabled={index === contents.length - 1}
                              title="優先度を下げる"
                            >
                              ⬇️
                            </button>
                          </div>
                        </div>
                      </td>
                      <td>{new Date(content.updatedAt).toLocaleString('ja-JP')}</td>
                      <td>
                        <div className="content-actions">
                          <button
                            className="btn-icon"
                            onClick={() => handleEdit(content)}
                            title="編集"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon btn-danger"
                            onClick={() => handleDelete(content.id)}
                            title="削除"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default ContentManagement;