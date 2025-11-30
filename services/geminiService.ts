
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { GeneratedAssets, ReferenceImage, EmotionalArcIntensity, VisualStyle, NarrativeTone, Character, ScriptBlock, Scene, RewriteTomorrowTheme } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Processes a list of items in batches.
 */
export async function processInBatches<T, R>(items: T[], processItem: (item: T) => Promise<R>, batchSize: number, batchDelay: number = 0): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchPromises = batch.map(processItem);
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
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
    
    // 1. Extract content from Markdown code blocks first
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
    const matches = [...cleaned.matchAll(codeBlockRegex)];
    if (matches.length > 0) {
        // Use the content of the first code block found
        cleaned = matches[0][1].trim();
    }
    
    // 2. Remove any text before the first '{' and after the last '}'
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    } else {
        // If no braces found, return empty object string to prevent crash
        console.warn("No valid JSON object found in response");
        return '{}';
    }
    
    // 3. Simple cleanup of common issues (optional but helpful)
    cleaned = cleaned.replace(/,\s*}/g, '}'); // Remove trailing commas
    
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

export const generateScriptAudio = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
    try {
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
    switch (style) {
        case 'solarpunk': return "Solarpunk: eco-conscious, lush greenery, organic architecture, photorealistic.";
        case 'minimalist': return "Minimalist: clean, simple geometric forms, ample negative space, photorealistic.";
        case 'biomorphic': return "Biomorphic: fluid, organic, nature-inspired shapes, flowing and elegant, photorealistic.";
        case 'abstract': return "Abstract: non-representational, emotionally driven color and light, experiential.";
        default: return "Cinematic: dramatic lighting, grand scale, hyper-detailed textures, photorealistic.";
    }
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
You are an expert storyteller. Create a film concept for "Rewrite Tomorrow - Positive Future".
Theme: ${getThemeDescription(theme)}
Tone: ${getNarrativeToneDescription(narrativeTone)}
Style: ${getVisualStyleDescription(visualStyle)}
Arc: ${getIntensityDescription(intensity)}

Task:
1. Logline (1 sentence)
2. Synopsis (1 paragraph)
3. Characters (2-4 people). For each: Name, Role, Description (evocative), VoicePreference ('Kore','Zephyr','Puck','Fenrir','Charon').

Output JSON format: { "logline": "...", "synopsis": "...", "characters": [{ "name": "...", "role": "...", "description": "...", "voicePreference": "..." }] }
`;
}

const createScriptPrompt = (theme: RewriteTomorrowTheme, intensity: EmotionalArcIntensity, narrativeTone: NarrativeTone, logline: string, synopsis: string, characters: Character[]): string => {
    const charList = characters.map(c => `${c.name} (${c.role}): ${c.description}`).join('\n');
    return `
Write a script for a 7-10 minute film.
Logline: ${logline}
Synopsis: ${synopsis}
Characters: ${charList}
Tone: ${getNarrativeToneDescription(narrativeTone)}

Format Requirements:
- Scene Headings: INT. / EXT.
- Dialogue: Natural, character-specific.
- Narration: Evocative.

Output JSON format: { "script": [{ "type": "narration"|"dialogue", "content": "...", "characterName": "..." (if dialogue) }] }
`;
};

const createVisualOutlinePrompt = (theme: RewriteTomorrowTheme, visualStyle: VisualStyle, synopsis: string, fullScript: string): string => {
    return `
Create a visual outline for this film script.
Style: ${getVisualStyleDescription(visualStyle)}
Synopsis: ${synopsis}
Script: ${fullScript}

For each scene, define:
1. Title (Evocative, 2-5 words)
2. Location & Atmosphere
3. Description (Evocative, concise, sensory-rich (sight, sound, feeling). Capture the essence and positive narrative.)
4. Video Prompt (Veo, cinematic keywords, dynamic motion)
5. Image Prompt (Expert prompt for Imagen 3: 8k, photorealistic, Arri Alexa LF, anamorphic, cinematic lighting, ${visualStyle}, highly detailed texture, no text)
6. Pacing & Emotion

Output JSON format: { "visualOutline": [{ "id": "scene-1", "sceneNumber": 1, "title": "...", "location": "...", "timeOfDay": "...", "duration": "...", "atmosphere": "...", "charactersInScene": "...", "description": "...", "keyVisualElements": "...", "visuals": "...", "transition": "...", "pacingEmotion": "...", "videoPrompt": "...", "imagePrompt": "..." }] }
`;
};

const createBTSPrompt = (theme: RewriteTomorrowTheme, visualStyle: VisualStyle, synopsis: string, outline: Scene[]): string => {
    return `
Write a "Behind The Scenes" doc for the film "${synopsis.substring(0, 30)}...".
Includes: Director's Statement, Visual Approach (${visualStyle}), AI Workflow (Phase | Tool), and Ethical AI Usage.
Return raw Markdown.
`;
}

const createVideoPromptRefinementPrompt = (scene: Scene, visualStyle: VisualStyle): string => {
    return `
Write a Veo video generation prompt.
Style: ${visualStyle}
Scene: ${scene.description}
Location: ${scene.location}
Mood: ${scene.atmosphere}
Requirements: Cinematic shot, dynamic camera movement, lighting details, photorealistic, 4k.
Output: Single concise paragraph.
`;
}

const createImagePromptRefinementPrompt = (scene: Scene, visualStyle: VisualStyle): string => {
    return `
You are a world-class AI visual artist and Director of Photography.
Task: Create a highly technical, photorealistic Imagen 3 prompt for a film still.
Visual Style: ${visualStyle}
Scene Context: ${scene.description}
Location: ${scene.location}
Time/Mood: ${scene.timeOfDay}, ${scene.atmosphere}

Mandatory Specs (unless Abstract style):
- Medium: Raw Photo, Shot on Arri Alexa LF, Panavision Anamorphic Lenses.
- Quality: 8k resolution, hyper-realistic, highly detailed skin texture (if characters present), film grain (Kodak Vision3).
- Lighting: Volumetric lighting, rim light, cinematic chiaroscuro, high dynamic range.
- Atmosphere: Evocative, emotional, sensory-rich details.
- Composition: Rule of thirds, depth of field, bokeh.

Negative Prompts (Implicit):
- NO illustration, NO 3d render look, NO painting, NO cartoons, NO text, NO watermarks, NO distorted faces.

Output: A single, dense, comma-separated string of descriptive keywords.
`;
}

const createTransitionRefinementPrompt = (currentScene: Scene, nextScene: Scene | undefined, visualStyle: VisualStyle): string => {
    return `
Suggest a cinematic transition from Scene ${currentScene.sceneNumber} to ${nextScene ? 'Scene ' + nextScene.sceneNumber : 'End'}.
Style: ${visualStyle}
Output: Transition description string only.
`;
}

const createTitleRefinementPrompt = (scene: Scene): string => {
    return `
Review this film scene content and characters:
Description: ${scene.description}
Characters: ${scene.charactersInScene}

Task: Generate a unique, evocative, and concise title (2-5 words) that captures the essence and aligns with a positive future narrative.
Output: Title string only. Do not include quotes.
`;
}

// --- API INTERACTION ---

const generateRawImage = async (prompt: string): Promise<string | null> => {
    let sanitizedPrompt = prompt.replace(/\b(child|children|kid|kids|toddler|baby)\b/gi, 'figure');
    sanitizedPrompt = sanitizedPrompt.replace(/\b(boy|girl)\b/gi, 'character');

    try {
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
    const safeOutline = Array.isArray(outlineData.visualOutline) ? outlineData.visualOutline : [];

    // 4. BTS
    const btsPrompt = createBTSPrompt(theme, visualStyle, concept.synopsis || "", safeOutline);
    const btsResp = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: btsPrompt
    });

    // 5. Moodboard
    const moodboardPrompts = [
        { title: "Cinematic Style", prompt: `Hyper-realistic film still, ${visualStyle}, 8k, Arri Alexa.` },
        { title: "The World", prompt: `Wide establishing shot, ${theme}, ${visualStyle}, 8k, photorealistic.` },
        { title: "Protagonist", prompt: `Cinematic portrait of ${safeCharacters[0]?.name || 'Hero'}, ${visualStyle}, 8k, detailed skin texture.` },
        { title: "Key Moment", prompt: `Dramatic film still, ${concept.logline || 'A futuristic scene'}, ${visualStyle}, 8k, volumetric lighting.` }
    ];

    const refImages = await Promise.all(moodboardPrompts.map(async (item) => {
        const imageUrl = await generateRawImage(item.prompt);
        return {
            title: item.title,
            imageUrl: imageUrl || `https://placehold.co/600x600/1a1a2e/FFF?text=${encodeURIComponent(item.title)}`
        };
    }));

    // Post-processing
    const voices = ['Kore', 'Fenrir', 'Puck', 'Zephyr', 'Charon'];
    const charactersWithVoices = safeCharacters.map((c: any, i: number) => ({
        ...c,
        id: `char-${i}`,
        voicePreference: (c.voicePreference && voices.includes(c.voicePreference)) 
            ? c.voicePreference 
            : voices[i % voices.length]
    }));
    
    const scriptWithIds = safeScript.map((block: any, i: number) => {
        let charId = undefined;
        if (block.type === 'dialogue') {
            const charName = block.characterName;
            const found = charactersWithVoices.find((c: any) => c.name.toLowerCase() === charName?.toLowerCase());
            charId = found ? found.id : undefined;
        }
        return { ...block, id: `block-${i}`, characterId: charId };
    });

    return {
        script: scriptWithIds,
        characters: charactersWithVoices,
        visualOutline: safeOutline,
        referenceImages: refImages,
        btsDocument: btsResp.text || "BTS Generation Failed"
    };
};

