import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/70 backdrop-blur-lg border-b border-gray-700/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold text-white">
          <span className="text-cyan-400">1BF</span> Script Generator
        </h1>
        <p className="text-gray-400 text-sm">Crafting scripts for the AI Film Award with Gemini</p>
      </div>
    </header>
  );
};