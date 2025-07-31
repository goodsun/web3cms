import React from 'react';

const CopyIcon = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none"
    className={className}
    style={{ color }}
  >
    <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 2H10V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M2 2V10H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default CopyIcon;