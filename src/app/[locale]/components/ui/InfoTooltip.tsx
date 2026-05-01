'use client';

import React from 'react';

interface InfoTooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: string;
  className?: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ 
  content, 
  position = 'bottom', 
  maxWidth = 'max-w-xs', 
  className = '' 
}) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-1';
      case 'bottom':
        return 'top-full right-0 mt-1';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-1';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-1';
      default:
        return 'top-full right-0 mt-1';
    }
  };

  return (
    <div className={`relative group inline-block ${className}`}>
      <svg 
        className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help transition-colors duration-200" 
        fill="currentColor" 
        viewBox="0 0 20 20"
        aria-label="Informação adicional"
      >
        <path 
          fillRule="evenodd" 
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" 
          clipRule="evenodd" 
        />
      </svg>
      <div 
        className={`absolute z-50 hidden group-hover:block bg-white text-black text-left text-xs rounded py-2 px-3 whitespace-normal shadow-lg border ${maxWidth} min-w-64 normal-case ${getPositionClasses()}`}
        role="tooltip"
      >
        {content}
      </div>
    </div>
  );
};

export default InfoTooltip; 