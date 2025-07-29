import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Web3Provider } from './contexts/Web3Context';
import { SettingsProvider } from './contexts/SettingsContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import NFTsPage from './pages/NFTsPage';
import NFTListPage from './pages/NFTListPage';
import CreatorsPage from './pages/CreatorsPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

function App() {
  return (
    <SettingsProvider>
      <Web3Provider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="nfts" element={<NFTsPage />} />
              <Route path="nfts/creator" element={<CreatorsPage />} />
              <Route path="nfts/creator/:address" element={<NFTListPage mode="creator" />} />
              <Route path="nfts/owner/:address" element={<NFTListPage mode="owner" />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Router>
      </Web3Provider>
    </SettingsProvider>
  );
}

export default App
