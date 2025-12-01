
import React from 'react';
import type { ReferenceImage } from '../../types';

interface MoodboardSectionProps {
    images: ReferenceImage[];
}

export const MoodboardSection: React.FC<MoodboardSectionProps> = ({ images }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {images.map((image, idx) => (
            <div key={idx} className="bg-gunmetal border border-white/10 rounded-sm overflow-hidden group shadow-lg hover:border-cyan-500/30 transition-all duration-300">
                {/* Cinematic Anamorphic Aspect Ratio: 2.39:1 */}
                <div className="relative w-full aspect-[2.39/1] overflow-hidden bg-slate-950">
                     <img 
                        src={image.imageUrl} 
                        alt={image.title} 
                        className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105" 
                        loading="lazy"
                    />
                    {/* Letterbox / Vignette Effect */}
                    <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] pointer-events-none"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-60"></div>
                </div>
                
                <div className="p-4 border-t border-white/5 bg-gunmetal relative">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-display font-bold text-white text-lg tracking-wide uppercase">{image.title}</h4>
                            <p className="font-mono text-[9px] text-cyan-600 mt-1 uppercase tracking-[0.2em] font-bold">Film Still /// 8K Reference</p>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_#22d3ee] mt-2"></div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);