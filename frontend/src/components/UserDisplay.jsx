import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../services/api';
import './UserDisplay.css';

const UserDisplay = ({ address, linkToProfile = true, showAddress = true, size = 'medium', linkType = 'owner' }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        const userData = await userService.getCurrentUser(address);
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [address]);

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (loading) {
    return <span className={`user-display loading ${size}`}>Loading...</span>;
  }

  const content = (
    <span className={`user-display ${size}`}>
      {user?.avatar && (
        <img 
          src={user.avatar} 
          alt={user.name || 'User avatar'} 
          className="user-avatar"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      <span className="user-info">
        {user?.name || (showAddress ? formatAddress(address) : 'Unknown')}
      </span>
    </span>
  );

  if (linkToProfile && address) {
    const linkPath = linkType === 'creator' ? `/nfts/creator/${address}` : `/nfts/owner/${address}`;
    return (
      <Link to={linkPath} className="user-display-link">
        {content}
      </Link>
    );
  }

  return content;
};

export default UserDisplay;