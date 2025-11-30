import React, { useState, useEffect, useRef } from 'react';
import { useSound } from '../hooks/useSound';

export const StoryboardSection: React.FC<{ id: string, title: string; children: React.ReactNode, style?: React.CSSProperties }> = ({ id, title, children, style }) => (
    <section id={id} className="pt-24 -mt-24 mb-20 animate-fade-in" style={style}>
        <div className="flex items-center gap-4 mb-8">
            <div className="h-px bg-white/10 flex-grow"></div>
            <h2 className="font-display text-4xl font-bold uppercase tracking-widest text-white">{title}</h2>
            <div className="h-px bg-white/10 flex-grow"></div>
        </div>
        {children}
    </section>
);

export const OutputNav: React.FC = () => {
    const [activeSection, setActiveSection] = useState('characters');
    const playSound = useSound();

    const navItems = [
        { id: 'characters', label: 'CASTING' },
        { id: 'script', label: 'SCREENPLAY' },
        { id: 'outline', label: 'EDIT DECK' },
        { id: 'moodboard', label: 'VISUALS' },
        { id: 'bts', label: 'LOGS' },
    ];

    // Intersection Observer Logic (Simplified)
    // ...

    return (
        <nav className="fixed bottom-0 left-0 w-full z-40 bg-gunmetal border-t border-gold/30 shadow-2xl pb-safe">
            <div className="max-w-4xl mx-auto flex justify-around">
                {navItems.map(item => (
                    <a 
                        key={item.id}
                        href={`#${item.id}`} 
                        onClick={(e) => {
                            playSound();
                            e.preventDefault();
                            document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            setActiveSection(item.id);
                        }}
                        className={`group relative py-4 px-2 flex flex-col items-center justify-center transition-colors ${activeSection === item.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <span className="text-[10px] font-bold font-display uppercase tracking-widest">{item.label}</span>
                        {/* LED Active Indicator */}
                        <div className={`mt-1 w-1.5 h-1.5 rounded-full transition-colors ${activeSection === item.id ? 'bg-studio-red led-indicator' : 'bg-black'}`}></div>
                    </a>
                ))}
            </div>
        </nav>
    );
};