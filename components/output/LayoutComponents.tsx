import React, { useState, useEffect, useRef } from 'react';

export const StoryboardSection: React.FC<{ id: string, title: string; children: React.ReactNode, style?: React.CSSProperties }> = ({ id, title, children, style }) => (
    <section id={id} className="animate-fade-in-stagger opacity-0 pt-24 -mt-24" style={style}>
        <div className="text-center mb-10">
            <h2 className="text-4xl font-extrabold text-white tracking-wide">{title}</h2>
            <div className="mt-3 h-1 w-20 bg-gradient-to-r from-violet-glow to-cyan-lum rounded-full mx-auto"></div>
        </div>
        {children}
    </section>
);


export const OutputNav: React.FC = () => {
    const [activeSection, setActiveSection] = useState('characters');
    const [indicatorStyle, setIndicatorStyle] = useState({});
    const navRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<{[key: string]: HTMLAnchorElement | null}>({});

    const navItems = [
        { id: 'characters', label: 'Characters' },
        { id: 'script', label: 'Script' },
        { id: 'outline', label: 'Visual Outline' },
        { id: 'moodboard', label: 'Moodboard' },
        { id: 'bts', label: 'BTS' },
    ];

    useEffect(() => {
        const updateIndicator = (id: string) => {
            const item = itemRefs.current[id];
            const nav = navRef.current;
            if (item && nav) {
                const navRect = nav.getBoundingClientRect();
                const itemRect = item.getBoundingClientRect();
                setIndicatorStyle({
                    left: `${itemRect.left - navRect.left}px`,
                    width: `${itemRect.width}px`,
                });
            }
        };

        const sections = navItems.map(item => item.id);
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    setActiveSection(id);
                    updateIndicator(id);
                }
            });
        }, { rootMargin: '-40% 0px -60% 0px' });

        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        // Set initial position
        setTimeout(() => updateIndicator(activeSection), 100);

        return () => {
            sections.forEach(id => {
                const el = document.getElementById(id);
                if (el) observer.unobserve(el);
            });
        };
    }, [activeSection]);
    
    return (
        <nav className="sticky top-[70px] z-40 animate-fade-in-stagger" style={{ animationDelay: '100ms' }}>
            <div ref={navRef} className="relative w-full max-w-2xl mx-auto bg-black/20 backdrop-blur-lg border border-white/10 rounded-full p-2 flex justify-around items-center gap-2 sm:gap-4">
                 <div 
                    className="absolute h-[calc(100%-1rem)] bg-violet-glow/20 rounded-full transition-all duration-500 ease-in-out"
                    style={indicatorStyle}
                ></div>
                {navItems.map(item => (
                    <a 
                        key={item.id}
                        ref={el => itemRefs.current[item.id] = el}
                        href={`#${item.id}`} 
                        onClick={(e) => {
                            e.preventDefault();
                            document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className={`relative z-10 flex-1 text-center px-3 py-2 text-sm font-semibold rounded-full transition-colors duration-300 ${activeSection === item.id ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        {item.label}
                    </a>
                ))}
            </div>
        </nav>
    );
};