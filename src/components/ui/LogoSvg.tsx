import React from 'react';

interface LogoSvgProps {
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const LogoSvg: React.FC<LogoSvgProps> = ({ className, style, onClick }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    fill="none"
    className={className}
    style={style}
    onClick={onClick}
  >
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0%" stopColor="#1a2235"/>
        <stop offset="100%" stopColor="#0d1520"/>
      </linearGradient>
      <linearGradient id="arc" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f97316" stopOpacity="0"/>
        <stop offset="40%" stopColor="#f97316" stopOpacity="1"/>
        <stop offset="100%" stopColor="#fb923c" stopOpacity="0.3"/>
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect x="0" y="0" width="512" height="512" rx="112" ry="112" fill="url(#bg)"/>
    <rect x="3" y="3" width="506" height="506" rx="110" ry="110" fill="none" stroke="#f97316" strokeWidth="3" strokeOpacity="0.25"/>
    <path d="M 110 290 A 170 170 0 0 1 195 130" stroke="url(#arc)" strokeWidth="8" strokeLinecap="round" fill="none" filter="url(#glow)"/>
    <text x="258" y="320" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontSize="210" fontWeight="900" fill="#f97316" letterSpacing="-8">САУ</text>
    <text x="258" y="320" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontSize="210" fontWeight="900" fill="none" stroke="#fb923c" strokeWidth="1.5" strokeOpacity="0.4" letterSpacing="-8">САУ</text>
  </svg>
);

export default LogoSvg;
