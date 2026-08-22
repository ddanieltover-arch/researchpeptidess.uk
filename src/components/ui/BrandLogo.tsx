/**
 * Research Peptides UK — Brand Logo Component
 * Pixel-accurate representation of the official circular emblem
 * with concentric sky-blue ring, circular typography, and cobalt blue RP core.
 */

import React from 'react';

interface BrandLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'light',
  size = 'md',
  showTagline = true,
  className = '',
}) => {
  const isDark = variant === 'dark';

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-13 h-13',
    xl: 'w-16 h-16',
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
    xl: 'text-2xl sm:text-3xl',
  };

  const subSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  return (
    <div className={`flex items-center gap-3 select-none group ${className}`}>
      {/* Official Circular Logo Badge */}
      <div
        className={`${iconSizes[size]} relative shrink-0 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105 drop-shadow-xs`}
      >
        <svg
          viewBox="0 0 512 512"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <path id="brand-top-arc" d="M 64,256 A 192,192 0 0,1 448,256" fill="none" />
            <path id="brand-bottom-arc" d="M 448,256 A 192,192 0 0,1 64,256" fill="none" />
            <linearGradient id="brand-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="brand-rp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="50%" stopColor="#4353FF" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>

          {/* Disc background */}
          <circle
            cx="256"
            cy="256"
            r="250"
            fill={isDark ? '#0B132B' : '#FFFFFF'}
            stroke={isDark ? '#1E293B' : '#E2E8F0'}
            strokeWidth="4"
          />

          {/* Outer Text Ring */}
          <g
            fill={isDark ? '#93C5FD' : '#4353FF'}
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontSize="35"
            fontWeight="800"
            letterSpacing="1.2"
          >
            <text>
              <textPath href="#brand-top-arc" startOffset="50%" textAnchor="middle">
                Research Peptides UK
              </textPath>
            </text>
            <text>
              <textPath href="#brand-bottom-arc" startOffset="50%" textAnchor="middle">
                Research Peptides UK
              </textPath>
            </text>
          </g>

          {/* Left & Right Cyan Nodes */}
          <circle cx="56" cy="256" r="11" fill="#0284C7" stroke="#38BDF8" strokeWidth="4" />
          <circle cx="456" cy="256" r="11" fill="#0284C7" stroke="#38BDF8" strokeWidth="4" />

          {/* Inner Concentric Sky Blue Ring */}
          <circle
            cx="256"
            cy="256"
            r="146"
            fill="none"
            stroke="url(#brand-ring-grad)"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Central RP Emblem */}
          <text
            x="256"
            y="264"
            fill="url(#brand-rp-grad)"
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

      {/* Brand Typography */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-black tracking-tight uppercase leading-none font-mono ${titleSizes[size]} ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            RESEARCH PEPTIDES <span className="text-[#4353FF] font-black">UK</span>
          </span>
        </div>

        {showTagline && (
          <div className="flex items-center gap-2 mt-1">
            <span className={`font-bold uppercase tracking-wider text-[#0EA5E9] ${subSizes[size]}`}>
              HPLC Certified Standards
            </span>
            <span className="text-slate-300 text-[10px]">•</span>
            <span className={`font-mono text-slate-400 uppercase tracking-widest ${subSizes[size]}`}>
              &gt; 99% PURITY
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
