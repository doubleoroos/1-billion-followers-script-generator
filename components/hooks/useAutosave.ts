
import { useState, useEffect, useRef, useCallback } from 'react';

export type SaveStatus = 'clean' | 'dirty' | 'saving' | 'saved';

export function useAutosave<T>({ onSave, delay = 1500 }: { onSave: (data: T) => void, delay?: number }) {
    const [status, setStatus] = useState<SaveStatus>('clean');
    const timeoutRef = useRef<number | null>(null);
    const dataRef = useRef<T | undefined>(undefined);
    const onSaveRef = useRef(onSave);
    onSaveRef.current = onSave;

    const save = useCallback((newData: T) => {
        dataRef.current = newData;
        if (status !== 'saving') setStatus('dirty');
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
            if (dataRef.current !== undefined) {
                setStatus('saving');
                try {
                    onSaveRef.current(dataRef.current);
                    setStatus('saved');
                } catch (error) {
                    console.error("Autosave failed:", error);
                    setStatus('dirty');
                }
            }
        }, delay);
    }, [delay, status]);

    useEffect(() => {
        let savedTimeout: number;
        if (status === 'saved') {
            savedTimeout = window.setTimeout(() => setStatus('clean'), 2000);
        }
        return () => clearTimeout(savedTimeout);
    }, [status]);
    
    useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

    return { status, save };
}
