import React, { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '../contexts/SettingsContext';
import { useWeb3 } from '../contexts/Web3Context';
import WalletConnectButton from './WalletConnectButton';
import WalletStatusBar from './WalletStatusBar';
import MobileBottomNav from './MobileBottomNav';
import './Layout.css';

const Layout = () => {
  const location = useLocation();
  const { settings, loading } = useSettings();
  const { account, isMember } = useWeb3();

  React.useEffect(() => {
    console.log('Layout settings:', settings);
    console.log('Layout - account:', account, 'isMember:', isMember);
  }, [settings, account, isMember]);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/nfts', label: 'NFTs' },
    { path: '/nfts/mint', label: 'Mint' },
    { path: '/items', label: 'Items' },
    { path: '/settings', label: 'Settings' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <Helmet>
        <title>{settings?.title || 'Web3CMS'}</title>
        {settings?.description && <meta name="description" content={settings.description} />}
      </Helmet>
      <div className="app-layout">
      <header className="main-header">
        <div className="header-container">
          <div className="logo">
            {settings?.title || 'Web3CMS'}
          </div>
          
          <nav className="main-nav">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="wallet-container">
            <WalletConnectButton />
          </div>

          <div className="mobile-header-actions">
            <div className="mobile-wallet-button">
              <WalletConnectButton />
            </div>
          </div>
        </div>

      </header>

      {account && <WalletStatusBar />}

      <main className={`main-content ${account ? 'with-wallet-bar' : ''}`}>
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer className="main-footer">
        {settings?.copyrightText && <p>{settings.copyrightText}</p>}
        {settings?.footerText && <p>{settings.footerText}</p>}
      </footer>
      
      <MobileBottomNav />
      </div>
    </>
  );
};

export default Layout;