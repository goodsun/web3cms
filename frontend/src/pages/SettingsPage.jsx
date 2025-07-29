import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useSettings } from '../contexts/SettingsContext';
import Toast from '../components/Toast';
import './SettingsPage.css';

const SettingsPage = () => {
  const { refreshSettings } = useSettings();
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

  useEffect(() => {
    loadSettings();
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
      setError('Failed to load settings. Please check your API configuration.');
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
      setSuccess('Settings saved successfully!');
      refreshSettings(); // Refresh global settings
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleApiUrlSave = () => {
    if (apiUrl) {
      api.updateApiUrl(apiUrl);
      localStorage.setItem('apiUrl', apiUrl);
      setSuccess('API URL updated successfully! Reloading settings...');
      loadSettings();
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
      <div className="settings-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <h1>Settings</h1>

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
        <h2>API Configuration</h2>
        <div className="api-config">
          <div className="form-group">
            <label htmlFor="apiUrl">API URL</label>
            <div className="input-group">
              <input
                type="url"
                id="apiUrl"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://your-api.execute-api.region.amazonaws.com"
                className="form-input"
              />
              <button
                type="button"
                onClick={handleApiUrlSave}
                className="btn btn-primary"
              >
                Update
              </button>
            </div>
            <small className="form-help">
              Enter your API Gateway URL to connect to the backend
            </small>
          </div>
        </div>
      </section>

      <form onSubmit={handleSave}>
        {/* Site Configuration */}
        <section className="settings-section">
          <h2>Site Configuration</h2>
          <div className="form-group">
            <label htmlFor="siteTitle">Site Title</label>
            <input
              type="text"
              id="siteTitle"
              value={settings.site.title}
              onChange={(e) => updateNestedState('site', 'title', e.target.value)}
              className="form-input"
              placeholder="My Web3 CMS"
            />
          </div>

          <div className="form-group">
            <label htmlFor="siteDescription">Site Description</label>
            <textarea
              id="siteDescription"
              value={settings.site.description}
              onChange={(e) => updateNestedState('site', 'description', e.target.value)}
              className="form-textarea"
              rows="3"
              placeholder="A serverless CMS with Web3 integration"
            />
          </div>

          <div className="form-group">
            <label htmlFor="copyrightText">Copyright Text</label>
            <input
              type="text"
              id="copyrightText"
              value={settings.site.copyrightText}
              onChange={(e) => updateNestedState('site', 'copyrightText', e.target.value)}
              className="form-input"
              placeholder="© 2024 My Company"
            />
          </div>

          <div className="form-group">
            <label htmlFor="footerText">Footer Text</label>
            <input
              type="text"
              id="footerText"
              value={settings.site.footerText}
              onChange={(e) => updateNestedState('site', 'footerText', e.target.value)}
              className="form-input"
              placeholder="Powered by AWS CDK, Lambda, API Gateway & DynamoDB"
            />
          </div>
        </section>

        {/* Web3 Configuration */}
        <section className="settings-section">
          <h2>Web3 Configuration</h2>
          
          <div className="form-group">
            <label htmlFor="defaultChainId">Chain ID</label>
            <input
              type="number"
              id="defaultChainId"
              value={settings.web3.defaultChainId}
              onChange={(e) => updateNestedState('web3', 'defaultChainId', parseInt(e.target.value) || 1)}
              className="form-input"
              placeholder="1"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <small className="form-help">
              Default blockchain network ID (e.g., 1 for Ethereum Mainnet, 137 for Polygon)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="rpcUrls">RPC URLs</label>
            <textarea
              id="rpcUrls"
              value={settings.web3.rpcUrls}
              onChange={(e) => updateNestedState('web3', 'rpcUrls', e.target.value)}
              className="form-textarea"
              placeholder="https://eth-mainnet.g.alchemy.com/v2/your-api-key, https://mainnet.infura.io/v3/your-api-key"
              rows={3}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-sm)' }}
            />
            <small className="form-help">
              Comma-separated list of RPC endpoints for load balancing. The system will rotate through these URLs for better reliability.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="nftContract">NFT Contract Address</label>
            <input
              type="text"
              id="nftContract"
              value={settings.web3.nftContract}
              onChange={(e) => updateNestedState('web3', 'nftContract', e.target.value)}
              className="form-input"
              placeholder="0x..."
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <small className="form-help">
              The address of your NFT contract
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="tbaRegistry">TBA Registry Address</label>
            <input
              type="text"
              id="tbaRegistry"
              value={settings.web3.tbaRegistry}
              onChange={(e) => updateNestedState('web3', 'tbaRegistry', e.target.value)}
              className="form-input"
              placeholder="0x..."
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <small className="form-help">
              The address of the Token Bound Account Registry contract
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="tbaImplementation">TBA Implementation Address</label>
            <input
              type="text"
              id="tbaImplementation"
              value={settings.web3.tbaImplementation}
              onChange={(e) => updateNestedState('web3', 'tbaImplementation', e.target.value)}
              className="form-input"
              placeholder="0x..."
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <small className="form-help">
              The address of the Token Bound Account implementation contract
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="tbaSalt">TBA Salt</label>
            <input
              type="text"
              id="tbaSalt"
              value={settings.web3.tbaSalt}
              onChange={(e) => updateNestedState('web3', 'tbaSalt', e.target.value)}
              className="form-input"
              placeholder="0"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <small className="form-help">
              Salt value for deterministic TBA address generation (typically 0)
            </small>
          </div>
        </section>

        {/* Features */}
        <section className="settings-section">
          <h2>Features</h2>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.features.requireAuthentication}
              onChange={(e) => updateNestedState('features', 'requireAuthentication', e.target.checked)}
            />
            Require Authentication
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.features.maintenanceMode}
              onChange={(e) => updateNestedState('features', 'maintenanceMode', e.target.checked)}
            />
            Maintenance Mode
          </label>
        </section>

        {/* Admin Configuration */}
        <section className="settings-section">
          <h2>Admin Configuration</h2>
          <div className="form-group">
            <label htmlFor="adminEmail">Admin Email</label>
            <input
              type="email"
              id="adminEmail"
              value={settings.admin.email}
              onChange={(e) => updateNestedState('admin', 'email', e.target.value)}
              className="form-input"
              placeholder="admin@example.com"
            />
          </div>
        </section>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;