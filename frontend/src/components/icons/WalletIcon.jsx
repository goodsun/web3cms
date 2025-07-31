const WalletIcon = ({ size = 20, className = '', color = 'currentColor' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 20 20" 
    fill="none"
    className={className}
  >
    <path 
      d="M16 6H4C2.89543 6 2 6.89543 2 8V14C2 15.1046 2.89543 16 4 16H16C17.1046 16 18 15.1046 18 14V8C18 6.89543 17.1046 6 16 6Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path 
      d="M15 10C15 10.5523 14.5523 11 14 11C13.4477 11 13 10.5523 13 10C13 9.44772 13.4477 9 14 9C14.5523 9 15 9.44772 15 10Z"
      fill={color}
    />
    <path 
      d="M5 6V5C5 3.89543 5.89543 3 7 3H15C16.1046 3 17 3.89543 17 5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default WalletIcon;