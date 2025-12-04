import { GoogleGenAI, Modality } from "@google/genai";
import type { GeneratedAssets, ReferenceImage, EmotionalArcIntensity, VisualStyle, NarrativeTone, Character, ScriptBlock, Scene, RewriteTomorrowTheme } from '../types';

// Dynamic helper to ensure we always get a fresh instance with the latest key
const getAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set. Please select an API Key.");
    }
    return new GoogleGenAI({ apiKey });
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Processes a list of items in batches with optional progress callback.
 */
export async function processInBatches<T, R>(
    items: T[], 
    processItem: (item: T) => Promise<R>, 
    batchSize: number, 
    batchDelay: number = 0,
    onProgress?: (completed: number, total: number) => void
): Promise<R[]> {
    const results: R[] = [];
    let completed = 0;
    
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchPromises = batch.map(processItem);
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        completed += batch.length;
        if (onProgress) onProgress(completed, items.length);

        if (i + batchSize < items.length && batchDelay > 0) {
            await delay(batchDelay);
        }
    }
    return results;
}

// Robust JSON cleaner to handle AI conversational output
const cleanJson = (text: string): string => {
    if (!text) return '{}';
    let cleaned = text.trim();
    
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
    const matches = [...cleaned.matchAll(codeBlockRegex)];
    if (matches.length > 0) {
        cleaned = matches[0][1].trim();
    }
    
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    } else {
        console.warn("No valid JSON object found in response");
        return '{}';
    }
    
    cleaned = cleaned.replace(/,\s*}/g, '}');
    return cleaned;
};

// --- AUDIO UTILITIES ---

function writeWavHeader(sampleRate: number, numChannels: number, bitsPerSample: number, dataLength: number): Uint8Array {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');

  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); 
  view.setUint16(20, 1, true); 
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); 
  view.setUint16(32, numChannels * (bitsPerSample / 8), true); 
  view.setUint16(34, bitsPerSample, true);

  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  return new Uint8Array(buffer);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Wrapper for API calls with retry logic for 429/Quota errors
async function generateWithRetry<T>(operation: () => Promise<T>, retries = 3, initialDelay = 10000): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            const errorMessage = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
            const isQuotaError = errorMessage.includes('429') || errorMessage.includes('Quota') || errorMessage.includes('RESOURCE_EXHAUSTED') || error.status === 429 || error.code === 429;
            
            if (isQuotaError && i < retries - 1) {
                const delayTime = initialDelay * Math.pow(2, i); 
                console.warn(`Quota exceeded (429). Retrying in ${delayTime/1000}s...`, error);
                await delay(delayTime);
                continue;
            }
            throw error;
        }
    }
    throw new Error("Max retries exceeded");
}

export const generateScriptAudio = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
    return generateWithRetry(async () => {
        try {
            const ai = getAI();
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: voiceName },
                        },
                    },
                },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!base64Audio) {
                throw new Error("No audio data returned from model.");
            }

            const pcmData = base64ToUint8Array(base64Audio);
            const wavHeader = writeWavHeader(24000, 1, 16, pcmData.length);
            const wavFile = new Uint8Array(wavHeader.length + pcmData.length);
            wavFile.set(wavHeader);
            wavFile.set(pcmData, wavHeader.length);

            const blob = new Blob([wavFile], { type: 'audio/wav' });
            return URL.createObjectURL(blob);

        } catch (error) {
            console.error("Audio generation failed:", error);
            throw error;
        }
    }, 3, 10000); 
};

// --- CONTENT GENERATION HELPERS ---

const getThemeDescription = (theme: RewriteTomorrowTheme): string => {
    switch (theme) {
        case 'abundance': return "The film explores a post-scarcity future where AI and automated systems have eliminated poverty, allowing humanity to flourish.";
        case 'ascension': return "The film imagines humanity's next evolutionary step, where AI acts as a bridge to higher forms of consciousness.";
        case 'harmony': return "The film portrays a world in perfect balance, where AI helps humanity reintegrate with nature.";
        case 'enlightenment': return "The film tells a story of profound discovery, where AI helps unlock the deepest mysteries of the universe.";
        default: return "The film explores a positive, hopeful vision of the future.";
    }
};

const getIntensityDescription = (intensity: EmotionalArcIntensity): string => {
    switch (intensity) {
        case 'subtle': return "The emotional arc should be gentle and contemplative.";
        case 'intense': return "Design a powerful and dramatic emotional arc with high stakes.";
        default: return "Craft a balanced emotional journey with clear peaks and valleys.";
    }
};

const getVisualStyleDescription = (style: VisualStyle): string => {
    const baseStyle = (() => {
        switch (style) {
            case 'solarpunk': return "Solarpunk: eco-conscious, lush greenery, organic architecture, photorealistic.";
            case 'minimalist': return "Minimalist: clean, simple geometric forms, ample negative space, photorealistic.";
            case 'biomorphic': return "Biomorphic: fluid, organic, nature-inspired shapes, flowing and elegant, photorealistic.";
            case 'abstract': return "Abstract: non-representational, emotionally driven color and light, experiential.";
            default: return "Cinematic: dramatic lighting, grand scale, hyper-detailed textures, photorealistic.";
        }
    })();
    return `${baseStyle} + High-Fashion Aesthetic: subtle luxury details, editorial composition, Chanel-esque accessories, hyper-realistic skin textures.`;
}

const getNarrativeToneDescription = (tone: NarrativeTone): string => {
    switch (tone) {
        case 'philosophical': return "Philosophical: contemplative and profound.";
        case 'hopeful': return "Hopeful: inspiring, optimistic, and uplifting.";
        case 'intimate': return "Intimate: personal, gentle, and reflective.";
        default: return "Poetic: lyrical and evocative imagery.";
    }
}

// --- PROMPTS ---

const createCoreConceptPrompt = (theme: RewriteTomorrowTheme, intensity: EmotionalArcIntensity, visualStyle: VisualStyle, narrativeTone: NarrativeTone): string => {
    return `
You are an expert Senior Scriptwriter for the 1 Billion Followers Film Award.
Theme: ${getThemeDescription(theme)}
Tone: ${getNarrativeToneDescription(narrativeTone)}
Style: ${getVisualStyleDescription(visualStyle)}
Arc: ${getIntensityDescription(intensity)}

Goal: Create a concept for a 7-10 minute film that presents a positive, regenerative future.
Criteria:
- Strong World-Building: Cohesive, original, and hopeful.
- Ethical AI: Demonstrate how AI aids humanity (collaborator, not conqueror).
- Fashion & Aesthetic: Characters should feel modern, elegant, with subtle high-end details.

Task:
1. Logline (1 sentence, high concept)
2. Synopsis (1 paragraph, clear beginning-middle-end)
3. Characters (2-4 people). For each: Name, Role, Description (evocative, fashion-forward), VoicePreference ('Kore','Zephyr','Puck','Fenrir','Charon').

Output JSON format: { "logline": "...", "synopsis": "...", "characters": [{ "name": "...", "role": "...", "description": "...", "voicePreference": "..." }] }
`;
}

const createScriptPrompt = (theme: RewriteTomorrowTheme, intensity: EmotionalArcIntensity, narrativeTone: NarrativeTone, logline: string, synopsis: string, characters: Character[]): string => {
    const charList = characters.map(c => `${c.name} (${c.role}): ${c.description}`).join('\n');
    return `
You are a WGA Senior Screenwriter. Write a script for a 7-10 minute film for the 1 Billion Followers Competition.
Logline: ${logline}
Synopsis: ${synopsis}
Characters: 
${charList}

Tone: ${getNarrativeToneDescription(narrativeTone)}
Theme: Ethical AI, Positive Future, Human Agency.

Format Requirements:
- Professional Industry Standard: Scene Headings, Action Lines, Dialogue.
- Structure: Establish Normalcy -> Inciting Incident (Opportunity) -> Rising Action (Collaboration with AI) -> Climax -> Resolution.
- Dialogue: Natural, subtext-rich, no clichés.
- Narration: Poetic, philosophical, driving the theme.
- **IMPORTANT**: Use EXACT character names provided.

Output JSON format: { "script": [{ "type": "narration"|"dialogue", "content": "...", "characterName": "..." (if dialogue, MUST match provided character names) }] }
`;
};

const createVisualOutlinePrompt = (theme: RewriteTomorrowTheme, visualStyle: VisualStyle, synopsis: string, scriptText: string): string => {
    return `
You are a Senior Visual Director. Create a visual outline for this film script.
Style: ${getVisualStyleDescription(visualStyle)}
Synopsis: ${synopsis}
Script: ${scriptText}

For each scene, define:
1. Title (Unique, evocative, 2-5 words)
2. Location & Atmosphere
3. Description (Review content. Generate a concise, sensory-rich description. Focus on lighting, texture, and mood. Max 3 sentences.)
4. Video Prompt (Veo optimized: 10-second pacing, facial clarity, cinematic motion)
5. Image Prompt (Imagen 3 expert: 8k, photorealistic, Arri Alexa LF, fashion editorial aesthetic, anamorphic, cinematic lighting)
6. Pacing & Emotion (e.g., "Slow and melancholic")
7. Transition (Cinematic edits: Match cut, J-Cut, etc.)
8. Dependencies (Logical narrative flow IDs)
9. Key Visual Elements (Lighting, Props, Colors - Mention specific textures like silk, chrome, glass)

Output JSON format: { "visualOutline": [{ "id": "scene-1", "sceneNumber": 1, "title": "...", "location": "...", "timeOfDay": "...", "duration": "...", "atmosphere": "...", "charactersInScene": "...", "description": "...", "keyVisualElements": "...", "visuals": "...", "transition": "...", "pacingEmotion": "...", "videoPrompt": "...", "imagePrompt": "...", "dependsOn": ["scene-X"] }] }
`;
};

const createBTSPrompt = (theme: RewriteTomorrowTheme, visualStyle: VisualStyle, synopsis: string, outline: Scene[]): string => {
    return `
Write a "Behind The Scenes" doc for the film "${synopsis.substring(0, 30)}...".
Includes: 
- Director's Statement (Director: Roos van der Jagt, Date: December 3, 2025)
- Visual Approach (${visualStyle} + High Fashion Influence)
- AI Workflow (Phase | Tool)
- Ethical AI Usage (Explain how AI was used to amplify human creativity, not replace it)

Return raw Markdown.
`;
}

const createVideoPromptRefinementPrompt = (scene: Scene, visualStyle: VisualStyle): string => {
    return `
You are a world-class cinematographer and expert prompt engineer for Google Veo.
Task: Write a strictly cinematic, high-fidelity video generation prompt.

Context:
- Visual Style: ${visualStyle} (High-Fashion, Photorealistic)
- Scene Content: ${scene.description}
- Location: ${scene.location}
- Atmosphere: ${scene.atmosphere}

Prompt Requirements:
1.  **Camera Movement**: Precise terminology (Pan, Tilt, Dolly). Movement must be smooth and motivated.
2.  **Subject Focus**: "Clear facial features", "Expressive eyes", "Lip-sync ready framing".
3.  **Lighting & Physics**: Volumetric lighting, accurate physics (hair movement, fabric drape).
4.  **Style**: ${visualStyle} aesthetic.
5.  **Quality Keywords**: "4k, photorealistic, film grain, cinematic color grading, Arri Alexa".
6.  **Duration & Pacing**: MANDATORY: "Long continuous take (10 seconds)", "Slow motion (0.5x speed) for gravitas", "Stable composition".

Output:
A single, highly detailed paragraph. No introduction.
`;
}

const createImagePromptRefinementPrompt = (scene: Scene, visualStyle: VisualStyle): string => {
    return `
You are a world-class Director of Photography and AI Prompt Engineer (Imagen 3).
Task: Write a highly technical, photorealistic image generation prompt.

Scene Details:
- Subject: ${scene.description}
- Setting: ${scene.location}
- Mood: ${scene.atmosphere}
- Style: ${visualStyle}

Prompt Structure Requirements:
1.  **Aesthetic**: High-fashion editorial meets cinematic storytelling.
2.  **Medium**: "Cinematic film still", "Raw photo", "8k resolution".
3.  **Camera**: "Shot on Arri Alexa LF", "Panavision Primo 70mm Anamorphic", "f/1.8".
4.  **Details**: "Subtle luxury accessories (Chanel-esque)", "Detailed skin texture", "Haute couture elements".
5.  **Lighting**: "Chiaroscuro", "Rembrandt lighting", "Volumetric fog".
6.  **Negative Prompt Injection**: NO CGI, NO cartoon, NO 3D render, NO illustration.

Output: A single, comprehensive prompt string.
`;
}

const createTransitionRefinementPrompt = (currentScene: Scene, nextScene: Scene | undefined, visualStyle: VisualStyle): string => {
    return `
You are an award-winning Film Editor.
Task: Analyze the current scene's end and the next scene's beginning to suggest a more cinematic transition.

Visual Style: ${visualStyle}

[SCENE A - OUT]
Location: ${currentScene.location}
Action/Visuals: ${currentScene.description}
Key Elements: ${currentScene.keyVisualElements}

[SCENE B - IN]
Location: ${nextScene ? nextScene.location : 'End Credits'}
Action/Visuals: ${nextScene ? nextScene.description : 'Fade to Black'}

Analysis Requirements:
1. Identify the visual connection between Scene A's end and Scene B's start.
2. Determine the best editorial technique (Match Cut, J-Cut, L-Cut, Smash Cut, Whip Pan, Dissolve).
3. The transition must align with the "${visualStyle}" aesthetic.

Output:
Write ONLY the transition description. It must be concise, technical, and evocative.
Example: "Match cut from the circular drain to the spinning car wheel." or "J-Cut: The sound of the alarm begins before we cut to the busy street."
`;
}

const createTitleRefinementPrompt = (scene: Scene): string => {
    return `
You are a visionary film director. Review this scene's content and characters:
Description: ${scene.description}
Characters: ${scene.charactersInScene}
Location: ${scene.location}

Task: Generate a UNIQUE, EVOCATIVE, and CONCISE title (2-5 words).
Criteria:
- Capture the poetic essence of the scene.
- Align with a positive, regenerative future narrative.
- Use strong verbs or sensory nouns.
- Avoid generic titles like "Scene 1" or "The Beginning".

Output: Title string only. Do not include quotes.
`;
}

// --- API INTERACTION ---

const generateRawImage = async (prompt: string): Promise<string | null> => {
    let sanitizedPrompt = prompt.replace(/\b(child|children|kid|kids|toddler|baby)\b/gi, 'figure');
    sanitizedPrompt = sanitizedPrompt.replace(/\b(boy|girl)\b/gi, 'character');

    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: sanitizedPrompt,
        });

        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part && part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        return null;
    } catch (e) {
        console.error("Image generation failed:", e);
        return null;
    }
};

export const generateCreativeAssets = async (
    theme: RewriteTomorrowTheme,
    intensity: EmotionalArcIntensity,
    visualStyle: VisualStyle,
    narrativeTone: NarrativeTone
): Promise<GeneratedAssets> => {
    
    const ai = getAI();

    // 1. Core Concept
    const conceptPrompt = createCoreConceptPrompt(theme, intensity, visualStyle, narrativeTone);
    const conceptResp = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: conceptPrompt,
        config: { responseMimeType: 'application/json' }
    });
    const concept = JSON.parse(cleanJson(conceptResp.text || '{}'));
    
    // Safety check for characters
    const safeCharacters = Array.isArray(concept.characters) ? concept.characters : [];

    // 2. Script
    const scriptPrompt = createScriptPrompt(theme, intensity, narrativeTone, concept.logline || "A film about the future", concept.synopsis || "", safeCharacters);
    const scriptResp = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: scriptPrompt,
        config: { responseMimeType: 'application/json' }
    });
    const scriptData = JSON.parse(cleanJson(scriptResp.text || '{}'));
    const safeScript = Array.isArray(scriptData.script) ? scriptData.script : [];

    // 3. Visual Outline
    const scriptText = safeScript.map((b: any) => b.content).join('\n');
    const outlinePrompt = createVisualOutlinePrompt(theme, visualStyle, concept.synopsis || "", scriptText);
    const outlineResp = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: outlinePrompt,
        config: { responseMimeType: 'application/json' }
    });
    const outlineData = JSON.parse(cleanJson(outlineResp.text || '{}'));
    let safeOutline = Array.isArray(outlineData.visualOutline) ? outlineData.visualOutline : [];

    // 3a. PARALLEL PREVIEW IMAGE GENERATION (Ensure "pictures everywhere" immediately)
    // We start generating images for the outline scenes immediately so the user sees visuals.
    // We use Promise.all to let them run while we fetch BTS and Moodboard
    const outlineImagePromises = safeOutline.map(async (scene: Scene) => {
        try {
            const imagePrompt = scene.imagePrompt || `${scene.description} ${visualStyle} 8k cinematic photorealistic.`;
            const imageUrl = await generateRawImage(imagePrompt);
            return { ...scene, imageUrl: imageUrl || undefined };
        } catch (e) {
            return scene;
        }
    });

    // 4. BTS
    const btsPrompt = createBTSPrompt(theme, visualStyle, concept.synopsis || "", safeOutline);
    const btsPromise = ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: btsPrompt
    });

    // 5. Moodboard (Wait for results)
    const moodboardPrompts = [
        { title: "Cinematic Style", prompt: `Hyper-realistic film still, ${visualStyle}, 8k, Arri Alexa.` },
        { title: "The World", prompt: `Wide establishing shot, ${theme}, ${visualStyle}, 8k, photorealistic.` },
        { title: "Protagonist", prompt: `Cinematic portrait of ${safeCharacters[0]?.name || 'Hero'}, ${visualStyle}, 8k, detailed skin texture.` },
        { title: "Key Moment", prompt: `Dramatic film still, ${concept.logline || 'A futuristic scene'}, ${visualStyle}, 8k, volumetric lighting.` }
    ];

    const refImagesPromises = moodboardPrompts.map(async (item) => {
        const imageUrl = await generateRawImage(item.prompt);
        return {
            title: item.title,
            imageUrl: imageUrl || `https://placehold.co/600x600/1a1a2e/FFF?text=${encodeURIComponent(item.title)}`
        };
    });

    // Await all parallel tasks
    const [finalOutline, btsResp, refImages] = await Promise.all([
        Promise.all(outlineImagePromises),
        btsPromise,
        Promise.all(refImagesPromises)
    ]);

    // Post-processing Characters with Voices and IDs
    const voices = ['Kore', 'Fenrir', 'Puck', 'Zephyr', 'Charon'];
    const charactersWithVoices = safeCharacters.map((c: any, i: number) => ({
        ...c,
        id: `char-${i}`,
        voicePreference: (c.voicePreference && voices.includes(c.voicePreference)) 
            ? c.voicePreference 
            : voices[i % voices.length]
    }));
    
    // Improved Script Character Mapping
    const scriptWithIds = safeScript.map((block: any, i: number) => {
        let charId = undefined;
        let characterNameFallback = undefined;
        
        if (block.type === 'dialogue') {
            const charName = block.characterName;
            // Case-insensitive, trimmed match
            const found = charactersWithVoices.find((c: any) => c.name.trim().toLowerCase() === charName?.trim().toLowerCase());
            if (found) {
                charId = found.id;
            } else {
                characterNameFallback = charName; // Keep the raw name if no ID found to prevent "UNKNOWN"
            }
        }
        return { ...block, id: `block-${i}`, characterId: charId, characterNameFallback };
    });

    return {
        script: scriptWithIds,
        characters: charactersWithVoices,
        visualOutline: finalOutline,
        referenceImages: refImages,
        btsDocument: btsResp.text || "BTS Generation Failed"
    };
};

