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
      <div className="relative h-24 w-24 flex items-center justify-center">
        <div className="absolute h-full w-full bg-violet-glow/20 rounded-full animate-pulse-orb [animation-delay:-1s]"></div>
        <div className="absolute h-3/4 w-3/4 bg-violet-glow/20 rounded-full animate-pulse-orb"></div>
        <div className="absolute h-1/2 w-1/2 bg-violet-glow/30 rounded-full"></div>
      </div>
      <p className="mt-8 text-xl font-semibold text-rose-gray text-center transition-all duration-500 w-full">{currentMessage}</p>
      <p className="mt-2 text-sm text-gray-400">{subText}</p>
    </div>
  );
};