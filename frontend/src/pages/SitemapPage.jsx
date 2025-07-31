import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import api from '../services/api';
import SitemapView from '../components/SitemapView';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import './ColumnsPage.css';

const SitemapPage = () => {
  const { account } = useWeb3();
  const [folders, setFolders] = useState([]);
  const [contents, setContents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [account]);

  const fetchData = async () => {
    if (!account) {
      setError('Please connect your wallet to view sitemap');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [foldersResponse, contentsResponse] = await Promise.all([
        api.getFolders(),
        api.getContents()
      ]);

      // 優先度でソートしてからセット
      const sortedFolders = (foldersResponse.folders || []).sort((a, b) => {
        if (b.priority !== a.priority) {
          return (b.priority || 0) - (a.priority || 0);
        }
        return a.name.localeCompare(b.name);
      });
      
      const sortedContents = (contentsResponse.contents || []).sort((a, b) => {
        if (b.priority !== a.priority) {
          return (b.priority || 0) - (a.priority || 0);
        }
        return a.title.localeCompare(b.title);
      });
      
      setFolders(sortedFolders);
      setContents(sortedContents);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="columns-page">
        <h1>Sitemap Editor</h1>
        <div className="wallet-required">
          Please connect your wallet to edit sitemap.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="columns-page">
        <h1>Sitemap Editor</h1>
        <LoadingState message="Loading sitemap..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="columns-page">
        <h1>Sitemap Editor</h1>
        <ErrorState message={error} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="columns-page">
      <div className="page-header">
        <h1>Sitemap Editor</h1>
        <div className="sitemap-actions">
          <button
            className="btn btn-secondary sitemap-action-btn"
            data-action="edit-root"
            title="トップページコンテンツを編集"
          >
            トップページ編集
          </button>
          <button
            className="btn btn-primary sitemap-action-btn"
            data-action="add-folder"
            title="ルートフォルダを作成"
          >
            <span style={{ marginRight: '0.5rem' }}>📁</span>
            フォルダ追加
          </button>
        </div>
      </div>
      <SitemapView folders={folders} contents={contents} onRefresh={fetchData} />
    </div>
  );
};

export default SitemapPage;