export const generateVideoForScene = async (scene: Scene, signal?: AbortSignal): Promise<string> => {
    if (signal?.aborted) throw new Error('Operation aborted');

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: scene.videoPrompt || scene.description,
        config: { numberOfVideos: 1, resolution: '1080p', aspectRatio: '16:9' }
    });

    while (!operation.done) {
        if (signal?.aborted) throw new Error('Operation aborted');
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) throw new Error(`Video generation failed: ${operation.error.message}`);
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("No video URI returned.");

    const response = await fetch(`${downloadLink}&key=${API_KEY}`);
    if (!response.ok) throw new Error("Failed to download generated video.");
    const blob = await response.blob();
    return URL.createObjectURL(blob);
};

export const generateImageForScene = async (scene: Scene, visualStyle: VisualStyle): Promise<string> => {
    let prompt = scene.imagePrompt || `${scene.description} ${visualStyle} 8k cinematic photorealistic.`;
    return await generateRawImage(prompt) || '';
};

export const regenerateVideoPromptForScene = async (scene: Scene, visualStyle: VisualStyle): Promise<string> => {
    const prompt = createVideoPromptRefinementPrompt(scene, visualStyle);
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
    return response.text?.trim() || scene.description;
};

export const regenerateImagePromptForScene = async (scene: Scene, visualStyle: VisualStyle): Promise<string> => {
    const prompt = createImagePromptRefinementPrompt(scene, visualStyle);
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
    return response.text?.trim() || scene.description;
};