export const regenerateFullScript = async (
    theme: RewriteTomorrowTheme,
    intensity: EmotionalArcIntensity,
    tone: NarrativeTone,
    characters: Character[]
): Promise<ScriptBlock[]> => {
    const ai = getAI();
    // Reconstruct prompt with existing context to keep continuity
    const charList = characters.map(c => `${c.name} (${c.role}): ${c.description}`).join('\n');
    const prompt = `
You are a master screenwriter. Rewrite the script for a 7-10 minute film.
Theme: ${getThemeDescription(theme)}
Tone: ${getNarrativeToneDescription(tone)}
Arc: ${getIntensityDescription(intensity)}

Characters (Do not change names):
${charList}

Format Requirements:
- Scene Headings: INT. / EXT. LOC - DAY/NIGHT
- Dialogue: Natural, character-specific.
- Narration: Evocative.
- **IMPORTANT**: Use EXACT character names.

Output JSON format: { "script": [{ "type": "narration"|"dialogue", "content": "...", "characterName": "..." (if dialogue) }] }
`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    const data = JSON.parse(cleanJson(response.text || '{}'));
    const rawScript = Array.isArray(data.script) ? data.script : [];
    
    // Post-process IDs
    return rawScript.map((block: any, i: number) => {
        let charId = undefined;
        let characterNameFallback = undefined;
        
        if (block.type === 'dialogue') {
            const charName = block.characterName;
            const found = characters.find((c: any) => c.name.trim().toLowerCase() === charName?.trim().toLowerCase());
            if (found) {
                charId = found.id;
            } else {
                characterNameFallback = charName;
            }
        }
        return { ...block, id: `block-regen-${Date.now()}-${i}`, characterId: charId, characterNameFallback };
    });
};

export const generateVideoForScene = async (scene: Scene, signal?: AbortSignal): Promise<string> => {
    if (signal?.aborted) throw new Error('Operation aborted');
    const ai = getAI();

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: scene.videoPrompt || scene.description,
        config: { numberOfVideos: 1, resolution: '1080p', aspectRatio: '16:9' }
    });

    const startTime = Date.now();
    const TIMEOUT_MS = 300000; // 5 minutes timeout

    while (!operation.done) {
        if (signal?.aborted) throw new Error('Operation aborted');
        if (Date.now() - startTime > TIMEOUT_MS) throw new Error('Video generation timed out.');
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) throw new Error(`Video generation failed: ${operation.error.message}`);
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("No video URI returned.");

    // Note: The key is appended here, relying on process.env.API_KEY being up to date
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) throw new Error("Failed to download generated video.");
    const blob = await response.blob();
    return URL.createObjectURL(blob);
};

export const generateImageForScene = async (scene: Scene, visualStyle: VisualStyle): Promise<string> => {
    let prompt = scene.imagePrompt || `${scene.description} ${visualStyle} 8k cinematic photorealistic.`;
    return await generateRawImage(prompt) || '';
};

export const generateCharacterPortrait = async (character: Character, visualStyle: VisualStyle): Promise<string> => {
    const prompt = `
    Hyper-realistic cinematic portrait of ${character.name}, ${character.role}. 
    ${character.description}.
    Visual Style: ${visualStyle}, 8k resolution, detailed skin texture, dramatic lighting, shot on Arri Alexa.
    No text, no labels.
    `;
    return await generateRawImage(prompt) || '';
};

export const regenerateVideoPromptForScene = async (scene: Scene, visualStyle: VisualStyle): Promise<string> => {
    const ai = getAI();
    const prompt = createVideoPromptRefinementPrompt(scene, visualStyle);
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
    return response.text?.trim() || scene.description;
};

