import React from 'react';
import { Link } from 'react-router-dom';

export const Logo = ({ size = 'md', link = true, light = false }) => {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-lg', sub: 'text-[10px]' },
    md: { icon: 'w-9 h-9', text: 'text-xl', sub: 'text-xs' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className="flex items-center gap-2.5 select-none group">
      <div className={`relative flex items-center justify-center ${currentSize.icon} rounded-xl bg-gradient-to-br from-burgundy-700 via-burgundy-900 to-burgundy-950 shadow-md shadow-burgundy-950/20 border border-burgundy-600/30 transition-transform group-hover:scale-105`}>
        {/* Custom SVG Shield + Document + Check Mark */}
        <svg viewBox="0 0 32 32" fill="none" className="w-5/6 h-5/6" xmlns="http://www.w3.org/2000/svg">
          {/* Shield Base */}
          <path d="M16 3L6 7V15C6 21.5 10.3 27.6 16 29C21.7 27.6 26 21.5 26 15V7L16 3Z" fill="#F4ECE0" fillOpacity="0.15" stroke="#FAF6ED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Document outline inside */}
          <path d="M11 11H21M11 15H17M11 19H19" stroke="#E0CCAB" strokeWidth="1.75" strokeLinecap="round"/>
          {/* Check mark badge */}
          <circle cx="21" cy="20" r="4.5" fill="#D1B487" />
          <path d="M19 20L20.5 21.5L23 18.5" stroke="#3D0711" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center font-bold tracking-tight">
          <span className={light ? 'text-cream-50' : 'text-burgundy-950'}>Clause</span>
          <span className="text-burgundy-700 font-extrabold">Guard</span>
          <span className="ml-1.5 px-1.5 py-0.2 text-[10px] uppercase font-extrabold tracking-wider rounded bg-burgundy-100 text-burgundy-800 border border-burgundy-200">AI</span>
        </div>
        <span className={`font-medium ${light ? 'text-cream-300' : 'text-burgundy-900/60'} ${currentSize.sub}`}>Legal Risk Intelligence</span>
      </div>
    </div>
  );

  return link ? <Link to="/" className="inline-block">{content}</Link> : content;
};
