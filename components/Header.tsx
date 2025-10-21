import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold text-cyan-400">1 Billion Followers Script Generator</h1>
        <p className="text-slate-400">Crafting scripts for the AI Film Award with Gemini</p>
      </div>
    </header>
  );
};