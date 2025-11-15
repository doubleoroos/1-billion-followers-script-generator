import { useCallback } from 'react';

// Base64 encoded mysterious UI click sound. This is a short, clean WAV file.
const CLICK_SOUND_B64 = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAP//AgAABQAHAAgABQADAP//AAAA//8A//8A//8A//8A//8A//8A//8A//8A//8A//8A//8A//8A//8A/wACAAQABwAIABAAGwAfACIAJAAkACQAJAAmACgAKgAqACoAKgApACgAJwAlACIAIAAbABgAFAAQAAwACAADAP//AAAA//8A/wA=';

let audio: HTMLAudioElement | null = null;

const getAudio = () => {
    if (typeof window === 'undefined') {
        return null;
    }
    if (!audio) {
        audio = new Audio(CLICK_SOUND_B64);
        audio.volume = 0.4;
    }
    return audio;
};

export const useSound = () => {
    const playSound = useCallback(() => {
        const sound = getAudio();
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => {
                // Autoplay was prevented. This is a common browser restriction.
                // We can ignore this for UI sounds as they are user-initiated.
            });
        }
    }, []);

    return playSound;
};
