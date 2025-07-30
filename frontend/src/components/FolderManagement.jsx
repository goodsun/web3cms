import React, { useState, useEffect } from 'react';
import api from '../services/api';
import FolderForm from './FolderForm';
import './FolderManagement.css';

const FolderManagement = () => {
  const [folders, setFolders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      setIsLoading(true);
      const response = await api.getFolders();
      // 優先度でソート（降順）、同じ優先度の場合は名前でソート
      const sortedFolders = (response.folders || []).sort((a, b) => {
        if (b.priority !== a.priority) {
          return (b.priority || 0) - (a.priority || 0);
        }
        return a.name.localeCompare(b.name);
      });
      setFolders(sortedFolders);
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError('フォルダの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data) => {
    try {
      await api.createFolder(data);
      setShowForm(false);
      fetchFolders();
    } catch (err) {
      console.error('Error creating folder:', err);
      alert('フォルダの作成に失敗しました');
    }
  };

  const handleUpdate = async (data) => {
    try {
      await api.updateFolder(editingFolder.id, data);
      setEditingFolder(null);
      setShowForm(false);
      fetchFolders();
    } catch (err) {
      console.error('Error updating folder:', err);
      alert('フォルダの更新に失敗しました');
    }
  };

  const handleDelete = async (id) => {
    const folder = folders.find(f => f.id === id);
    if (!folder) return;

    // 子フォルダをチェック
    const childFolders = folders.filter(f => f.parentId === id);
    
    let confirmMessage = `フォルダ「${folder.name}」を削除してもよろしいですか？`;
    
    if (childFolders.length > 0) {
      confirmMessage += `\n\n⚠️ 警告: このフォルダには${childFolders.length}個のサブフォルダが含まれています。\n現在、フォルダに含まれるコンテンツやサブフォルダがある場合は削除できません。`;
      alert(confirmMessage);
      return;
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await api.deleteFolder(id);
      fetchFolders();
    } catch (err) {
      console.error('Error deleting folder:', err);
      if (err.response?.data?.message) {
        alert(`削除に失敗しました: ${err.response.data.message}`);
      } else {
        alert('フォルダの削除に失敗しました');
      }
    }
  };

  const handleEdit = (folder) => {
    setEditingFolder(folder);
    setShowForm(true);
  };

  const handleCancel = () => {
    setEditingFolder(null);
    setShowForm(false);
  };

  // 優先度を変更
  const handlePriorityChange = async (folder, direction) => {
    const currentPriority = folder.priority || 0;
    const newPriority = direction === 'up' ? currentPriority + 10 : Math.max(0, currentPriority - 10);

    try {
      await api.updateFolder(folder.id, {
        ...folder,
        priority: newPriority
      });
      fetchFolders();
    } catch (err) {
      console.error('Error updating folder priority:', err);
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
    <div className="folder-management">
      <div className="management-header">
        <h2>フォルダ管理</h2>
        {!showForm && (
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            新規フォルダ作成
          </button>
        )}
      </div>

      {showForm && (
        <FolderForm
          folder={editingFolder}
          folders={folders}
          onSubmit={editingFolder ? handleUpdate : handleCreate}
          onCancel={handleCancel}
        />
      )}

      {!showForm && (
        <div className="folders-grid">
          {folders.length === 0 ? (
            <p className="empty-state">フォルダがありません</p>
          ) : (
            folders.map((folder, index) => {
              const parentFolder = folder.parentId ? folders.find(f => f.id === folder.parentId) : null;
              return (
                <div 
                  key={folder.id} 
                  className="folder-card"
                >
                  <h3>{folder.name}</h3>
                  {parentFolder && (
                    <div className="parent-info">
                      親フォルダ: {parentFolder.name}
                    </div>
                  )}
                  <div className="folder-meta">
                    <span className={`status status-${folder.status}`}>
                      {folder.status === 'public' ? '公開' :
                       folder.status === 'limited' ? '限定公開' : '非公開'}
                    </span>
                    <span className="priority">優先度: {folder.priority || 0}</span>
                  </div>
                  <div className="folder-actions">
                    <div className="priority-controls">
                      <button
                        className="btn-icon"
                        onClick={() => handlePriorityChange(folder, 'up')}
                        disabled={index === 0}
                        title="優先度を上げる"
                      >
                        ⬆️
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handlePriorityChange(folder, 'down')}
                        disabled={index === folders.length - 1}
                        title="優先度を下げる"
                      >
                        ⬇️
                      </button>
                    </div>
                    <button
                      className="btn-icon"
                      onClick={() => handleEdit(folder)}
                      title="編集"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon btn-danger"
                      onClick={() => handleDelete(folder.id)}
                      title="削除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default FolderManagement;