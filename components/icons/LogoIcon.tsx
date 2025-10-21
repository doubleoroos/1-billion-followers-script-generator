import React from 'react';

export const LogoIcon: React.FC<{large?: boolean}> = ({ large = false }) => {
    const size = large ? "100" : "48";
    const textY = large ? "57" : "30";
    const textSize = large ? "30" : "16";

    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 100 100" 
            width={size} 
            height={size} 
            aria-hidden="true"
        >
            <defs>
                <radialGradient id="logo-gradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#CDB7FF" />
                    <stop offset="100%" stopColor="#B6A1FF" />
                </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#logo-gradient)" className="opacity-20" />
            <path 
                d="M35,25 Q50,15 65,25 L65,75 Q50,85 35,75 Z" 
                fill="none" 
                stroke="#9EE9F7" 
                strokeWidth="3" 
                className="opacity-70"
            />
            <text 
                x="50" 
                y={textY}
                fontFamily="Inter, sans-serif" 
                fontSize={textSize}
                fill="#E9ECF2" 
                textAnchor="middle" 
                fontWeight="bold"
            >
                1B
            </text>
        </svg>
    )
};