export const regenerateImagePromptForScene = async (scene: Scene, visualStyle: VisualStyle): Promise<string> => {
    const ai = getAI();
    const prompt = createImagePromptRefinementPrompt(scene, visualStyle);
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
    return response.text?.trim() || scene.description;
};

export const regenerateDescriptionForScene = async (scene: Scene, visualStyle: VisualStyle): Promise<string> => {
    const ai = getAI();
    const prompt = `
You are a visionary film director and atmospheric writer.
Task: Rewrite the description for this film scene to be highly evocative, sensory-rich, and cinematic.

Context:
- Current Description: ${scene.description}
- Characters in Scene: ${scene.charactersInScene}
- Visual Style: ${visualStyle}
- Location: ${scene.location}
- Atmosphere: ${scene.atmosphere}

Directives:
1. **Sensory Immersion**: Use specific language describing light, texture, sound, and temperature (e.g., "warm golden hour light," "hum of clean energy").
2. **Essence & Narrative**: Review the content and characters. Capture the essence of the scene.
3. **Positive Future**: Strictly align with a Protopian/Solarpunk narrative (harmony, abundance).
4. **Conciseness**: Keep it detailed but concise (2-3 powerful sentences).

Output: The raw description text only.
`;
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
    return response.text?.trim() || scene.description;
};

export const refineSceneTransitions = async (outline: Scene[], visualStyle: VisualStyle): Promise<{id: string, transition: string}[]> => {
    const pairs = outline.map((scene, i) => ({ current: scene, next: outline[i + 1] }));
    return processInBatches(pairs, async ({ current, next }) => {
        try {
            const ai = getAI();
            const prompt = createTransitionRefinementPrompt(current, next, visualStyle);
            const resp = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
            return { id: current.id, transition: resp.text?.trim() || "Cut to next." };
        } catch {
            return { id: current.id, transition: "Cut to next." };
        }
    }, 5, 200);
};

export const analyzeSceneDependencies = async (outline: Scene[]): Promise<{id: string, dependsOn: string[]}[]> => {
    // Process in batches of 10 to check logic
    const chunks: Scene[][] = [];
    for (let i = 0; i < outline.length; i += 10) {
        chunks.push(outline.slice(i, i + 10));
    }

    const allDependencies: {id: string, dependsOn: string[]}[] = [];

    for (const chunk of chunks) {
        const prompt = `
        Analyze the narrative flow of these scenes.
        Scenes: ${JSON.stringify(chunk.map(s => ({ id: s.id, title: s.title, description: s.description })))}

        Task: For each scene, identify the IDs of preceding scenes it logically depends on (direct continuation, consequence, or callback).
        Output JSON: { "dependencies": [{ "id": "scene-id", "dependsOn": ["prev-scene-id"] }] }
        `;

        try {
            const ai = getAI();
            const response = await ai.models.generateContent({
                 model: 'gemini-3-pro-preview',
                 contents: prompt,
                 config: { responseMimeType: 'application/json' }
            });
            const data = JSON.parse(cleanJson(response.text || '{}'));
            if (Array.isArray(data.dependencies)) {
                allDependencies.push(...data.dependencies);
            }
        } catch (e) {
            console.error("Dependency analysis failed for chunk", e);
        }
    }
    return allDependencies;
};

export const regenerateTitleForScene = async (scene: Scene): Promise<string> => {
    try {
        const ai = getAI();
        const prompt = createTitleRefinementPrompt(scene);
        const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
        return response.text?.trim() || scene.title;
    } catch {
        return scene.title;
    }
};

export const regenerateBTS = async (theme: RewriteTomorrowTheme, intensity: EmotionalArcIntensity, visualStyle: VisualStyle, narrativeTone: NarrativeTone, script: ScriptBlock[], characters: Character[], outline: Scene[]): Promise<string> => {
    const ai = getAI();
    const prompt = createBTSPrompt(theme, visualStyle, `Story about ${theme}`, outline);
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
    return response.text || "Failed to regenerate BTS.";
};