
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

// --- AUDIO UTILITIES ---

// Helper to write a WAV header for raw PCM data
function writeWavHeader(sampleRate: number, numChannels: number, bitsPerSample: number, dataLength: number): Uint8Array {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // ByteRate
  view.setUint16(32, numChannels * (bitsPerSample / 8), true); // BlockAlign
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
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

        // Convert Base64 PCM to WAV Blob URL
        const pcmData = base64ToUint8Array(base64Audio);
        // Gemini TTS typically returns 24kHz mono PCM
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
        case 'abundance': return "The film explores a post-scarcity future where AI and automated systems have eliminated poverty and resource conflict, allowing humanity to flourish in a world of shared prosperity and boundless opportunity.";
        case 'ascension': return "The film imagines humanity's next evolutionary step, where AI acts as a bridge to higher forms of consciousness, transcending physical limitations and exploring new realms of existence.";
        case 'harmony': return "The film portrays a world in perfect balance, where AI helps humanity reintegrate with nature, creating a global ecosystem where technology, people, and the planet thrive in symbiotic unity.";
        case 'enlightenment': return "The film tells a story of profound discovery, where AI helps unlock the deepest mysteries of the universe and the human mind, guiding society into a new age of wisdom, compassion, and universal understanding.";
        default: return "The film explores a positive, hopeful vision of the future, shaped by a thoughtful partnership between humanity and artificial intelligence.";
    }
};

const getIntensityDescription = (intensity: EmotionalArcIntensity): string => {
    switch (intensity) {
        case 'subtle': return "The emotional arc should be gentle and contemplative, building slowly with a quiet, introspective tone. Focus on nuanced feelings and gradual shifts in mood.";
        case 'intense': return "Design a powerful and dramatic emotional arc. Use stark contrasts, build to moments of profound emotional weight, and aim for a climactic, cathartic release.";
        default: return "Craft a balanced emotional journey with clear peaks and valleys, moving from curiosity to tension, and finally to a hopeful resolution.";
    }
};

const getVisualStyleDescription = (style: VisualStyle): string => {
    switch (style) {
        case 'solarpunk': return "The visual style is Solarpunk: optimistic, eco-conscious, and technologically advanced, featuring lush greenery integrated with elegant, organic architecture and a focus on community and nature.";
        case 'minimalist': return "The visual style is Minimalist: clean, abstract, and symbolic. It uses simple geometric forms, a limited color palette, and ample negative space to convey complex ideas with clarity and focus.";
        case 'biomorphic': return "The visual style is Biomorphic: fluid, organic, and abstract shapes inspired by the curves and patterns found in nature. The aesthetic is flowing, elegant, and interconnected.";
        case 'abstract': return "The visual style is Abstract: non-representational and emotionally driven. It uses color, light, shape, and texture to create a visceral experience and explore inner landscapes of feeling and thought, rather than depicting external reality.";
        default: return "The visual style is highly Cinematic and Photorealistic: emotionally resonant, with dramatic lighting, a grand sense of scale, and hyper-detailed textures to create a deeply immersive experience.";
    }
}

const getNarrativeToneDescription = (tone: NarrativeTone): string => {
    switch (tone) {
        case 'philosophical': return "The narrative tone is Philosophical: contemplative and profound, exploring deep questions about humanity, consciousness, and the nature of ideas.";
        case 'hopeful': return "The narrative tone is Hopeful: inspiring, optimistic, and uplifting, focusing on the potential for positive change and collective action.";
        case 'intimate': return "The narrative tone is Intimate: personal, gentle, and reflective, as if sharing a quiet, profound secret with the viewer.";
        default: return "The narrative tone is Poetic: lyrical and evocative, using rich metaphors and imagery to convey emotion and meaning rather than literal description.";
    }
}

// --- PROMPT CREATORS ---

