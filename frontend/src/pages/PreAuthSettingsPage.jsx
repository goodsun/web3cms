import React from 'react';
import { useI18n } from '../contexts/I18nContext';
import './PreAuthSettingsPage.css';

const PreAuthSettingsPage = () => {
  const { t, language, changeLanguage } = useI18n();

  return (
    <div className="preauth-settings-page">
      <h1>{t('settings.title', 'User Settings')}</h1>
      
      <div className="settings-card">
        <section className="settings-section">
          <h2>{t('settings.language', 'Language')}</h2>
          <p className="section-description">
            {t('settings.selectLanguage', 'Select your preferred language')}
          </p>
          
          <div className="language-selector">
            <label className="radio-label">
              <input
                type="radio"
                name="language"
                value="en"
                checked={language === 'en'}
                onChange={(e) => changeLanguage(e.target.value)}
              />
              <span>English</span>
            </label>
            
            <label className="radio-label">
              <input
                type="radio"
                name="language"
                value="ja"
                checked={language === 'ja'}
                onChange={(e) => changeLanguage(e.target.value)}
              />
              <span>日本語</span>
            </label>
          </div>
        </section>
        
        <section className="settings-section">
          <div className="connect-prompt">
            <p className="info-text">
              {t('settings.connectPrompt', 'Connect your wallet to access all settings and features')}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PreAuthSettingsPage;