import React from 'react';
import './LoadingState.css';

const LoadingState = ({ message = 'Loading...', showSpinner = true }) => {
  return (
    <div className="loading-state">
      {showSpinner && <div className="spinner"></div>}
      <p>{message}</p>
    </div>
  );
};

export default LoadingState;