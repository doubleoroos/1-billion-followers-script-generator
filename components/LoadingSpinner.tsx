import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  const loadingText = message || 'Generating script, outline, and reference images...';
  const subText = 'This may take a moment, especially for the images.';

  return (
    <div className="flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm p-6 rounded-2xl border border-white/10 h-full min-h-[500px] animate-fade-in shadow-inner">
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 border-2 border-cyan-400/20 rounded-full animate-spin [animation-duration:4s]"></div>
        <div className="absolute inset-2 border-t-2 border-cyan-400 rounded-full animate-spin [animation-duration:2s]"></div>
         <div className="absolute inset-4 rounded-full bg-cyan-400/10 animate-pulse"></div>
      </div>
      <p className="mt-8 text-lg font-semibold text-gray-200">{loadingText}</p>
      <p className="mt-1 text-sm text-gray-400">{subText}</p>
    </div>
  );
};