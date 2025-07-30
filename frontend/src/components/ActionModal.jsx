import React from 'react';
import { EditIcon, TrashIcon, FolderPlusIcon, FilePlusIcon, CloseIcon } from './Icons';
import './ActionModal.css';

const ActionModal = ({ isOpen, onClose, item, type, onEdit, onDelete, onAddFolder, onAddContent }) => {
  if (!isOpen || !item) return null;

  const handleAction = (action) => {
    action();
    onClose();
  };

  return (
    <div className="action-modal-overlay" onClick={onClose}>
      <div className="action-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="action-modal-header">
          <h3>{type === 'folder' ? item.name : item.title}</h3>
          <button className="action-modal-close" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>
        <div className="action-modal-body">
          <button
            className="action-modal-button"
            onClick={() => handleAction(() => onEdit(item, type))}
          >
            <EditIcon size={20} className="action-icon" />
            <span className="action-label">編集</span>
          </button>
          
          {type === 'folder' && (
            <>
              <button
                className="action-modal-button"
                onClick={() => handleAction(() => onAddFolder(item.id))}
              >
                <FolderPlusIcon size={20} className="action-icon" />
                <span className="action-label">サブフォルダを追加</span>
              </button>
              <button
                className="action-modal-button"
                onClick={() => handleAction(() => onAddContent(item.id))}
              >
                <FilePlusIcon size={20} className="action-icon" />
                <span className="action-label">コンテンツを追加</span>
              </button>
            </>
          )}
          
          <button
            className="action-modal-button action-modal-button-danger"
            onClick={() => handleAction(() => onDelete(item, type))}
          >
            <TrashIcon size={20} className="action-icon" />
            <span className="action-label">削除</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionModal;