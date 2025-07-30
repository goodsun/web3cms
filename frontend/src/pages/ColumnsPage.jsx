import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import api from '../services/api';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import './ColumnsPage.css';

const ColumnsPage = () => {
  const { account } = useWeb3();
  const [folders, setFolders] = useState([]);
  const [contents, setContents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Always fetch data - public folders should be viewable without authentication
    fetchData();
  }, []);


  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use public API endpoint that doesn't require authentication
      const foldersResponse = await api.getPublicFolders();
      
      // Get root folders only (parent_id/parentId is null or 0)
      const rootFolders = (foldersResponse.folders || [])
        .filter(f => {
          const parentId = f.parent_id || f.parentId;
          return !parentId || parentId === 0 || parentId === '0';
        })
        .sort((a, b) => {
          if (b.priority !== a.priority) {
            return (b.priority || 0) - (a.priority || 0);
          }
          return a.name.localeCompare(b.name);
        });
      
      setFolders(rootFolders);
    } catch (err) {
      console.error('Error fetching data:', err);
      // If 401/403 error and no account, show empty state instead of error
      if (!account && (err.response?.status === 401 || err.response?.status === 403)) {
        setFolders([]);
      } else {
        setError('Failed to load folders. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };



  if (isLoading) {
    return (
      <div className="columns-page">
        <h1>Columns</h1>
        <LoadingState message="Loading folders..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="columns-page">
        <h1>Columns</h1>
        <ErrorState message={error} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="columns-page">
      <div className="page-header">
        <h1>Columns</h1>
        {account && (
          <div className="admin-actions">
            <Link to="/columns/sitemap" className="sitemap-link">
              📝 Edit Sitemap
            </Link>
          </div>
        )}
      </div>

      <div className="folders-grid">
        {folders.map(folder => (
          <Link
            key={folder.id}
            to={`/columns/folder/${folder.id}`}
            className="folder-card"
          >
            <div className="folder-icon">📁</div>
            <div className="folder-info">
              <h2>{folder.name}</h2>
              {folder.description && (
                <p>{folder.description}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {folders.length === 0 && (
        <div className="empty-state">
          <p>No folders available.</p>
          {account && (
            <Link to="/columns/sitemap" className="create-link">
              Create folders in Sitemap Editor
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default ColumnsPage;