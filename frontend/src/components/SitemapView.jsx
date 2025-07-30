import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from './Modal';
import ActionModal from './ActionModal';
import FolderForm from './FolderForm';
import ContentForm from './ContentForm';
import { FolderIcon, FileIcon, FolderPlusIcon } from './Icons';
import './SitemapView.css';

const SitemapView = ({ folders, contents, onRefresh }) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [dropPosition, setDropPosition] = useState('on'); // 'before', 'on', 'after'
  const [showNewFolder, setShowNewFolder] = useState(null);
  const [showNewContent, setShowNewContent] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false, type: null, item: null });
  const [actionModalState, setActionModalState] = useState({ isOpen: false, item: null, type: null });

  // フォルダまたはコンテンツを削除
  const handleDelete = async (item, type) => {
    let confirmMessage;
    
    if (type === 'folder') {
      // フォルダ内のコンテンツ数を数える
      const folderContents = contents.filter(c => c.folderId === item.id);
      const childFolders = folders.filter(f => f.parentId === item.id);
      
      confirmMessage = `フォルダ「${item.name}」を削除してもよろしいですか？\n\n`;
      
      if (folderContents.length > 0 || childFolders.length > 0) {
        confirmMessage += '⚠️ 警告: このフォルダには以下が含まれています：\n';
        if (childFolders.length > 0) {
          confirmMessage += `・${childFolders.length}個のサブフォルダ\n`;
        }
        if (folderContents.length > 0) {
          confirmMessage += `・${folderContents.length}個のコンテンツ\n`;
        }
        confirmMessage += '\nこれらも一緒に削除されます。本当に削除しますか？';
      }
    } else {
      confirmMessage = `コンテンツ「${item.title}」を削除してもよろしいですか？`;
    }
    
    if (!confirm(confirmMessage)) return;

    try {
      if (type === 'folder') {
        // カスケード削除を使用（子要素も含めて削除）
        const hasChildren = contents.some(c => c.folderId === item.id) || folders.some(f => f.parentId === item.id);
        await api.deleteFolder(item.id, hasChildren);
      } else {
        await api.deleteContent(item.id);
      }
      onRefresh();
    } catch (err) {
      console.error('Error deleting item:', err);
      if (err.response?.data?.message) {
        alert(`削除に失敗しました: ${err.response.data.message}`);
      } else {
        alert('削除に失敗しました');
      }
    }
  };

  // モーダル編集開始
  const startEdit = (item, type) => {
    setModalState({ isOpen: true, type, item });
  };

  // モーダルを閉じる
  const closeModal = () => {
    setModalState({ isOpen: false, type: null, item: null });
  };

  // アクションモーダルを開く
  const openActionModal = (item, type) => {
    setActionModalState({ isOpen: true, item, type });
  };

  // アクションモーダルを閉じる
  const closeActionModal = () => {
    setActionModalState({ isOpen: false, item: null, type: null });
  };

  // モーダルでフォルダを保存
  const handleModalFolderSave = async (data) => {
    try {
      // 元のparentIdとpriorityを保持
      await api.updateFolder(modalState.item.id, {
        ...modalState.item,
        ...data,
      });
      closeModal();
      onRefresh();
    } catch (err) {
      console.error('Error updating folder:', err);
      alert('フォルダの更新に失敗しました');
    }
  };

  // モーダルでコンテンツを保存
  const handleModalContentSave = async (data) => {
    try {
      // 元のfolderIdとpriorityを保持
      await api.updateContent(modalState.item.id, {
        ...modalState.item,
        ...data,
      });
      closeModal();
      onRefresh();
    } catch (err) {
      console.error('Error updating content:', err);
      alert('コンテンツの更新に失敗しました');
    }
  };


  // 新規フォルダ作成
  const createNewFolder = async (parentId = null) => {
    if (!newItemName.trim()) return;

    try {
      await api.createFolder({
        name: newItemName,
        parentId: parentId,
        status: 'public',
        priority: 0
      });
      setShowNewFolder(null);
      setNewItemName('');
      onRefresh();
    } catch (err) {
      console.error('Error creating folder:', err);
      alert('フォルダの作成に失敗しました');
    }
  };

  // 新規コンテンツ作成
  const createNewContent = async (folderId = null) => {
    if (!newItemName.trim()) return;

    try {
      await api.createContent({
        title: newItemName,
        folderId: folderId,
        content: '',
        status: 'draft',
        priority: 0
      });
      setShowNewContent(null);
      setNewItemName('');
      onRefresh();
    } catch (err) {
      console.error('Error creating content:', err);
      alert('コンテンツの作成に失敗しました');
    }
  };

  // ドラッグ開始
  const handleDragStart = (e, item, type) => {
    setDraggedItem({ ...item, type });
    e.dataTransfer.effectAllowed = 'move';
  };

  // ドラッグオーバー
  const handleDragOver = (e, item, type) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // ドロップ位置の判定（要素の上半分か下半分か）
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    let position = 'on';
    if (draggedItem && draggedItem.type === type) {
      // 同じタイプの場合は前後の判定をする
      if (y < height * 0.3) {
        position = 'before';
      } else if (y > height * 0.7) {
        position = 'after';
      }
    }
    
    setDragOverItem({ ...item, type });
    setDropPosition(position);
  };

  // ドラッグ終了
  const handleDragLeave = () => {
    setDragOverItem(null);
    setDropPosition('on');
  };

  // ドロップ処理
  const handleDrop = async (e, targetItem, targetType, dropPosition = 'on') => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverItem(null);

    if (!draggedItem) return;

    try {
      // フォルダをフォルダにドロップ（親フォルダの変更）
      if (draggedItem.type === 'folder' && targetType === 'folder' && dropPosition === 'on') {
        if (draggedItem.id === targetItem.id) return;
        
        await api.updateFolder(draggedItem.id, {
          ...draggedItem,
          parentId: targetItem.id
        });
      }
      // コンテンツをフォルダにドロップ（所属フォルダの変更）
      else if (draggedItem.type === 'content' && targetType === 'folder' && dropPosition === 'on') {
        await api.updateContent(draggedItem.id, {
          ...draggedItem,
          folderId: targetItem.id
        });
      }
      // 同じ親を持つ同じタイプのアイテム間での優先度調整
      else if (draggedItem.type === targetType && dropPosition !== 'on') {
        // 同じ親を持つかチェック
        const draggedParent = draggedItem.type === 'folder' ? draggedItem.parentId : draggedItem.folderId;
        const targetParent = targetItem.type === 'folder' ? targetItem.parentId : targetItem.folderId;
        const sameParent = draggedParent === targetParent;
        
        if (sameParent) {
          // 同じ親のアイテムをすべて取得
          let siblings;
          if (draggedItem.type === 'folder') {
            siblings = folders.filter(f => f.parentId === targetItem.parentId);
          } else {
            siblings = contents.filter(c => c.folderId === targetItem.folderId);
          }

          // 優先度でソート
          siblings.sort((a, b) => (b.priority || 0) - (a.priority || 0));

          // ドラッグされたアイテムを除外
          siblings = siblings.filter(item => item.id !== draggedItem.id);

          // ターゲットのインデックスを取得
          const targetIndex = siblings.findIndex(item => item.id === targetItem.id);
          
          // 新しい位置にドラッグされたアイテムを挿入
          const insertIndex = dropPosition === 'before' ? targetIndex : targetIndex + 1;
          siblings.splice(insertIndex, 0, draggedItem);

          // 優先度を再計算（10刻みで設定）
          const updatePromises = siblings.map((item, index) => {
            const newPriority = (siblings.length - index) * 10;
            if (item.priority !== newPriority) {
              if (item.type === 'folder') {
                return api.updateFolder(item.id, { ...item, priority: newPriority });
              } else {
                return api.updateContent(item.id, { ...item, priority: newPriority });
              }
            }
            return null;
          }).filter(p => p !== null);

          await Promise.all(updatePromises);
        }
      }

      onRefresh();
    } catch (err) {
      console.error('Error updating item:', err);
      alert('更新に失敗しました');
    }

    setDraggedItem(null);
  };

  // ルートへのドロップ
  const handleDropToRoot = async (e) => {
    e.preventDefault();
    setDragOverItem(null);

    if (!draggedItem) return;

    try {
      if (draggedItem.type === 'folder') {
        await api.updateFolder(draggedItem.id, {
          ...draggedItem,
          parentId: null
        });
      } else if (draggedItem.type === 'content') {
        await api.updateContent(draggedItem.id, {
          ...draggedItem,
          folderId: null
        });
      }
      onRefresh();
    } catch (err) {
      console.error('Error updating item:', err);
      alert('更新に失敗しました');
    }

    setDraggedItem(null);
  };

  // フォルダツリーをレンダリング
  const renderFolderTree = (allFolders, parentId = null, level = 0) => {
    const childFolders = allFolders.filter(f => {
      if (parentId === null) {
        return !f.parentId || f.parentId === '';
      }
      return f.parentId === parentId;
    }).sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    if (childFolders.length === 0) return null;

    return (
      <ul className={`folder-tree-list ${level === 0 ? 'root' : ''}`}>
        {childFolders.map(folder => {
          const folderContents = contents.filter(c => c.folderId === folder.id)
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));
          const isDragOver = dragOverItem?.id === folder.id && dragOverItem?.type === 'folder';
          const dragOverClass = isDragOver ? `drag-over-${dropPosition}` : '';

          return (
            <li key={folder.id} className="folder-tree-item">
              <div 
                className={`folder-tree-node ${dragOverClass}`} 
                style={{ paddingLeft: `${level * 20}px` }}
                draggable
                onDragStart={(e) => handleDragStart(e, folder, 'folder')}
                onDragOver={(e) => handleDragOver(e, folder, 'folder')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder, 'folder', dropPosition)}
              >
                <FolderIcon size={20} className="folder-icon" />
                <span className="folder-name">{folder.name}</span>
                <button
                  className={`folder-status status-${folder.status} clickable`}
                  onClick={(e) => {
                    e.stopPropagation();
                    openActionModal(folder, 'folder');
                  }}
                >
                  {folder.status === 'public' ? '公開' :
                   folder.status === 'limited' ? '限定公開' : '非公開'}
                </button>
              </div>
              {/* 新規フォルダ作成フォーム */}
              {showNewFolder === folder.id && (
                <div className="new-item-form" style={{ paddingLeft: `${(level + 1) * 20}px` }}>
                  <FolderIcon size={20} className="folder-icon" />
                  <input
                    type="text"
                    placeholder="新規フォルダ名"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createNewFolder(folder.id)}
                    onBlur={() => {
                      if (newItemName.trim()) {
                        createNewFolder(folder.id);
                      } else {
                        setShowNewFolder(null);
                        setNewItemName('');
                      }
                    }}
                    autoFocus
                    className="inline-edit"
                  />
                </div>
              )}
              {/* 新規コンテンツ作成フォーム */}
              {showNewContent === folder.id && (
                <div className="new-item-form" style={{ paddingLeft: `${(level + 1) * 20}px` }}>
                  <FileIcon size={16} className="content-icon" />
                  <input
                    type="text"
                    placeholder="新規コンテンツタイトル"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createNewContent(folder.id)}
                    onBlur={() => {
                      if (newItemName.trim()) {
                        createNewContent(folder.id);
                      } else {
                        setShowNewContent(null);
                        setNewItemName('');
                      }
                    }}
                    autoFocus
                    className="inline-edit"
                  />
                </div>
              )}
              {folderContents.length > 0 && (
                <ul className="content-list" style={{ paddingLeft: `${(level + 1) * 20}px` }}>
                  {folderContents.map(content => {
                    const isContentDragOver = dragOverItem?.id === content.id && dragOverItem?.type === 'content';
                    const contentDragOverClass = isContentDragOver ? `drag-over-${dropPosition}` : '';

                    return (
                      <li 
                        key={content.id} 
                        className={`content-item ${contentDragOverClass}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, content, 'content')}
                        onDragOver={(e) => handleDragOver(e, content, 'content')}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, content, 'content', dropPosition)}
                      >
                        <FileIcon size={16} className="content-icon" />
                        <span className="content-title">{content.title}</span>
                        <button
                          className={`content-status status-${content.status} clickable`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openActionModal(content, 'content');
                          }}
                        >
                          {content.status === 'draft' ? '下書き' :
                           content.status === 'review' ? 'レビュー中' :
                           content.status === 'standby' ? '待機中' : '公開'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {renderFolderTree(allFolders, folder.id, level + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div 
      className="sitemap-container"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDropToRoot}
    >
      <div className="sitemap-header">
        <h2>サイトマップ</h2>
        <div className="root-actions">
          <button
            className="btn-icon-add"
            onClick={() => setShowNewFolder('root')}
            title="ルートフォルダを作成"
          >
            <FolderPlusIcon size={24} />
          </button>
        </div>
      </div>
      {folders.length === 0 && contents.length === 0 ? (
        <p className="empty-state">フォルダとコンテンツがありません</p>
      ) : (
        <div className="folders-tree">
          {/* ルートレベルの新規フォルダ作成フォーム */}
          {showNewFolder === 'root' && (
            <div className="new-item-form">
              <FolderIcon size={20} className="folder-icon" />
              <input
                type="text"
                placeholder="新規フォルダ名"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createNewFolder(null)}
                onBlur={() => {
                  if (newItemName.trim()) {
                    createNewFolder(null);
                  } else {
                    setShowNewFolder(null);
                    setNewItemName('');
                  }
                }}
                autoFocus
                className="inline-edit"
              />
            </div>
          )}
          {renderFolderTree(folders)}
          {/* ルートレベルのコンテンツ */}
          {contents.filter(c => !c.folderId || c.folderId === '').length > 0 && (
            <ul className="content-list root">
              {contents.filter(c => !c.folderId || c.folderId === '')
                .sort((a, b) => (b.priority || 0) - (a.priority || 0))
                .map(content => {
                const isDragOver = dragOverItem?.id === content.id && dragOverItem?.type === 'content';
                const rootContentDragOverClass = isDragOver ? `drag-over-${dropPosition}` : '';

                return (
                  <li 
                    key={content.id} 
                    className={`content-item ${rootContentDragOverClass}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, content, 'content')}
                    onDragOver={(e) => handleDragOver(e, content, 'content')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, content, 'content', dropPosition)}
                  >
                    <FileIcon size={16} className="content-icon" />
                    <span className="content-title">{content.title}</span>
                    <button
                      className={`content-status status-${content.status} clickable`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openActionModal(content, 'content');
                      }}
                    >
                      {content.status === 'draft' ? '下書き' :
                       content.status === 'review' ? 'レビュー中' :
                       content.status === 'standby' ? '待機中' : '公開'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* 編集モーダル */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.type === 'folder' ? 'フォルダ編集' : 'コンテンツ編集'}
      >
        {modalState.type === 'folder' && modalState.item && (
          <FolderForm
            folder={modalState.item}
            folders={folders}
            onSubmit={handleModalFolderSave}
            onCancel={closeModal}
          />
        )}
        {modalState.type === 'content' && modalState.item && (
          <ContentForm
            content={modalState.item}
            folders={folders}
            onSubmit={handleModalContentSave}
            onCancel={closeModal}
          />
        )}
      </Modal>

      {/* アクションモーダル */}
      <ActionModal
        isOpen={actionModalState.isOpen}
        onClose={closeActionModal}
        item={actionModalState.item}
        type={actionModalState.type}
        onEdit={startEdit}
        onDelete={handleDelete}
        onAddFolder={(folderId) => {
          setShowNewFolder(folderId);
        }}
        onAddContent={(folderId) => {
          setShowNewContent(folderId);
        }}
      />
    </div>
  );
};

export default SitemapView;