const createCoreConceptPrompt = (theme: RewriteTomorrowTheme, intensity: EmotionalArcIntensity, visualStyle: VisualStyle, narrativeTone: NarrativeTone): string => {
    const themeDescription = getThemeDescription(theme);
    const intensityDescription = getIntensityDescription(intensity);
    const styleDescription = getVisualStyleDescription(visualStyle);
    const toneDescription = getNarrativeToneDescription(narrativeTone);

    return `
You are an expert storyteller and screenwriter creating the foundational concept for a film submission to the "1 Billion Summit AI Film Award".

**Competition Theme:** "Rewrite Tomorrow - Stories imagining the future with a positive twist."
**Film Length:** 7 to 10 minutes.
**Storytelling Mandate:** The film must tell a cohesive and emotionally resonant story with a clear narrative structure, character development, and a sense of conflict, tension, and resolution.

**Your Assigned Focus:**
- **Core Concept:** ${themeDescription}

**Creative Direction:**
- **Narrative Tone:** ${toneDescription}
- **Visual Style:** ${styleDescription}
- **Emotional Arc:** ${intensityDescription}

**Creative Synthesis:** Weave these creative directions into a single, cohesive vision. The film's cinematic language (${styleDescription}) must be the primary vehicle for its message (${toneDescription}) and emotional journey (${intensityDescription}). The result should feel intentional and unified.

**Your Task:**
Generate the core creative concept for this film.

1.  **Logline:** Write a compelling, one-sentence summary of the film's central conflict and story.
2.  **Synopsis:** Write a concise, one-paragraph synopsis that outlines the film's plot from beginning to end, including the main character's journey and the central theme.
3.  **Characters:** Create 2-4 compelling characters who will drive the story. For each character, provide a name, a brief, one-sentence description of their essence, and a specific role (e.g., 'Protagonist', 'Mentor').

**Output Format:**
Return a single, valid JSON object with three keys: "logline", "synopsis", and "characters".
- "characters" must be an array of objects, each with "name", "description", and "role" keys.
`;
}

const createScriptPrompt = (theme: RewriteTomorrowTheme, intensity: EmotionalArcIntensity, narrativeTone: NarrativeTone, logline: string, synopsis: string, characters: Character[]): string => {
    const intensityDescription = getIntensityDescription(intensity);
    const toneDescription = getNarrativeToneDescription(narrativeTone);
    const characterDescriptions = characters.map(c => `- ${c.name} (${c.role}): ${c.description}`).join('\n');

    return `
You are an expert screenwriter tasked with writing a complete script for a film submission to the "1 Billion Summit AI Film Award".

**Competition Theme:** "Rewrite Tomorrow - Stories imagining the future with a positive twist."
**Film Length:** 7 to 10 minutes.

**Creative Foundation (already decided):**
- **Logline:** ${logline}
- **Synopsis:** ${synopsis}
- **Characters:**
${characterDescriptions}

**Creative Direction:**
- **Narrative Tone:** ${toneDescription}
- **Emotional Arc:** ${intensityDescription}

**Creative Synthesis:** Ensure the script is a masterclass in showing, not telling. The dialogue and narration must embody the ${toneDescription}. The pacing of scenes and the subtext within the dialogue must meticulously build towards the ${intensityDescription}.

**Your Task:**
Write a detailed narration and dialogue-driven script guided by the specified **Narrative Tone**. The script must be substantial enough for a **7-10 minute film**. 
- It must follow a complete narrative arc (beginning, middle, end) based on the synopsis.
- It must feature clear character development, conflict, and resolution, aligning with the requested **Emotional Arc**.
- Structure the output as a sequence of script blocks. Each block can be either 'narration' or 'dialogue'. 
- For dialogue blocks, you MUST assign a "characterName" from the provided character list.

**Output Format:**
Return a single, valid JSON object with a single key: "script".
- "script" must be an array of objects. Each object must have:
    - a "type" key ('narration' or 'dialogue').
    - a "content" key with the text for that block.
    - if the type is 'dialogue', it must also have a "characterName" key matching a name from the character list.
`;
};

const createVisualOutlinePrompt = (theme: RewriteTomorrowTheme, visualStyle: VisualStyle, synopsis: string, fullScript: string): string => {
    const styleDescription = getVisualStyleDescription(visualStyle);
    
    return `
You are an expert film director and concept artist creating a visual outline for a "1 Billion Summit AI Film Award" submission.

**Competition Theme:** "Rewrite Tomorrow"
**Film Length:** 7-10 minutes.

**Creative Foundation (already decided):**
- **Synopsis:** ${synopsis}
- **Visual Style:** ${styleDescription}

**Script Context:**
${fullScript}

**Your Task:**
Break the script down into a sequence of scenes. For each scene, define the visual and cinematic elements.
1. **Scene Title:** Create a concise, descriptive title for the scene (e.g., "The Solar Harvest", "Reunion at the Hub"). It must reflect the positive future narrative.
2. **Location & Atmosphere:** Describe the setting and the mood (e.g., lighting, weather, feeling).
3. **Action & Visuals:** Describe what happens and what we see. Focus on imagery.
4. **Cinematography:** Suggest a specific camera angle or movement (e.g., "Wide drone shot", "Close-up on eyes").
5. **Prompts:** Create distinct, detailed prompts for generating the visual assets (Video and Image).

**Output Format:**
Return a single, valid JSON object with a single key: "visualOutline".
- "visualOutline" must be an array of objects.
- Each object must have the following keys:
    - "id" (unique string, e.g., "scene-1")
    - "sceneNumber" (number)
    - "title" (string)
    - "location" (string)
    - "timeOfDay" (string)
    - "duration" (estimated string, e.g., "45s")
    - "atmosphere" (string)
    - "charactersInScene" (string, names comma-separated)
    - "description" (string, the action)
    - "keyVisualElements" (string, specific details to capture)
    - "visuals" (string, description of the shot composition)
    - "transition" (string, edit to next scene)
    - "pacingEmotion" (string)
    - "videoPrompt" (string, optimized for Veo)
    - "imagePrompt" (string, optimized for Imagen)
`;
};

