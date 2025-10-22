import React from 'react';
import { LogoIcon } from './icons/LogoIcon';

interface HeaderProps {
  onStartOver: () => void;
  showStartOver: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onStartOver, showStartOver }) => {
  return (
    <header className="bg-blue-darker/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 animate-fade-in">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <LogoIcon />
          <div>
            <h1 className="text-xl font-bold text-white">
              <span className="bg-gradient-to-r from-violet-glow to-cyan-lum text-transparent bg-clip-text">Rewrite Tomorrow</span> Film Generator
            </h1>
            <p className="text-gray-400 text-sm mt-1 hidden sm:block">Crafting positive futures for the 7-10 minute film competition</p>
          </div>
        </div>
        {showStartOver && (
          <button
            onClick={onStartOver}
            className="flex items-center justify-center gap-2 bg-gray-700/50 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm border border-white/10 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-glow/80 focus:ring-offset-2 focus:ring-offset-blue-darker transform hover:scale-[1.02] active:scale-[0.98] animate-fade-in"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Start Over
          </button>
        )}
      </div>
    </header>
  );
};