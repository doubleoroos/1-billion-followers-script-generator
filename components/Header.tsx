import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">
            <span className="bg-gradient-to-r from-brand-cyan to-blue-500 text-transparent bg-clip-text">1BF</span> Script Generator
          </h1>
          <p className="text-gray-400 text-sm mt-1">AI-powered creativity for the 1 Billion Followers film competition</p>
        </div>
      </div>
    </header>
  );
};