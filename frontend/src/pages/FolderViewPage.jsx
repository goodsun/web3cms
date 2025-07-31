import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSettings } from "../contexts/SettingsContext";
import api from "../services/api";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import "./FolderViewPage.css";

const FolderViewPage = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [folder, setFolder] = useState(null);
  const [subfolders, setSubfolders] = useState([]);
  const [contents, setContents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFolderData();
  }, [folderId]);

  const fetchFolderData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all data using public API endpoints
      const [foldersResponse, contentsResponse] = await Promise.all([
        api.getPublicFolders(),
        api.getPublicContents(),
      ]);

      const allFolders = foldersResponse.folders || [];
      const allContents = contentsResponse.contents || [];

      // Find current folder
      const currentFolder = allFolders.find((f) => f.id === folderId);
      if (!currentFolder) {
        setError("Folder not found");
        setIsLoading(false);
        return;
      }

      // Find subfolders (check both parent_id and parentId for compatibility)
      const subfolders = allFolders
        .filter((f) => (f.parent_id || f.parentId) === folderId)
        .sort((a, b) => {
          if (b.priority !== a.priority) {
            return (b.priority || 0) - (a.priority || 0);
          }
          return a.name.localeCompare(b.name);
        });

      // Find contents in this folder (check both folder_id and folderId for compatibility)
      const folderContents = allContents
        .filter((c) => (c.folder_id || c.folderId) === folderId)
        .sort((a, b) => {
          if (b.priority !== a.priority) {
            return (b.priority || 0) - (a.priority || 0);
          }
          return a.title.localeCompare(b.title);
        });

      setFolder(currentFolder);
      setSubfolders(subfolders);
      setContents(folderContents);
    } catch (err) {
      console.error("Error fetching folder data:", err);
      setError("Failed to load folder data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="folder-view-page">
        <LoadingState message="Loading folder..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="folder-view-page">
        <ErrorState message={error} onRetry={fetchFolderData} />
      </div>
    );
  }

  return (
    <div className="folder-view-page">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">{settings?.title || "Web3CMS"}</Link>
          <span className="separator">/</span>
          <span>{folder?.name}</span>
        </div>
        <h1>{folder?.name}</h1>
        {folder?.description && (
          <p className="folder-description">{folder.description}</p>
        )}
      </div>

      {folder?.contents && (
        <div className="folder-contents-section">
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {folder.contents}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {subfolders.length > 0 && (
        <div className="subfolders-section">
          <h2>Subfolders</h2>
          <div className="subfolders-grid">
            {subfolders.map((subfolder) => (
              <Link
                key={subfolder.id}
                to={`/folder/${subfolder.id}`}
                className="subfolder-card"
              >
                <div className="folder-info">
                  <h3>{subfolder.name}</h3>
                  {subfolder.description && <p>{subfolder.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {contents.length > 0 && (
        <div className="contents-section">
          <h2>Contents</h2>
          <div className="contents-list">
            {contents.map((content) => (
              <Link
                key={content.id}
                to={`/content/${content.id}`}
                className="content-item"
              >
                <div className="content-info">
                  <h3>{content.title}</h3>
                  {content.description && (
                    <p className="content-description">{content.description}</p>
                  )}
                  <div className="content-meta">
                    <span className="content-type">{content.type}</span>
                    {content.priority > 0 && (
                      <span className="content-priority">
                        Priority: {content.priority}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {subfolders.length === 0 && contents.length === 0 && (
        <div className="empty-state">
          <p>This folder is empty.</p>
        </div>
      )}
    </div>
  );
};

export default FolderViewPage;
