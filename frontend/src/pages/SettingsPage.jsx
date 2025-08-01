import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useI18n } from '../contexts/I18nContext';
import { userService } from '../services/api';
import Toast from '../components/Toast';
import { Link } from 'react-router-dom';
import PreAuthSettingsPage from './PreAuthSettingsPage';
import './SettingsPage.css';

const SettingsPage = () => {
  const { account, currentUser, isAdmin, isLoadingUser } = useWeb3();
  const { t, language, changeLanguage } = useI18n();
  const [user, setUser] = useState({
    eoa: '',
    name: '',
    discordId: '',
    avatar: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [adminExists, setAdminExists] = useState(true);
  const [claimingAdmin, setClaimingAdmin] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setUser({
        eoa: currentUser.eoa || '',
        name: currentUser.name || '',
        discordId: currentUser.discordId || '',
        avatar: currentUser.avatar || ''
      });
    }
    checkAdminStatus();
  }, [currentUser]);

  const checkAdminStatus = async () => {
    try {
      const exists = await userService.checkAdminExists();
      setAdminExists(exists);
    } catch (err) {
      console.error('Failed to check admin status:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await userService.update(account, {
        name: user.name,
        avatar: user.avatar
      });
      setSuccess(t('settings.profileUpdated', 'Profile updated successfully!'));
    } catch (err) {
      console.error('Failed to save user settings:', err);
      setError(t('settings.saveError', 'Failed to save settings. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleClaimAdmin = async () => {
    if (!account || adminExists) return;
    
    setClaimingAdmin(true);
    setError(null);
    
    try {
      await userService.claimAdmin(account);
      setSuccess(t('settings.adminClaimSuccess', 'Admin privileges claimed successfully!'));
      setAdminExists(true);
      // Reload the page to refresh user context
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error('Failed to claim admin:', err);
      setError(t('settings.adminClaimError', 'Failed to claim admin privileges. Please try again.'));
    } finally {
      setClaimingAdmin(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="settings-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{t('settings.loadingUser', 'Loading user information...')}</p>
        </div>
      </div>
    );
  }

  // Show PreAuthSettingsPage if wallet is not connected
  if (!account) {
    return <PreAuthSettingsPage />;
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>{t('settings.title', 'User Settings')}</h1>
      </div>

      {error && (
        <Toast
          message={error}
          type="error"
          duration={5000}
          onClose={() => setError(null)}
        />
      )}
      {success && (
        <Toast
          message={success}
          type="success"
          duration={3000}
          onClose={() => setSuccess(null)}
        />
      )}

      <form onSubmit={handleSave}>
        {/* Language Settings */}
        <section className="settings-section">
          <h2>{t('settings.language', 'Language')}</h2>
          
          <div className="form-group">
            <label htmlFor="language">{t('settings.selectLanguage', 'Select your preferred language')}</label>
            <select
              id="language"
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="form-input"
            >
              <option value="en">English</option>
              <option value="ja">日本語 (Japanese)</option>
            </select>
          </div>
        </section>

        {/* User Profile */}
        <section className="settings-section">
          <h2>{t('settings.profile', 'Profile Information')}</h2>
          
          <div className="form-group">
            <label htmlFor="eoa">{t('settings.walletAddress', 'Wallet Address')}</label>
            <input
              type="text"
              id="eoa"
              value={user.eoa}
              disabled
              className="form-input disabled"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">{t('settings.displayName', 'Display Name')}</label>
            <input
              type="text"
              id="name"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              className="form-input"
              placeholder={t('settings.displayNamePlaceholder', 'Enter your display name')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="discordId">Discord ID</label>
            <input
              type="text"
              id="discordId"
              value={user.discordId || 'Not connected'}
              disabled
              className="form-input disabled"
              placeholder="Connect via Discord bot"
            />
            <small className="form-help">
              {t('settings.discordIdHint', 'Discord ID will be set automatically when you connect via Discord bot')}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="avatar">{t('settings.avatarUrl', 'Avatar URL')}</label>
            <input
              type="url"
              id="avatar"
              value={user.avatar}
              onChange={(e) => setUser({ ...user, avatar: e.target.value })}
              className="form-input"
              placeholder={t('settings.avatarUrlPlaceholder', 'Enter your avatar image URL')}
            />
          </div>
        </section>

        {/* Admin Status */}
        <section className="settings-section">
          <h2>Account Status</h2>
          
          <div className="admin-status">
            <p>
              Current Status: {isAdmin ? (
                <span className="status-badge admin">Administrator</span>
              ) : (
                <span className="status-badge member">Member</span>
              )}
            </p>
            
            {!isAdmin && !adminExists && (
              <div className="admin-claim">
                <p className="warning-text">
                  ⚠️ {t('settings.claimAdminDescription', 'You can claim admin privileges as the first admin.')}
                </p>
                <button
                  type="button"
                  onClick={handleClaimAdmin}
                  disabled={claimingAdmin}
                  className="btn btn-warning"
                >
                  {claimingAdmin ? t('settings.claimingAdmin', 'Claiming admin privileges...') : t('settings.claimAdminButton', 'Claim Admin Privileges')}
                </button>
              </div>
            )}

            {isAdmin && (
              <div className="admin-link">
                <p>{t('settings.adminDashboard', 'Admin Dashboard')}</p>
                <Link to="/settings/admin" className="btn btn-secondary">
                  {t('settings.systemSettings', 'System Settings')} →
                </Link>
              </div>
            )}
          </div>
        </section>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? t('settings.savingChanges', 'Saving changes...') : t('settings.saveChanges', 'Save Changes')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;