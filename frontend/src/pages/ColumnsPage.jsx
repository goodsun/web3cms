import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useWeb3 } from "../contexts/Web3Context";
import { useSettings } from "../contexts/SettingsContext";
import { useI18n } from "../contexts/I18nContext";
import api from "../services/api";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import "./ColumnsPage.css";

const ColumnsPage = () => {
  const { account } = useWeb3();
  const { settings } = useSettings();
  const { t } = useI18n();
  const [folders, setFolders] = useState([]);
  const [contents, setContents] = useState([]);
  const [rootContent, setRootContent] = useState(null);
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

      // Use public API endpoints that don't require authentication
      const [foldersResponse, contentsResponse] = await Promise.all([
        api.getPublicFolders(),
        api.getPublicContents(),
      ]);

      // Find root content in public contents
      const allContents = contentsResponse.contents || [];
      const rootContentItem = allContents.find((c) => c.id === "root");
      if (rootContentItem) {
        setRootContent(rootContentItem.content || "");
      }

      // Get root folders only (parent_id/parentId is null or 0)
      const allFolders = foldersResponse.folders || [];
      const rootFolders = allFolders
        .filter((f) => {
          if (f.id === "root") return false; // Exclude root record
          const parentId = f.parent_id || f.parentId;
          return !parentId || parentId === 0 || parentId === "0";
        })
        .sort((a, b) => {
          if (b.priority !== a.priority) {
            return (b.priority || 0) - (a.priority || 0);
          }
          return a.name.localeCompare(b.name);
        });

      setFolders(rootFolders);
    } catch (err) {
      console.error("Error fetching data:", err);
      // If 401/403 error and no account, show empty state instead of error
      if (
        !account &&
        (err.response?.status === 401 || err.response?.status === 403)
      ) {
        setFolders([]);
      } else {
        setError(t('common.error', 'An error occurred'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="columns-page">
        <h1>{settings?.title || "Web3CMS"}</h1>
        <LoadingState message="Loading folders..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="columns-page">
        <h1>{settings?.title || "Web3CMS"}</h1>
        <ErrorState message={error} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="columns-page">
      <div className="page-header">
        <h1>{settings?.title || "Web3CMS"}</h1>
        {account && (
          <div className="admin-actions">
            <Link to="/sitemap" className="sitemap-link">
              Edit Sitemap
            </Link>
          </div>
        )}
      </div>

      {rootContent && (
        <div className="page-content">
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {rootContent}
            </ReactMarkdown>
          </div>
        </div>
      )}

      <div className="folders-grid">
        {folders.map((folder) => (
          <Link
            key={folder.id}
            to={`/folder/${folder.id}`}
            className="folder-card"
          >
            <div className="folder-info">
              <h2>{folder.name}</h2>
              {folder.description && <p>{folder.description}</p>}
            </div>
          </Link>
        ))}
      </div>

      {folders.length === 0 && (
        <div className="empty-state">
          <p>No folders available.</p>
          {account && (
            <Link to="/sitemap" className="create-link">
              Create folders in Sitemap Editor
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default ColumnsPage;
