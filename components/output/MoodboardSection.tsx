
import React from 'react';
import type { ReferenceImage } from '../../types';

interface MoodboardSectionProps {
    images: ReferenceImage[];
}

export const MoodboardSection: React.FC<MoodboardSectionProps> = ({ images }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {images.map((image, idx) => (
            <div key={idx} className="panel-glass rounded-2xl overflow-hidden group">
                <div className="relative w-full aspect-square md:aspect-[4/3] overflow-hidden bg-slate-900">
                     <img 
                        src={image.imageUrl} 
                        alt={image.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60"></div>
                </div>
                <div className="p-5 border-t border-white/5">
                    <h4 className="font-bold text-white text-lg tracking-wide">{image.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Concept Art</p>
                </div>
            </div>
        ))}
    </div>
);
