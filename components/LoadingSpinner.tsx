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
  const [currentMessage, setCurrentMessage] = useState(message || cinematicMessages[0]);

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

  const subText = 'This may take a moment, especially for images and video.';

  return (
    <div className="flex flex-col items-center justify-center bg-transparent h-full min-h-[60vh] animate-fade-in">
      <div className="relative h-24 w-24">
        <div className="absolute inset-0 border-2 border-violet-glow/20 rounded-full animate-spin [animation-duration:4s]"></div>
        <div className="absolute inset-3 border-t-2 border-violet-glow rounded-full animate-spin [animation-duration:2s]"></div>
         <div className="absolute inset-6 rounded-full bg-violet-glow/10 animate-pulse [animation-duration:2s]"></div>
      </div>
      <p className="mt-8 text-xl font-semibold text-gray-200 text-center transition-all duration-500 w-full">{currentMessage}</p>
      <p className="mt-2 text-sm text-gray-400">{subText}</p>
    </div>
  );
};