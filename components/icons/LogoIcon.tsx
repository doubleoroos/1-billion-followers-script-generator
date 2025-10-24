import React from 'react';

export const LogoIcon: React.FC<{large?: boolean}> = ({ large = false }) => {
    const size = large ? "100" : "48";
    const textY = large ? "62" : "32";
    const textSize = large ? "35" : "18";
    const textWeight = large ? "800" : "bold";

    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 100 100" 
            width={size} 
            height={size} 
            aria-hidden="true"
        >
            <defs>
                <radialGradient id="glass-orb-gradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#A7D9FF" />
                    <stop offset="100%" stopColor="#2A7DD4" />
                </radialGradient>
                <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            
            <g filter="url(#soft-glow)">
                <circle cx="50" cy="50" r="45" fill="url(#glass-orb-gradient)" />
                <circle cx="50" cy="50" r="48" fill="none" stroke="#A7D9FF" strokeWidth="1" opacity="0.5" />

                <text 
                    x="50" 
                    y={textY}
                    fontFamily="Inter, sans-serif" 
                    fontSize={textSize}
                    fill="#FFFFFF" 
                    textAnchor="middle" 
                    fontWeight={textWeight}
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                >
                    AI
                </text>
            </g>
        </svg>
    );
};
