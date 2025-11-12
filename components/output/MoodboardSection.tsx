
import React from 'react';
import type { ReferenceImage } from '../../types';

interface MoodboardSectionProps {
    images: ReferenceImage[];
}

export const MoodboardSection: React.FC<MoodboardSectionProps> = ({ images }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {images.map(image => (
            <div key={image.title} className="panel-glass rounded-2xl overflow-hidden">
                <img src={image.imageUrl} alt={image.title} className="w-full h-auto object-cover aspect-video" />
                <div className="p-5">
                    <h4 className="font-bold text-text-primary text-lg">{image.title}</h4>
                </div>
            </div>
        ))}
    </div>
);