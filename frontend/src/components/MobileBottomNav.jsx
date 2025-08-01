import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useWeb3 } from "../contexts/Web3Context";
import {
  HomeIcon,
  HexagonIcon,
  CoinIcon,
  GiftIcon,
  SettingsIcon,
  UserIcon,
} from "./Icons";
import "./MobileBottomNav.css";

const MobileBottomNav = () => {
  const location = useLocation();
  const { account, currentUser } = useWeb3();

  const navItems = [
    { path: "/", icon: HomeIcon, label: "Home" },
    { path: "/nfts", icon: HexagonIcon, label: "NFTs" },
    { path: "/nfts/mint", icon: CoinIcon, label: "Mint" },
    { path: "/items", icon: GiftIcon, label: "Items" },
    { 
      path: "/settings", 
      icon: account ? UserIcon : SettingsIcon, 
      label: account ? "Profile" : "Settings",
      hasAvatar: account && currentUser?.avatar
    },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map(({ path, icon: Icon, label, hasAvatar }) => (
        <Link
          key={path}
          to={path}
          className={`nav-item ${location.pathname === path ? "active" : ""}`}
        >
          {hasAvatar ? (
            <div className="nav-icon-container">
              <img
                src={currentUser.avatar}
                alt={currentUser.name || "User avatar"}
                className="nav-avatar"
                onError={(e) => {
                  const fallbackIcon = e.target.parentNode.querySelector('.nav-fallback-icon');
                  e.target.style.display = 'none';
                  if (fallbackIcon) fallbackIcon.style.display = 'block';
                }}
              />
              <Icon size={24} className="nav-fallback-icon" style={{ display: 'none' }} />
            </div>
          ) : (
            <Icon size={24} />
          )}
          <span className="nav-label">{label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default MobileBottomNav;
