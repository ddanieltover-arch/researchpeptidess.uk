/**
 * Research Peptides UK — Official Brand Logo Component
 * Renders the circular emblem with concentric sky-blue ring,
 * circular brand typography, cyan nodes, and cobalt blue RP core.
 */

import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
  textClassName?: string;
  subtextClassName?: string;
  lightMode?: boolean; // For dark backgrounds
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textClassName = '',
  subtextClassName = '',
  lightMode = false,
}) => {
  // Determine pixel size for the icon badge
  let badgeSize = 40;
  if (typeof size === 'number') {
    badgeSize = size;
  } else {
    switch (size) {
      case 'sm':
        badgeSize = 32;
        break;
      case 'md':
        badgeSize = 42;
        break;
      case 'lg':
        badgeSize = 54;
        break;
      case 'xl':
        badgeSize = 72;
        break;
    }
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Exact Circular Badge Logo */}
      <div 
        style={{ width: badgeSize, height: badgeSize }}
        className="relative shrink-0 rounded-full flex items-center justify-center transition-transform hover:scale-105"
      >
        <svg 
          viewBox="0 0 512 512" 
          className="w-full h-full drop-shadow-xs"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <path id="top-arc-comp" d="M 64,256 A 192,192 0 0,1 448,256" fill="none" />
            <path id="bottom-arc-comp" d="M 448,256 A 192,192 0 0,1 64,256" fill="none" />
            <linearGradient id="ring-grad-comp" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#38BDF8" />
              <stop offset="100%" stop-color="#0284C7" />
            </linearGradient>
            <linearGradient id="rp-grad-comp" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#4F46E5" />
              <stop offset="50%" stop-color="#4353FF" />
              <stop offset="100%" stop-color="#2563EB" />
            </linearGradient>
          </defs>

          {/* Background disc */}
          <circle cx="256" cy="256" r="250" fill={lightMode ? '#0B132B' : '#FFFFFF'} stroke={lightMode ? '#1E293B' : '#E2E8F0'} strokeWidth="4" />

          {/* Outer Curved Text Ring */}
          <g fill={lightMode ? '#93C5FD' : '#4353FF'} fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontSize="35" fontWeight="800" letterSpacing="1">
            <text>
              <textPath href="#top-arc-comp" startOffset="50%" textAnchor="middle">
                Research Peptides UK
              </textPath>
            </text>
            <text>
              <textPath href="#bottom-arc-comp" startOffset="50%" textAnchor="middle">
                Research Peptides UK
              </textPath>
            </text>
          </g>

          {/* Left & Right Cyan Nodes */}
          <circle cx="56" cy="256" r="11" fill="#0284C7" stroke="#38BDF8" strokeWidth="4" />
          <circle cx="456" cy="256" r="11" fill="#0284C7" stroke="#38BDF8" strokeWidth="4" />

          {/* Inner Concentric Sky Blue Ring */}
          <circle cx="256" cy="256" r="146" fill="none" stroke="url(#ring-grad-comp)" strokeWidth="14" strokeLinecap="round" />

          {/* Central RP Emblem */}
          <text 
            x="256" 
            y="264" 
            fill="url(#rp-grad-comp)" 
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
            fontSize="144" 
            fontWeight="900" 
            letterSpacing="-2"
            textAnchor="middle" 
            dominantBaseline="central"
          >
            RP
          </text>
        </svg>
      </div>

      {/* Accompanying Wordmark & Typography */}
      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-mono font-extrabold tracking-tight leading-none uppercase ${
                lightMode ? 'text-white' : 'text-slate-900'
              } ${
                size === 'sm'
                  ? 'text-sm'
                  : size === 'lg'
                  ? 'text-xl'
                  : size === 'xl'
                  ? 'text-2xl'
                  : 'text-base'
              } ${textClassName}`}
            >
              Research Peptides <span className="text-[#4353FF] font-black">UK</span>
            </span>
          </div>
          <span
            className={`font-mono uppercase tracking-wider text-[10px] mt-0.5 ${
              lightMode ? 'text-sky-300/80' : 'text-slate-500'
            } ${subtextClassName}`}
          >
            Analytical &amp; In-Vitro Standards
          </span>
        </div>
      )}
    </div>
  );
};
