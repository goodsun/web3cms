import React, { useState, useRef, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import './WalletConnectButton.css';

const WalletConnectButton = () => {
  const { account, isConnecting, isConnected, connect, disconnect, error } = useWeb3();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleClick = async () => {
    if (isConnected) {
      setShowDropdown(!showDropdown);
    } else {
      await connect();
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setShowDropdown(false);
  };

  return (
    <div className="wallet-connect-wrapper" ref={dropdownRef}>
      <button
        className={`wallet-connect-btn ${isConnected ? 'connected' : ''}`}
        onClick={handleClick}
        disabled={isConnecting}
      >
        {isConnecting ? 'Connecting...' : isConnected ? formatAddress(account) : 'Connect Wallet'}
      </button>

      {showDropdown && isConnected && (
        <div className="wallet-dropdown">
          <div className="wallet-info">
            <span className="wallet-label">Connected</span>
            <span className="wallet-address">{account}</span>
          </div>
          <button className="wallet-disconnect-btn" onClick={handleDisconnect}>
            Disconnect
          </button>
        </div>
      )}

      {error && (
        <div className="wallet-error">
          {error}
        </div>
      )}
    </div>
  );
};

export default WalletConnectButton;