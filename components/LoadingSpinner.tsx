import React, { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const cinematicMessages = [
    "Scouting digital locations...",
    "Calibrating the narrative lens...",
    "Warming up the render farm...",
    "The idea is taking shape...",
    "Assembling pixels into poetry...",
    "Consulting the AI muse...",
];

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  const [currentMessage, setCurrentMessage] = useState(message || "Generating script, outline, and reference images...");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage(prevMessage => {
        const currentIndex = cinematicMessages.indexOf(prevMessage);
        const nextIndex = (currentIndex + 1) % cinematicMessages.length;
        return cinematicMessages[nextIndex];
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const subText = 'This may take a moment, especially for the images.';

  return (
    <div className="flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm p-6 rounded-2xl border border-white/10 h-full min-h-[500px] animate-fade-in shadow-inner">
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 border-2 border-cyan-400/20 rounded-full animate-spin [animation-duration:4s]"></div>
        <div className="absolute inset-2 border-t-2 border-cyan-400 rounded-full animate-spin [animation-duration:2s]"></div>
         <div className="absolute inset-4 rounded-full bg-cyan-400/10 animate-pulse"></div>
      </div>
      <p className="mt-8 text-lg font-semibold text-gray-200 text-center transition-opacity duration-500">{currentMessage}</p>
      <p className="mt-1 text-sm text-gray-400">{subText}</p>
    </div>
  );
};