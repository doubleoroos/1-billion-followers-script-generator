import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  const loadingText = message || 'Generating script, outline, and reference images...';
  const subText = message ? 'Please wait.' : 'This may take a moment, especially for the images.';

  return (
    <div className="flex flex-col items-center justify-center bg-slate-800/50 p-6 rounded-xl border border-slate-700 h-full min-h-[200px]">
      <svg className="animate-spin h-10 w-10 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="mt-4 text-slate-300">{loadingText}</p>
      <p className="text-sm text-slate-400">{subText}</p>
    </div>
  );
};