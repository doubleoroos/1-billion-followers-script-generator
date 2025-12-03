
import React from 'react';

interface EmptyStateStudioProps {
    message?: string;
    className?: string;
}

export const EmptyStateStudio: React.FC<EmptyStateStudioProps> = ({ message = "NO SIGNAL", className = "" }) => {
    return (
        <div className={`relative bg-black flex flex-col justify-center items-center overflow-hidden w-full h-full min-h-[200px] border border-white/5 rounded-sm ${className}`}>
            {/* CSS-only SVG Noise Pattern */}
            <div className="absolute inset-0 opacity-20" style={{
                 backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                 filter: 'contrast(150%) brightness(100%)',
            }}></div>
            {/* Scanlines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)50%,rgba(0,0,0,0.25)50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
            
            {/* Vignette */}
            <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,1)] pointer-events-none"></div>

            <span className="relative z-10 text-cyan-900 font-mono text-xs tracking-[0.3em] font-bold animate-pulse uppercase">
                {message}
            </span>
        </div>
    );
};