export const regenerateDescriptionForScene = async (scene: Scene, visualStyle: VisualStyle): Promise<string> => {
    const prompt = `
Rewrite the description for this film scene.
Current: ${scene.description}
Style: ${visualStyle}
Goal: Make it more evocative, concise, and sensory-rich. Align with a positive future narrative.
Output: Description string only.
`;
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
    return response.text?.trim() || scene.description;
};

export const refineSceneTransitions = async (outline: Scene[], visualStyle: VisualStyle): Promise<{id: string, transition: string}[]> => {
    const pairs = outline.map((scene, i) => ({ current: scene, next: outline[i + 1] }));
    return processInBatches(pairs, async ({ current, next }) => {
        try {
            const prompt = createTransitionRefinementPrompt(current, next, visualStyle);
            const resp = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
            return { id: current.id, transition: resp.text?.trim() || "Cut to next." };
        } catch {
            return { id: current.id, transition: "Cut to next." };
        }
    }, 5, 200);
};

export const regenerateTitleForScene = async (scene: Scene): Promise<string> => {
    try {
        const prompt = createTitleRefinementPrompt(scene);
        const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
        return response.text?.trim() || scene.title;
    } catch {
        return scene.title;
    }
};

export const regenerateBTS = async (theme: RewriteTomorrowTheme, intensity: EmotionalArcIntensity, visualStyle: VisualStyle, narrativeTone: NarrativeTone, script: ScriptBlock[], characters: Character[], outline: Scene[]): Promise<string> => {
    const prompt = createBTSPrompt(theme, visualStyle, `Story about ${theme}`, outline);
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
    return response.text || "Failed to regenerate BTS.";
};
