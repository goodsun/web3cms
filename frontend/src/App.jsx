import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Web3Provider } from './contexts/Web3Context';
import { SettingsProvider } from './contexts/SettingsContext';
import Layout from './components/Layout';
import ItemsPage from './pages/ItemsPage';
import NFTsPage from './pages/NFTsPage';
import NFTListPage from './pages/NFTListPage';
import CreatorsPage from './pages/CreatorsPage';
import NFTDetailPage from './pages/NFTDetailPage';
import MintPage from './pages/MintPage';
import SettingsPage from './pages/SettingsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import ColumnsPage from './pages/ColumnsPage';
import SitemapPage from './pages/SitemapPage';
import FolderViewPage from './pages/FolderViewPage';
import ContentViewPage from './pages/ContentViewPage';
import MobileDebugLog from './components/MobileDebugLog';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <SettingsProvider>
      <Web3Provider>
        <Router>
          <MobileDebugLog />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<ColumnsPage />} />
              <Route path="items" element={<ItemsPage />} />
              <Route path="folder/:folderId" element={<FolderViewPage />} />
              <Route path="content/:contentId" element={<ContentViewPage />} />
              <Route path="sitemap" element={<SitemapPage />} />
              <Route path="nfts" element={<NFTsPage />} />
              <Route path="nfts/mint" element={<MintPage />} />
              <Route path="nfts/token/:id" element={<NFTDetailPage />} />
              <Route path="nfts/creator" element={<CreatorsPage />} />
              <Route path="nfts/creator/:address" element={<NFTListPage mode="creator" />} />
              <Route path="nfts/owner/:address" element={<NFTListPage mode="owner" />} />
              <Route path="settings" element={
                <ProtectedRoute requireMember={true}>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              <Route path="settings/admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminSettingsPage />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Router>
      </Web3Provider>
    </SettingsProvider>
  );
}

export default App
