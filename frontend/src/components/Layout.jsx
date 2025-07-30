import React, { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '../contexts/SettingsContext';
import WalletConnectButton from './WalletConnectButton';
import './Layout.css';

const Layout = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { settings, loading } = useSettings();

  React.useEffect(() => {
    console.log('Layout settings:', settings);
  }, [settings]);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/nfts', label: 'NFTs' },
    { path: '/columns', label: 'Columns' },
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
          <div className="mobile-wallet-container">
            <WalletConnectButton />
          </div>
        </nav>
      </header>

      <main className="main-content">
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