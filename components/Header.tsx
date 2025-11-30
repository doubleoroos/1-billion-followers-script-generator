
import React from 'react';
import { LogoIcon } from './icons/LogoIcon';
import { useSound } from './hooks/useSound';

interface HeaderProps {
  onStartOver: () => void;
  showStartOver: boolean;
  onSupportClick?: () => void;
  onContactClick?: () => void;
}

const HeartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
    </svg>
);

export const Header: React.FC<HeaderProps> = ({ onStartOver, showStartOver, onSupportClick, onContactClick }) => {
  const playSound = useSound();

  const handleStartOverClick = () => {
    playSound();
    onStartOver();
  };

  const handleSupportClick = () => {
      playSound();
      if (onSupportClick) onSupportClick();
  };

  const handleContactClick = () => {
      playSound();
      if (onContactClick) onContactClick();
  };

  return (
    <header className="bg-slate-950/70 backdrop-blur-lg border-b border-transparent bg-clip-padding [border-image:linear-gradient(to_right,transparent,rgba(255,255,255,0.1),transparent)_1] sticky top-0 z-50 animate-fade-in">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <LogoIcon />
          <div>
            <h1 className="text-xl font-bold">
              <span className="bg-gradient-to-br from-white to-violet-300 bg-clip-text text-transparent">Rewrite Tomorrow</span>
              <span className="text-text-primary/80"> Film Generator</span>
            </h1>
            <p className="text-text-secondary text-sm mt-1 hidden sm:block">Crafting positive futures for the 7-10 minute film competition</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
             <button
                onClick={handleContactClick}
                className="hidden md:inline-block text-sm font-semibold text-slate-400 hover:text-white transition-colors mr-2"
             >
                Contact
             </button>

             <button
                onClick={handleSupportClick}
                className="hidden md:flex btn-glass items-center gap-2 text-xs font-bold py-2 px-4 rounded-full text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all"
            >
                <HeartIcon /> Support Earth Rising
            </button>
            
            {showStartOver && (
            <button
                onClick={handleStartOverClick}
                className="btn-glass flex items-center justify-center gap-2 text-text-primary font-semibold py-2 px-4 rounded-full animate-fade-in"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Start Over</span>
            </button>
            )}
        </div>
      </div>
    </header>
  );
};
