import React, { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '../contexts/SettingsContext';
import { useWeb3 } from '../contexts/Web3Context';
import WalletConnectButton from './WalletConnectButton';
import WalletStatusBar from './WalletStatusBar';
import './Layout.css';

const Layout = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { settings, loading } = useSettings();
  const { account, isMember } = useWeb3();

  React.useEffect(() => {
    console.log('Layout settings:', settings);
    console.log('Layout - account:', account, 'isMember:', isMember);
  }, [settings, account, isMember]);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/items', label: 'Items' },
    { path: '/nfts', label: 'NFTs' },
    ...(isMember ? [{ path: '/settings', label: 'Settings' }] : []),
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
          <Link to="/" className="logo">
            {settings?.title || 'Web3CMS'}
          </Link>
          
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
            <button
              className={`menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        <nav className={`mobile-nav ${mobileMenuOpen ? 'active' : ''}`}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      {account && <WalletStatusBar isMobileMenuOpen={mobileMenuOpen} />}

      <main className={`main-content ${account ? 'with-wallet-bar' : ''} ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer className="main-footer">
        {settings?.copyrightText && <p>{settings.copyrightText}</p>}
        {settings?.footerText && <p>{settings.footerText}</p>}
      </footer>
      </div>
    </>
  );
};

export default Layout;