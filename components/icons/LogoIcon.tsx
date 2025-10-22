import React from 'react';

export const LogoIcon: React.FC<{large?: boolean}> = ({ large = false }) => {
    const size = large ? "100" : "48";
    const textY = large ? "58" : "30";
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
                <radialGradient id="ink-bleed-gradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#2563eb" /> 
                    <stop offset="60%" stopColor="#3b82f6" />
                    <stop offset="90%" stopColor="#60a5fa" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.1" />
                </radialGradient>
                <filter id="soft-blur" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
                </filter>
            </defs>
            
            <g>
                {/* Outer, hand-drawn like rings */}
                <circle cx="50" cy="50" r="48" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.6" />
                <path d="M 9,53 A 45 45 0 1 1 97,45" fill="none" stroke="#60a5fa" strokeWidth="0.75" opacity="0.7" />

                {/* Main ink bleed circle */}
                <circle cx="50" cy="50" r="42" fill="url(#ink-bleed-gradient)" filter="url(#soft-blur)" />

                {/* Darker ink spots */}
                <g opacity="0.8">
                    <circle cx="65" cy="28" r="5" fill="#1e3a8a" />
                    <circle cx="75" cy="35" r="3" fill="#1e3a8a" />
                    <circle cx="55" cy="24" r="4" fill="#1e3a8a" />
                    <circle cx="45" cy="25" r="3.5" fill="#1e3a8a" />
                    <circle cx="38" cy="32" r="2.5" fill="#1e3a8a" />
                    <circle cx="80" cy="45" r="4" fill="#1e3a8a" />
                    <circle cx="72" cy="29" r="2" fill="#1e3a8a" />
                </g>
                
                {/* Text "AI" */}
                <text 
                    x="50" 
                    y={textY}
                    fontFamily="Inter, sans-serif" 
                    fontSize={textSize}
                    fill="#E9ECF2" 
                    textAnchor="middle" 
                    fontWeight={textWeight}
                >
                    AI
                </text>
            </g>
        </svg>
    );
};
