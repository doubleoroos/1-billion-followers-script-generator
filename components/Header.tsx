
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
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
    </svg>
);

export const Header: React.FC<HeaderProps> = ({ onStartOver, showStartOver, onSupportClick, onContactClick }) => {
  const playSound = useSound();

  return (
    <header className="bg-gunmetal border-b-2 border-gold sticky top-0 z-50 shadow-2xl">
      <div className="container mx-auto px-4 h-16 flex justify-between items-center">
        {/* Left: Branding */}
        <div className="flex items-center gap-4">
          <div className="bg-studio-black p-1.5 rounded border border-white/10">
            <LogoIcon />
          </div>
          <div className="flex flex-col">
            {/* Optically aligned items-baseline */}
            <div className="flex items-baseline gap-3">
                <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-white leading-none">
                Rewrite<span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-slate-400">Tomorrow</span>
                </h1>
                <div className="flex items-center gap-1.5 relative -top-[2px]"> {/* Nudged up for cap-height alignment */}
                    <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse led-indicator"></span>
                    <p className="text-[9px] font-mono text-cyan-600 uppercase tracking-[0.2em] font-bold">Studio Online</p>
                </div>
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-4">
             <button
                onClick={() => { playSound(); if(onContactClick) onContactClick(); }}
                className="text-xs font-bold font-display uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
             >
                Contact
             </button>

             <button
                onClick={() => { playSound(); if(onSupportClick) onSupportClick(); }}
                className="hidden md:flex items-center gap-2 text-xs font-bold font-display uppercase tracking-wider py-2 px-4 bg-gunmetal-light border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-all rounded-sm hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            >
                <HeartIcon /> Support Stichting Earth Rising
            </button>
            
            {showStartOver && (
            <button
                onClick={() => { playSound(); onStartOver(); }}
                className="btn-tactical flex items-center justify-center gap-2 py-2 px-4 rounded-sm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-studio-red" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                <span>Reset</span>
            </button>
            )}
        </div>
      </div>
    </header>
  );
};