const createBTSPrompt = (theme: RewriteTomorrowTheme, visualStyle: VisualStyle, synopsis: string, outline: Scene[]): string => {
    return `
You are the Director and Producer of the film "${synopsis.substring(0, 30)}...". Write a "Behind The Scenes" document for the competition submission.

**Constraint:** The document MUST include a section titled "Workflow" that strictly follows the format "Phase | Tool(s)" for each step of the creation process.
**Models Used:** Gemini 3 Pro (Script/Concept), Veo (Video), Imagen 3 (Images), Gemini 2.5 Flash (TTS/Music).

**Content to Cover:**
1. **Director's Statement:** Why this story? How does it fit "Rewrite Tomorrow"?
2. **Visual Approach:** Explain the "${visualStyle}" choice.
3. **AI Workflow:** How were the tools used? (Remember the strict format).

**Output Format:**
Return a raw string (Markdown formatted).
`;
}

const createVideoPromptRefinementPrompt = (scene: Scene, visualStyle: VisualStyle): string => {
    const styleDescription = getVisualStyleDescription(visualStyle);
    return `
You are an expert cinematographer and prompt engineer for Google's **Veo** video generation model.
**Goal:** Create a hyper-realistic, cinematic 1080p video clip that visually captures the essence of the scene.

**Scene Context:**
- **Action:** ${scene.description}
- **Atmosphere:** ${scene.atmosphere}
- **Location:** ${scene.location}
- **Time:** ${scene.timeOfDay}

**Visual Style:** ${styleDescription}

**Task:**
Write a refined, evocative video generation prompt.
- **Focus on:** Cinematic lighting (e.g., chiaroscuro, golden hour, neon), camera movement (e.g., slow dolly, handheld, aerial), and realistic textures.
- **Structure:** [Subject/Action], [Environment], [Lighting/Mood], [Camera Movement], [Style keywords].
- **Constraint:** Keep it under 70 words. optimize for Veo's motion understanding.
- **Tone:** ${scene.pacingEmotion || 'neutral'}

**Output:** Return ONLY the refined prompt text.
`;
}

const createImagePromptRefinementPrompt = (scene: Scene, visualStyle: VisualStyle): string => {
    const styleDescription = getVisualStyleDescription(visualStyle);
    return `
Refine the following image prompt for Google's **Imagen** model.
**Goal:** Create a hyper-realistic, high-resolution concept art piece.
**Visual Style:** ${styleDescription}
**Scene Context:** ${scene.description}
**Current Prompt:** ${scene.imagePrompt || scene.description}

**Instructions:**
- Focus on composition, texture, lighting, and color palette.
- Mention specific camera lenses or artistic references if applicable to the style.
- Ensure it is safe and suitable for a general audience.
- Safe Prompting: Avoid generating images of children in realistic settings to prevent safety filter triggers. Use "figures", "silhouettes", or "characters" if age is ambiguous.

**Output:** Return ONLY the refined prompt string.
`;
}

const createTransitionRefinementPrompt = (currentScene: Scene, nextScene: Scene | undefined, visualStyle: VisualStyle): string => {
    return `
Suggest a cinematic transition from Scene ${currentScene.sceneNumber} (${currentScene.location}) to ${nextScene ? `Scene ${nextScene.sceneNumber} (${nextScene.location})` : 'End Credits'}.
**Style:** ${visualStyle}
**Current Action:** ${currentScene.description}
**Next Action:** ${nextScene ? nextScene.description : 'Fade out'}

**Output:** Return ONLY the transition description (e.g., "Match cut on the rising sun...").
`;
}

