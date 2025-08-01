import React from 'react';
import { Navigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';

const ProtectedRoute = ({ children, requireMember = false, requireAdmin = false }) => {
  const { account, isMember, isAdmin, isLoadingUser } = useWeb3();

  // Still loading user info
  if (account && isLoadingUser) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p>Loading user information...</p>
      </div>
    );
  }

  // Not connected
  if (!account) {
    return <Navigate to="/" replace />;
  }

  // Require member
  if (requireMember && !isMember) {
    return <Navigate to="/" replace />;
  }

  // Require admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;