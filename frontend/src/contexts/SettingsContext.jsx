import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const SettingsContext = createContext({
  settings: null,
  loading: true,
  error: null,
  refreshSettings: () => {},
});

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getSettings();
      console.log("Settings API response:", response);

      // The actual settings are in response.data property from the backend
      const settingsData = response.data || {};
      console.log("Settings data:", settingsData);

      // Flatten the nested structure for easier access
      const flattenedSettings = {
        title: settingsData.site?.title || settingsData.title || "Web3CMS",
        description:
          settingsData.site?.description ||
          settingsData.description ||
          "A decentralized content management system",
        copyrightText:
          settingsData.site?.copyrightText ||
          settingsData.copyrightText ||
          "© 2025 bonsoleil. All rights reserved.",
        footerText:
          settingsData.site?.footerText ||
          settingsData.footerText ||
          "Powered by Web3 Technology",
        rpcUrls: settingsData.web3?.rpcUrls || "",
        nftContract: settingsData.web3?.nftContract || "",
        tbaRegistry: settingsData.web3?.tbaRegistry || "",
        tbaImplementation: settingsData.web3?.tbaImplementation || "",
        tbaSalt: settingsData.web3?.tbaSalt || "0",
        chainId: settingsData.web3?.defaultChainId || settingsData.web3?.chainId || settingsData.chainId || 1,
        requireAuthentication: settingsData.features?.requireAuthentication || false,
        maintenanceMode: settingsData.features?.maintenanceMode || false,
        adminEmail: settingsData.admin?.email || "",
        ...settingsData,
      };
      console.log("Flattened settings:", flattenedSettings);
      setSettings(flattenedSettings);
    } catch (err) {
      console.error("Failed to fetch settings:", err);
      setError(err.message);
      // Set default values if fetch fails
      setSettings({
        title: "Web3CMS",
        description: "A decentralized content management system",
        copyrightText: "© 2025 bonsoleil. All rights reserved.",
        footerText: "Powered by Web3 Technology",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const refreshSettings = () => {
    fetchSettings();
  };

  const value = {
    settings,
    loading,
    error,
    refreshSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
