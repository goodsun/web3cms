import React, { useState } from 'react';
import { copyToClipboard } from '../utils/copyToClipboard';
import './CopyButton.css';

const CopyButton = ({ 
  text, 
  label = 'Copy',
  successLabel = '✓',
  className = '',
  onCopy
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
      }, 1000);
      if (onCopy) {
        onCopy();
      }
    }
  };

  return (
    <button
      className={`copy-button ${className}`}
      onClick={handleCopy}
      title={`Copy ${label}`}
    >
      {copySuccess ? successLabel : '📋'}
    </button>
  );
};

export default CopyButton;