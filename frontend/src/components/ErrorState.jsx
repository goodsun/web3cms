import React from 'react';
import './ErrorState.css';

const ErrorState = ({ 
  message = 'An error occurred', 
  onRetry,
  retryText = 'Try again' 
}) => {
  return (
    <div className="error-state">
      <p className="error-message">{message}</p>
      {onRetry && (
        <button className="error-retry-button" onClick={onRetry}>
          {retryText}
        </button>
      )}
    </div>
  );
};

export default ErrorState;