import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  const loadingText = message || 'Generating script, outline, and reference images...';
  const subText = 'This may take a moment, especially for the images.';

  return (
    <div className="flex flex-col items-center justify-center bg-gray-900/30 p-6 rounded-2xl border border-white/10 h-full min-h-[500px] animate-fade-in">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 border-4 border-cyan-400/20 rounded-full"></div>
        <div className="absolute inset-0 border-t-4 border-cyan-400 rounded-full animate-spin"></div>
      </div>
      <p className="mt-6 text-lg font-semibold text-gray-200">{loadingText}</p>
      <p className="mt-1 text-sm text-gray-400">{subText}</p>
    </div>
  );
};