// --- API INTERACTION ---

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
    const concept = JSON.parse(conceptResp.text || '{}');
    
    // 2. Script
    const scriptPrompt = createScriptPrompt(theme, intensity, narrativeTone, concept.logline, concept.synopsis, concept.characters);
    const scriptResp = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: scriptPrompt,
        config: { responseMimeType: 'application/json' }
    });
    const scriptData = JSON.parse(scriptResp.text || '{}');

    // 3. Visual Outline
    const scriptText = scriptData.script.map((b: any) => b.content).join('\n');
    const outlinePrompt = createVisualOutlinePrompt(theme, visualStyle, concept.synopsis, scriptText);
    const outlineResp = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: outlinePrompt,
        config: { responseMimeType: 'application/json' }
    });
    const outlineData = JSON.parse(outlineResp.text || '{}');

    // 4. BTS
    const btsPrompt = createBTSPrompt(theme, visualStyle, concept.synopsis, outlineData.visualOutline);
    const btsResp = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: btsPrompt
    });

    // 5. Reference Images (Simple placeholder generation for moodboard based on style)
    const refImages: ReferenceImage[] = [
        { title: "Visual Style Reference", imageUrl: "https://placehold.co/600x400/1a1a2e/FFF?text=Style+Ref" },
        { title: "Key Location Atmosphere", imageUrl: "https://placehold.co/600x400/16213e/FFF?text=Location+Ref" },
        { title: "Character Concept", imageUrl: "https://placehold.co/600x400/0f3460/FFF?text=Character+Ref" },
        { title: "Lighting Reference", imageUrl: "https://placehold.co/600x400/533483/FFF?text=Lighting+Ref" }
    ];

    // Assign voices to characters roughly
    const voices = ['Kore', 'Fenrir', 'Puck', 'Zephyr', 'Charon'];
    const charactersWithVoices = (concept.characters as Character[]).map((c, i) => ({
        ...c,
        id: `char-${i}`,
        voicePreference: voices[i % voices.length]
    }));
    
    // Process Script with IDs
    const scriptWithIds = (scriptData.script as any[]).map((block, i) => {
        let charId = undefined;
        if (block.type === 'dialogue') {
            const charName = block.characterName;
            const found = charactersWithVoices.find(c => c.name.toLowerCase() === charName.toLowerCase());
            charId = found ? found.id : undefined;
        }
        return {
            ...block,
            id: `block-${i}`,
            characterId: charId
        };
    });

    return {
        script: scriptWithIds,
        characters: charactersWithVoices,
        visualOutline: outlineData.visualOutline,
        referenceImages: refImages,
        btsDocument: btsResp.text || "BTS Generation Failed"
    };
};

export const generateVideoForScene = async (scene: Scene, signal?: AbortSignal): Promise<string> => {
    // Check if aborted before starting
    if (signal?.aborted) {
        throw new Error('Operation aborted');
    }

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: scene.videoPrompt || scene.description,
        config: {
            numberOfVideos: 1,
            resolution: '1080p',
            aspectRatio: '16:9'
        }
    });

    // Poll for completion
    while (!operation.done) {
        if (signal?.aborted) {
            throw new Error('Operation aborted');
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) {
        throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("No video URI returned.");

    // Fetch the actual video bytes using the API key
    const response = await fetch(`${downloadLink}&key=${API_KEY}`);
    if (!response.ok) throw new Error("Failed to download generated video.");
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
};

export const generateImageForScene = async (scene: Scene, visualStyle: VisualStyle): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', // Recommended model for speed/quality balance in this app context
        contents: scene.imagePrompt || `${scene.description}. Visual Style: ${visualStyle}. Photorealistic, cinematic, 8k.`,
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error("No content returned");

    for (const part of parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image data found in response");
};

export const regenerateVideoPromptForScene = async (scene: Scene, visualStyle: VisualStyle): Promise<string> => {
    const prompt = createVideoPromptRefinementPrompt(scene, visualStyle);
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt
    });
    return response.text?.trim() || scene.description;
};

export const regenerateImagePromptForScene = async (scene: Scene, visualStyle: VisualStyle): Promise<string> => {
    const prompt = createImagePromptRefinementPrompt(scene, visualStyle);
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt
    });
    return response.text?.trim() || scene.description;
};

export const refineSceneTransitions = async (outline: Scene[], visualStyle: VisualStyle): Promise<{id: string, transition: string}[]> => {
    // This could be batched, but for simplicity we'll do linear or small batch
    const results = [];
    for (let i = 0; i < outline.length; i++) {
        const current = outline[i];
        const next = outline[i+1];
        const prompt = createTransitionRefinementPrompt(current, next, visualStyle);
        try {
            const resp = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });
            results.push({ id: current.id, transition: resp.text?.trim() || "Cut to next." });
        } catch (e) {
            results.push({ id: current.id, transition: "Cut to next." });
        }
    }
    return results;
};

export const regenerateBTS = async (
    theme: RewriteTomorrowTheme,
    intensity: EmotionalArcIntensity, // kept for interface consistency
    visualStyle: VisualStyle,
    narrativeTone: NarrativeTone, // kept for interface consistency
    script: ScriptBlock[],
    characters: Character[],
    outline: Scene[]
): Promise<string> => {
    // Construct a context-rich prompt
    const scriptSummary = script.slice(0, 10).map(b => b.content).join(' ').substring(0, 500) + "...";
    const prompt = createBTSPrompt(theme, visualStyle, `A story about ${theme} featuring ${characters.map(c=>c.name).join(', ')}.`, outline);
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt
    });
    return response.text || "Failed to regenerate BTS.";
};
