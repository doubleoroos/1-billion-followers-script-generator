import React, { useState, useEffect } from 'react';

export const StoryboardSection: React.FC<{ id: string, title: string; children: React.ReactNode, style?: React.CSSProperties }> = ({ id, title, children, style }) => (
    <section id={id} className="animate-fade-in-stagger opacity-0 pt-24 -mt-24" style={style}>
        <h2 className="text-3xl font-bold text-center mb-8 text-white tracking-wide border-b-2 border-violet-glow/20 pb-4">{title}</h2>
        {children}
    </section>
);


export const OutputNav: React.FC = () => {
    const [activeSection, setActiveSection] = useState('characters');
    
    useEffect(() => {
        const sections = ['characters', 'script', 'outline', 'moodboard', 'bts'];
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, { rootMargin: '-50% 0px -50% 0px' });

        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => {
            sections.forEach(id => {
                const el = document.getElementById(id);
                if (el) observer.unobserve(el);
            });
        };
    }, []);

    const navItems = [
        { id: 'characters', label: 'Characters' },
        { id: 'script', label: 'Script' },
        { id: 'outline', label: 'Visual Outline' },
        { id: 'moodboard', label: 'Moodboard' },
        { id: 'bts', label: 'BTS' },
    ];
    
    return (
        <nav className="sticky top-20 z-40 bg-blue-deep/60 backdrop-blur-xl border border-white/10 rounded-xl p-2 max-w-2xl mx-auto animate-fade-in-stagger" style={{ animationDelay: '100ms' }}>
            <div className="flex justify-center items-center gap-2 sm:gap-4">
                <span className="font-bold text-sm text-gray-300 hidden sm:block">Contents:</span>
                {navItems.map(item => (
                    <a 
                        key={item.id}
                        href={`#${item.id}`} 
                        onClick={(e) => {
                            e.preventDefault();
                            document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors duration-300 ${activeSection === item.id ? 'bg-violet-glow/20 text-white' : 'text-gray-400 hover:bg-white/10'}`}
                    >
                        {item.label}
                    </a>
                ))}
            </div>
        </nav>
    );
};
