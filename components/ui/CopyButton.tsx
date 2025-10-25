
import React, { useState } from 'react';

interface CopyButtonProps {
  textToCopy: string;
}

const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const CheckmarkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;


export const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className={`btn-glass absolute top-3 right-3 flex items-center gap-2 text-xs font-semibold py-1 px-3 rounded-full border transition-all duration-300 ${
        copied
          ? 'bg-green-500/20 border-green-500/30 text-green-300'
          : 'bg-white/5 border-white/10 text-text-secondary'
      }`}
    >
      {copied ? <CheckmarkIcon /> : <CopyIcon />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};
