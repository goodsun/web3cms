import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useSettings } from '../contexts/SettingsContext';
import { useWeb3 } from '../contexts/Web3Context';
import { useI18n } from '../contexts/I18nContext';
import Toast from '../components/Toast';
import UserDisplay from '../components/UserDisplay';
import { userService } from '../services/api';
import './AdminSettingsPage.css';

const AdminSettingsPage = () => {
  const { refreshSettings } = useSettings();
  const { currentUser, refreshUser } = useWeb3();
  const { t } = useI18n();
  const [settings, setSettings] = useState({
    site: {
      title: '',
      description: '',
      copyrightText: '',
      footerText: '',
    },
    web3: {
      defaultChainId: 1,
      rpcUrls: '',
      nftContract: '',
      tbaRegistry: '',
      tbaImplementation: '',
      tbaSalt: '0',
    },
    features: {
      requireAuthentication: false,
      maintenanceMode: false,
    },
    admin: {
      email: '',
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('apiUrl') || '');
  const [adminEoa, setAdminEoa] = useState('');
  const [adminList, setAdminList] = useState([]);
  const [grantingAdmin, setGrantingAdmin] = useState(false);
  const [leavingAdmin, setLeavingAdmin] = useState(false);

  useEffect(() => {
    loadSettings();
    loadAdminList();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getSettings();
      if (response.data) {
        setSettings(response.data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError(t('settings.adminSettings.loadError', 'Failed to load settings. Please check your API configuration.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await api.updateSettings({ data: settings });
      setSuccess(t('settings.adminSettings.saveSuccess', 'Settings saved successfully!'));
      refreshSettings(); // Refresh global settings
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(t('settings.adminSettings.saveError', 'Failed to save settings. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleApiUrlSave = () => {
    if (apiUrl) {
      api.updateApiUrl(apiUrl);
      localStorage.setItem('apiUrl', apiUrl);
      setSuccess(t('settings.adminSettings.apiConfig.updateSuccess', 'API URL updated successfully! Reloading settings...'));
      loadSettings();
    }
  };

  const loadAdminList = async () => {
    try {
      const response = await userService.getAllUsers();
      const admins = response.users.filter(user => user.admin === true);
      setAdminList(admins);
    } catch (err) {
      console.error('Failed to load admin list:', err);
    }
  };

  const handleGrantAdmin = async (e) => {
    e.preventDefault();
    if (!adminEoa || !adminEoa.trim()) {
      setError(t('settings.adminSettings.adminManagement.invalidAddress', 'Please enter a valid EOA address'));
      return;
    }

    setGrantingAdmin(true);
    setError(null);
    setSuccess(null);

    try {
      // First check if user exists
      let user = await userService.getCurrentUser(adminEoa);
      
      if (!user) {
        // Register new user if doesn't exist
        user = await userService.registerUser(adminEoa);
      }

      // Grant admin privileges
      await userService.update(adminEoa, { admin: true });
      
      setSuccess(t('settings.adminSettings.adminManagement.grantSuccess', 'Admin privileges granted to {{address}}').replace('{{address}}', adminEoa));
      setAdminEoa('');
      loadAdminList(); // Reload admin list
    } catch (err) {
      console.error('Failed to grant admin privileges:', err);
      setError(t('settings.adminSettings.adminManagement.grantError', 'Failed to grant admin privileges. Please try again.'));
    } finally {
      setGrantingAdmin(false);
    }
  };

  const handleLeaveAdmin = async () => {
    if (!confirm(t('settings.adminSettings.adminManagement.leaveConfirm', 'Are you sure you want to revoke your admin privileges?'))) {
      return;
    }

    setLeavingAdmin(true);
    setError(null);
    setSuccess(null);

    try {
      await userService.update(currentUser.eoa, { admin: false });
      setSuccess(t('settings.adminSettings.adminManagement.leaveSuccess', 'Admin privileges revoked successfully'));
      refreshUser(); // Refresh current user context
      loadAdminList(); // Reload admin list
    } catch (err) {
      console.error('Failed to leave admin:', err);
      setError(t('settings.adminSettings.adminManagement.leaveError', 'Failed to revoke admin privileges. Please try again.'));
    } finally {
      setLeavingAdmin(false);
    }
  };


  const updateNestedState = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };


  if (loading) {
    return (
      <div className="admin-settings-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{t('settings.adminSettings.loading', 'Loading settings...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-settings-page">
      <h1>{t('settings.adminSettings.title', 'Admin Settings')}</h1>

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

      {/* API Configuration */}
      <section className="settings-section">
        <h2>{t('settings.adminSettings.apiConfig.title', 'API Configuration')}</h2>
        <div className="api-config">
          <div className="form-group">
            <label htmlFor="apiUrl">{t('settings.adminSettings.apiConfig.apiUrl', 'API Gateway URL')}</label>
            <div className="input-group">
              <input
                type="url"
                id="apiUrl"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder={t('settings.adminSettings.apiConfig.apiUrlPlaceholder', 'https://your-api.execute-api.region.amazonaws.com')}
                className="form-input"
              />
              <button
                type="button"
                onClick={handleApiUrlSave}
                className="btn btn-primary"
              >
                {t('settings.adminSettings.apiConfig.update', 'Update')}
              </button>
            </div>
            <small className="form-help">
              {t('settings.adminSettings.apiConfig.hint', 'Enter your API Gateway URL to connect to the backend')}
            </small>
          </div>
        </div>
      </section>

      <form onSubmit={handleSave}>
        {/* Site Configuration */}
        <section className="settings-section">
          <h2>{t('settings.adminSettings.siteConfig.title', 'Site Configuration')}</h2>
          <div className="form-group">
            <label htmlFor="siteTitle">{t('settings.adminSettings.siteConfig.siteName', 'Site Name')}</label>
            <input
              type="text"
              id="siteTitle"
              value={settings.site.title}
              onChange={(e) => updateNestedState('site', 'title', e.target.value)}
              className="form-input"
              placeholder={t('settings.adminSettings.siteConfig.siteNamePlaceholder', 'My Web3 CMS')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="siteDescription">{t('settings.adminSettings.siteConfig.siteDescription', 'Site Description')}</label>
            <textarea
              id="siteDescription"
              value={settings.site.description}
              onChange={(e) => updateNestedState('site', 'description', e.target.value)}
              className="form-textarea"
              rows="3"
              placeholder={t('settings.adminSettings.siteConfig.siteDescriptionPlaceholder', 'A serverless CMS with Web3 integration')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="copyrightText">{t('settings.adminSettings.siteConfig.copyrightText', 'Copyright Text')}</label>
            <input
              type="text"
              id="copyrightText"
              value={settings.site.copyrightText}
              onChange={(e) => updateNestedState('site', 'copyrightText', e.target.value)}
              className="form-input"
              placeholder={t('settings.adminSettings.siteConfig.copyrightTextPlaceholder', '© 2024 My Company')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="footerText">{t('settings.adminSettings.siteConfig.footerText', 'Footer Text')}</label>
            <input
              type="text"
              id="footerText"
              value={settings.site.footerText}
              onChange={(e) => updateNestedState('site', 'footerText', e.target.value)}
              className="form-input"
              placeholder={t('settings.adminSettings.siteConfig.footerTextPlaceholder', 'Powered by AWS CDK, Lambda, API Gateway & DynamoDB')}
            />
          </div>
        </section>

        {/* Web3 Configuration */}
        <section className="settings-section">
          <h2>{t('settings.adminSettings.web3Config.title', 'Web3 Configuration')}</h2>
          
          <div className="form-group">
            <label htmlFor="defaultChainId">{t('settings.adminSettings.web3Config.chainId', 'Chain ID')}</label>
            <input
              type="number"
              id="defaultChainId"
              value={settings.web3.defaultChainId}
              onChange={(e) => updateNestedState('web3', 'defaultChainId', parseInt(e.target.value) || 1)}
              className="form-input"
              placeholder={t('settings.adminSettings.web3Config.chainIdPlaceholder', '1')}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <small className="form-help">
              {t('settings.adminSettings.web3Config.chainIdHint', 'Default blockchain network ID (e.g., 1 for Ethereum Mainnet, 137 for Polygon)')}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="rpcUrls">{t('settings.adminSettings.web3Config.rpcUrls', 'RPC URLs')}</label>
            <textarea
              id="rpcUrls"
              value={settings.web3.rpcUrls}
              onChange={(e) => updateNestedState('web3', 'rpcUrls', e.target.value)}
              className="form-textarea"
              placeholder={t('settings.adminSettings.web3Config.rpcUrlsPlaceholder', 'https://eth-mainnet.g.alchemy.com/v2/your-api-key, https://mainnet.infura.io/v3/your-api-key')}
              rows={3}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-sm)' }}
            />
            <small className="form-help">
              {t('settings.adminSettings.web3Config.rpcUrlsHint', 'Comma-separated list of RPC endpoints for load balancing. The system will rotate through these URLs for better reliability.')}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="nftContract">{t('settings.adminSettings.web3Config.nftContract', 'NFT Contract Address')}</label>
            <input
              type="text"
              id="nftContract"
              value={settings.web3.nftContract}
              onChange={(e) => updateNestedState('web3', 'nftContract', e.target.value)}
              className="form-input"
              placeholder={t('settings.adminSettings.web3Config.addressPlaceholder', '0x...')}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <small className="form-help">
              {t('settings.adminSettings.web3Config.nftContractHint', 'The address of your NFT contract')}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="tbaRegistry">{t('settings.adminSettings.web3Config.tbaRegistry', 'TBA Registry Address')}</label>
            <input
              type="text"
              id="tbaRegistry"
              value={settings.web3.tbaRegistry}
              onChange={(e) => updateNestedState('web3', 'tbaRegistry', e.target.value)}
              className="form-input"
              placeholder={t('settings.adminSettings.web3Config.addressPlaceholder', '0x...')}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <small className="form-help">
              {t('settings.adminSettings.web3Config.tbaRegistryHint', 'The address of the Token Bound Account Registry contract')}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="tbaImplementation">{t('settings.adminSettings.web3Config.tbaImplementation', 'TBA Implementation Address')}</label>
            <input
              type="text"
              id="tbaImplementation"
              value={settings.web3.tbaImplementation}
              onChange={(e) => updateNestedState('web3', 'tbaImplementation', e.target.value)}
              className="form-input"
              placeholder={t('settings.adminSettings.web3Config.addressPlaceholder', '0x...')}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <small className="form-help">
              {t('settings.adminSettings.web3Config.tbaImplementationHint', 'The address of the Token Bound Account implementation contract')}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="tbaSalt">{t('settings.adminSettings.web3Config.tbaSalt', 'TBA Salt')}</label>
            <input
              type="text"
              id="tbaSalt"
              value={settings.web3.tbaSalt}
              onChange={(e) => updateNestedState('web3', 'tbaSalt', e.target.value)}
              className="form-input"
              placeholder={t('settings.adminSettings.web3Config.tbaSaltPlaceholder', '0')}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <small className="form-help">
              {t('settings.adminSettings.web3Config.tbaSaltHint', 'Salt value for deterministic TBA address generation (typically 0)')}
            </small>
          </div>
        </section>

        {/* Features */}
        <section className="settings-section">
          <h2>{t('settings.adminSettings.features.title', 'Features')}</h2>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.features.requireAuthentication}
              onChange={(e) => updateNestedState('features', 'requireAuthentication', e.target.checked)}
            />
            {t('settings.adminSettings.features.requireAuth', 'Require Authentication')}
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.features.maintenanceMode}
              onChange={(e) => updateNestedState('features', 'maintenanceMode', e.target.checked)}
            />
            {t('settings.adminSettings.features.maintenanceMode', 'Maintenance Mode')}
          </label>
        </section>

        {/* Admin Email Configuration */}
        <section className="settings-section">
          <h2>{t('settings.adminSettings.adminEmail.title', 'Admin Email Configuration')}</h2>
          <div className="form-group">
            <label htmlFor="adminEmail">{t('settings.adminSettings.adminEmail.email', 'Admin Email')}</label>
            <input
              type="email"
              id="adminEmail"
              value={settings.admin.email}
              onChange={(e) => updateNestedState('admin', 'email', e.target.value)}
              className="form-input"
              placeholder={t('settings.adminSettings.adminEmail.emailPlaceholder', 'admin@example.com')}
            />
          </div>
        </section>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? t('settings.adminSettings.saving', 'Saving...') : t('settings.adminSettings.saveSettings', 'Save Settings')}
          </button>
        </div>
      </form>

      {/* Configuration Status Section */}
      <section className="settings-section">
        <h2>{t('settings.adminSettings.configStatus.title', 'Configuration Status')}</h2>
        <div className="status-grid">
          <div className="status-item">
            <span
              className={`status-indicator ${
                settings.web3.rpcUrls ? "status-ok" : "status-error"
              }`}
            >
              ●
            </span>
            <span>{t('settings.adminSettings.configStatus.rpcConfig', 'RPC Configuration')}</span>
          </div>
          <div className="status-item">
            <span
              className={`status-indicator ${
                settings.web3.nftContract ? "status-ok" : "status-warning"
              }`}
            >
              ●
            </span>
            <span>{t('settings.adminSettings.configStatus.nftContract', 'NFT Contract')}</span>
          </div>
          <div className="status-item">
            <span
              className={`status-indicator ${
                settings.web3.tbaRegistry && settings.web3.tbaImplementation
                  ? "status-ok"
                  : "status-warning"
              }`}
            >
              ●
            </span>
            <span>{t('settings.adminSettings.configStatus.tbaConfig', 'TBA Configuration')}</span>
          </div>
        </div>
      </section>

      {/* Admin Management Section */}
      <section className="settings-section">
        <h2>{t('settings.adminSettings.adminManagement.title', 'Admin Management')}</h2>
        
        {/* Grant Admin Form */}
        <div className="admin-grant-section">
          <h3>{t('settings.adminSettings.adminManagement.grantTitle', 'Grant Admin Privileges')}</h3>
          <form onSubmit={handleGrantAdmin} className="admin-grant-form">
            <div className="form-group">
              <label htmlFor="adminEoa">{t('settings.adminSettings.adminManagement.eoaAddress', 'EOA Address')}</label>
              <div className="input-group">
                <input
                  type="text"
                  id="adminEoa"
                  value={adminEoa}
                  onChange={(e) => setAdminEoa(e.target.value)}
                  className="form-input"
                  placeholder={t('settings.adminSettings.adminManagement.eoaPlaceholder', '0x...')}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={grantingAdmin}
                >
                  {grantingAdmin ? t('settings.adminSettings.adminManagement.granting', 'Granting...') : t('settings.adminSettings.adminManagement.grantAdmin', 'Grant Admin')}
                </button>
              </div>
              <small className="form-help">
                {t('settings.adminSettings.adminManagement.grantHint', 'Enter the EOA address of the user you want to grant admin privileges to')}
              </small>
            </div>
          </form>
        </div>

        {/* Admin List */}
        <div className="admin-list-section">
          <h3>{t('settings.adminSettings.adminManagement.currentAdmins', 'Current Admins')}</h3>
          {adminList.length > 0 ? (
            <div className="admin-list">
              {adminList.map((admin) => (
                <div key={admin.eoa} className="admin-item">
                  <UserDisplay address={admin.eoa} size="medium" showAddress={true} />
                  {admin.eoa === currentUser?.eoa && (
                    <span className="current-label">{t('settings.adminSettings.adminManagement.you', '(You)')}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="no-admins">{t('settings.adminSettings.adminManagement.noAdmins', 'No admins found')}</p>
          )}
        </div>

        {/* Leave Admin Section */}
        {currentUser?.admin && (
          <div className="leave-admin-section">
            <h3>{t('settings.adminSettings.adminManagement.leaveTitle', 'Leave Admin Role')}</h3>
            <p className="warning-text">
              {t('settings.adminSettings.adminManagement.leaveWarning', 'Warning: If you are the last admin, the system will return to its initial state where any member can claim admin privileges.')}
            </p>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleLeaveAdmin}
              disabled={leavingAdmin}
            >
              {leavingAdmin ? t('settings.adminSettings.adminManagement.processing', 'Processing...') : t('settings.adminSettings.adminManagement.leaveButton', 'Revoke My Admin Privileges')}
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminSettingsPage;