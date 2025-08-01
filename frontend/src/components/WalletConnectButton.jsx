import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import WalletIcon from './icons/WalletIcon';
import './WalletConnectButton.css';

const WalletConnectButton = () => {
  const { isConnecting, isConnected, connect, currentUser } = useWeb3();
  const navigate = useNavigate();

  const handleClick = async () => {
    if (isConnected) {
      navigate('/settings');
    } else {
      await connect();
    }
  };

  const hasAvatar = currentUser?.avatar && isConnected;

  return (
    <button
      className={`wallet-icon-btn ${isConnected ? 'connected' : ''} ${isConnecting ? 'connecting' : ''} ${hasAvatar ? 'has-avatar' : ''}`}
      onClick={handleClick}
      disabled={isConnecting}
      title={isConnected ? 'Go to settings' : 'Connect wallet'}
    >
      {hasAvatar ? (
        <img 
          src={currentUser.avatar} 
          alt={currentUser.name || 'User avatar'}
          className="user-avatar"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
      ) : null}
      <WalletIcon 
        size={20} 
        color={isConnected ? '#10b981' : 'currentColor'}
        style={hasAvatar ? { display: 'none' } : {}}
      />
    </button>
  );
};

export default WalletConnectButton;