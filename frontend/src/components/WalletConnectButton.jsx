import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import WalletIcon from './icons/WalletIcon';
import './WalletConnectButton.css';

const WalletConnectButton = () => {
  const { isConnecting, isConnected, connect, disconnect } = useWeb3();
  const navigate = useNavigate();

  const handleClick = async () => {
    if (isConnected) {
      await disconnect();
    } else {
      await connect();
    }
  };

  return (
    <button
      className={`wallet-icon-btn ${isConnected ? 'connected' : ''} ${isConnecting ? 'connecting' : ''}`}
      onClick={handleClick}
      disabled={isConnecting}
      title={isConnected ? 'Disconnect wallet' : 'Connect wallet'}
    >
      <WalletIcon 
        size={20} 
        color={isConnected ? '#10b981' : 'currentColor'}
      />
    </button>
  );
};

export default WalletConnectButton;