
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
- **Full Script:**
---
${fullScript}
---

**Creative Synthesis:** This is not just a list of shots; it is the visual soul of the film. Every scene's description must be a powerful fusion of the plot requirements from the script and the aesthetic demands of the visual style (${styleDescription}).

**Your Task:**
Based on the provided script and synopsis, create a detailed, scene-by-scene visual outline (10-15 scenes) that strictly adheres to the specified **Visual Style**. This outline must map directly to the script. For each scene, you must provide all the required fields.

- **description:** A highly evocative and detailed paragraph (at least 3-4 sentences long) that paints a vivid picture of the scene. This description MUST deeply embody the selected visual style. Focus on concrete visual elements: describe the lighting, color palette, composition, and atmosphere.
- **charactersInScene:** A brief description of which characters are present in this scene.
- **duration:** A realistic duration estimate in seconds, formatted as a string (e.g., "15s").
- **transition:** A creative and cinematic transition to the *next* scene. The final scene's transition MUST be 'Fade to black.'.

**Output Format:**
Return a single, valid JSON object with a single key: "visualOutline".
- "visualOutline" must be an array of scene objects. Each object must have string keys for all the following fields: "title", "location", "timeOfDay", "duration", "atmosphere", "charactersInScene", "description", "keyVisualElements", "visuals", "transition", "pacingEmotion".
`;
};

const formatOutlineForPrompt = (outline: Scene[]): string => {
  return outline.map((scene, index) => {
    return `
**Scene Number & Title:** Scene ${index + 1}: ${scene.title}
**Location:** ${scene.location}
**Time of Day:** ${scene.timeOfDay}
**Duration:** ${scene.duration}
**Atmosphere:** ${scene.atmosphere}
**Characters in Scene:** ${scene.charactersInScene}
**Scene Description:** ${scene.description}
**Key Visual Elements:** ${scene.keyVisualElements}
**Visuals:** ${scene.visuals}
**Transition:** ${scene.transition}
**Pacing & Emotion:** ${scene.pacingEmotion}
    `.trim();
  }).join('\n\n');
};

const createBTSPrompt = (theme: RewriteTomorrowTheme, intensity: EmotionalArcIntensity, visualStyle: VisualStyle, narrativeTone: NarrativeTone, script: string, visualOutline: string): string => {
  const themeDescription = getThemeDescription(theme).split('.')[0];
  const intensityDescription = getIntensityDescription(intensity).split('.')[0];
  const styleDescription = getVisualStyleDescription(visualStyle).split('.')[0];
  const toneDescription = getNarrativeToneDescription(narrativeTone).split('.')[0];
  
  return `
You are a filmmaker writing a "Behind the Scenes" (BTS) document for the "1 Billion Summit AI Film Award".

**Competition Rules & Submission Criteria:**
- **Film Length:** 7-10 minutes.
- **AI Integration:** Must be at least 70% AI-generated.
- **Tools:** Use of Google Gemini ecosystem (Gemini, Imagen, Veo) is central.
- **Mandatory Format:** The workflow description MUST be broken down by "Phase" and "Tool(s)".

**Creative Choices Made:**
- **Theme:** ${theme.charAt(0).toUpperCase() + theme.slice(1)} (${themeDescription}).
- **Narrative Tone:** ${narrativeTone.charAt(0).toUpperCase() + narrativeTone.slice(1)} (${toneDescription}).
- **Visual Style:** ${visualStyle.charAt(0).toUpperCase() + visualStyle.slice(1)} (${styleDescription}).
- **Emotional Arc:** ${intensity.charAt(0).toUpperCase() + intensity.slice(1)} (${intensityDescription}).

**Your Task:**
Write a compelling BTS document that fulfills the submission criteria.

1.  **Project Overview:** Briefly introduce the film's concept, its connection to the "Rewrite Tomorrow" theme, and the ambitious scope.

2.  **Production Workflow:**
    You MUST format this section as a structured list. Each item MUST strictly follow the format: "**Phase** | **Tool(s)**".
    
    *   **Phase:** Pre-Production (Scripting & Concept) | **Tool(s):** Gemini 3 Pro
        **Description:** Used for ideation, world-building, character development, and writing the full screenplay.
        
    *   **Phase:** Visual Development | **Tool(s):** Gemini 3 Pro (Prompt Engineering), Gemini 2.5 Flash Image (Concept Art)
        **Description:** Designed the visual style, moodboards, and generated detailed scene descriptions.
        
    *   **Phase:** Production (Video) | **Tool(s):** Google Veo
        **Description:** Generated high-quality cinematic video clips for each scene in the visual outline.
        
    *   **Phase:** Audio & Voice | **Tool(s):** Gemini 2.5 Flash TTS
        **Description:** Generated distinct voiceovers for each character and narration, using the TTS model for separate audio stems.
        
    *   **Phase:** Post-Production | **Tool(s):** Editing Software, AI Upscaling
        **Description:** Assembled the timeline, synced audio/visuals, and applied final color grading.

3.  **Narrative & Technical Execution:** Analyze how the generated script and outline successfully build a complete story structure.

4.  **Achieving >70% AI-Generation:** Clearly state how the project meets this requirement.

5.  **Ethical & Innovative Use:** Conclude with a statement on the ethical and positive use of AI in this production.

**Formatting:**
- Professional, insightful tone.
- Use bolding for **Phase** and **Tool(s)** headers as shown.
- Output a single block of text (no markdown code blocks).
- Total length: 500-700 words.

**Generated Assets for Reference:**
---
**SCRIPT:**
${script}
---
**VISUAL OUTLINE:**
${visualOutline}
---
`;
}

const getThemeBasedImageStages = (theme: RewriteTomorrowTheme, visualStyle: VisualStyle): { title: string, prompt: string }[] => {
    const styleDescription = getVisualStyleDescription(visualStyle);
    const commonPromptSuffix = `Style: ${styleDescription}. Hyper-realistic, 8k resolution, cinematic lighting, shot on 35mm film, highly detailed, professional photography, masterpiece.`;
    
    switch (theme) {
        case 'abundance':
            return [
                { title: 'The Cornucopia Engine', prompt: `A city center where an elegant, glowing AI core distributes energy and resources as beautiful streams of light, flowing to every home. ${commonPromptSuffix}` },
                { title: 'The Atelier for All', prompt: `A high-tech public design studio where diverse adults use holographic AI tools to fabricate advanced technology. ${commonPromptSuffix}` },
                { title: 'The Sky-Harvest', prompt: `Immense floating platforms covered in lush vertical farms, tended by autonomous drones, providing an endless supply of fresh food to the city below. ${commonPromptSuffix}` },
                { title: 'The Decommissioned Dam', prompt: `A massive, obsolete dam now overgrown with greenery, repurposed as a cascading vertical village and nature sanctuary, symbolizing the end of resource struggles. ${commonPromptSuffix}` }
            ];
        case 'ascension':
            return [
                { title: 'The Mind-Mesh', prompt: `A serene individual meditating, their consciousness visualized as a radiant network of light connecting with a benevolent, cloud-like AI in the digital ether. ${commonPromptSuffix}` },
                { title: 'The Body Transcended', prompt: `A person's physical form dissolving into a shimmering entity of pure energy, guided by an AI, preparing to travel beyond the material world. ${commonPromptSuffix}` },
                { title: 'The Cosmic Sail', prompt: `A magnificent spacecraft, powered by the collective consciousness of its crew and an AI navigator, sailing through nebulae on waves of thought. ${commonPromptSuffix}` },
                { title: 'The Digital Bodhisattva', prompt: `A giant, translucent AI figure, composed of data and light, gently guiding a human towards a higher state of being with a gesture of profound compassion. ${commonPromptSuffix}` }
            ];
        case 'harmony':
            return [
                { title: 'The Songwood Forest', prompt: `A bioluminescent forest at night, where trees, animals, and robotic custodians communicate through a shared, glowing mycelial network managed by a planetary AI. ${commonPromptSuffix}` },
                { title: 'The Oceanic Biome', prompt: `A breathtaking underwater city with structures made of bio-engineered coral, co-existing peacefully with majestic marine life, all orchestrated by an AI that speaks the language of the ocean. ${commonPromptSuffix}` },
                { title: 'The Great Rewilding', prompt: `A time-lapse view of a desert landscape transforming into a lush savanna, as herds of bio-robotic terraformers and revived extinct species work in concert. ${commonPromptSuffix}` },
                { title: 'The Conductor AI', prompt: `A view from space showing an AI managing Earth's climate, its influence seen as subtle, beautiful auroras that stabilize weather patterns and heal ecosystems. ${commonPromptSuffix}` }
            ];
        case 'enlightenment':
            return [
                { title: 'The Oracle of Delphi-AI', prompt: `A seeker consulting a central AI, which manifests not as a machine, but as a tranquil pool of water that reflects profound universal truths in its ripples. ${commonPromptSuffix}` },
                { title: 'The Ego-Dissolver', prompt: `A chamber where an individual, aided by a compassionate AI, safely experiences the dissolution of self, their consciousness merging with a beautiful, infinite fractal of light. ${commonPromptSuffix}` },
                { title: 'The Empathy Stream', prompt: `Two people from conflicting backgrounds sharing an AI-facilitated experience, allowing them to see the world through each other's eyes, their shared understanding visualized as a bridge of light. ${commonPromptSuffix}` },
                { title: 'The Library of Qualia', prompt: `A vast, silent library where an AI curates subjective experiences—the feeling of flight, the sound of a lost language—stored as glowing, touchable spheres of light. ${commonPromptSuffix}` }
            ];
    }
};

const createVideoPrompt = (scene: Scene | Omit<Scene, 'id' | 'videoUrl' | 'videoPrompt'>, visualStyle: VisualStyle): string => {
    const styleDescription = getVisualStyleDescription(visualStyle);
    
    return `Generate a cinematic video clip of approximately **${scene.duration}** embodying a **${styleDescription}** visual style. The scene should feel **${scene.pacingEmotion}** and have a palpable **${scene.atmosphere}** atmosphere.
    
**Scene Narrative:** In a setting described as "${scene.location}", the following unfolds: ${scene.description}.
    
**Key Focus:** The camera should capture **${scene.charactersInScene}**. Emphasize these key visual elements: ${scene.keyVisualElements}. The transition out of the scene is: ${scene.transition}.
    
The final shot must be hyper-detailed, photorealistic, cinematic, and suitable for a high-quality film.`;
};


export const generateCreativeAssets = async (theme: RewriteTomorrowTheme, intensity: EmotionalArcIntensity, visualStyle: VisualStyle, narrativeTone: NarrativeTone): Promise<GeneratedAssets> => {
  try {
    // Start moodboard generation with graceful error handling
    const imageStages = getThemeBasedImageStages(theme, visualStyle);
    const moodboardPromise = processInBatches(imageStages, async (stage) => {
      try {
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: { parts: [{ text: stage.prompt }] },
              config: { imageConfig: { aspectRatio: '16:9' } },
          });

          let imageUrl: string | null = null;
          if (response.candidates?.[0]?.content?.parts) {
               for (const part of response.candidates[0].content.parts) {
                  if (part.inlineData?.data) {
                      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                      break;
                  }
              }
          }

          if (!imageUrl) {
              console.warn(`Image generation returned no image for moodboard stage: "${stage.title}"`);
              return null;
          }
          return { title: stage.title, imageUrl };
      } catch (error) {
          console.error(`Moodboard image generation failed for stage "${stage.title}":`, error);
          return null;
      }
    }, 1, 1000);

    // STEP 1: Generate Core Concept
    const coreConceptPrompt = createCoreConceptPrompt(theme, intensity, visualStyle, narrativeTone);
    const coreConceptResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: coreConceptPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            logline: { type: Type.STRING, description: "A one-sentence summary of the film." },
            synopsis: { type: Type.STRING, description: "A one-paragraph summary of the story's plot and emotional journey." },
            characters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING, description: "A brief, one-sentence description of the character's role or essence." },
                  role: { type: Type.STRING, description: "The character's role in the story (e.g., Protagonist, Antagonist)." }
                },
                required: ["name", "description", "role"],
              },
            },
          },
          required: ["logline", "synopsis", "characters"],
        },
      },
    });
    const coreConceptData = JSON.parse(coreConceptResponse.text.trim());
    const { logline, synopsis } = coreConceptData;
    const rawCharacters: { name: string; description: string; role: string; }[] = coreConceptData.characters || [];
    
    // Assign voices to characters
    const availableVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    const characters: Character[] = rawCharacters.map((c, index) => ({
        id: `char_${Math.random().toString(36).substring(2, 9)}`, 
        name: c.name, 
        description: c.description, 
        role: c.role,
        voicePreference: availableVoices[index % availableVoices.length]
    }));
    const characterNameToIdMap = new Map(characters.map(c => [c.name, c.id]));

    // STEP 2: Generate Script
    const scriptPrompt = createScriptPrompt(theme, intensity, narrativeTone, logline, synopsis, characters);
    const scriptResponse = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: scriptPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    script: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          type: { type: Type.STRING },
                          characterName: { type: Type.STRING },
                          content: { type: Type.STRING },
                        },
                        required: ["type", "content"],
                      },
                    },
                },
                required: ["script"],
            },
        },
    });
    const scriptData = JSON.parse(scriptResponse.text.trim());
    const rawScript: { type: 'narration' | 'dialogue', characterName?: string, content: string }[] = scriptData.script || [];
    const script: ScriptBlock[] = rawScript.map(block => ({
        id: `block_${Math.random().toString(36).substring(2, 9)}`, type: block.type, content: block.content,
        characterId: block.type === 'dialogue' && block.characterName ? characterNameToIdMap.get(block.characterName) : undefined,
    }));
    const scriptTextForPrompts = script.map(block => {
      const charName = characters.find(c => c.id === block.characterId)?.name || 'Unknown Character';
      return block.type === 'narration' ? `(NARRATION)\n${block.content}` : `${charName.toUpperCase()}\n${block.content}`;
    }).join('\n\n');

    // STEP 3: Generate Visual Outline
    const visualOutlinePrompt = createVisualOutlinePrompt(theme, visualStyle, synopsis, scriptTextForPrompts);
    const visualOutlineResponse = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: visualOutlinePrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    visualOutline: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          location: { type: Type.STRING },
                          timeOfDay: { type: Type.STRING },
                          duration: { type: Type.STRING, description: "Estimated duration of the scene in seconds (e.g., '15s')."},
                          atmosphere: { type: Type.STRING },
                          charactersInScene: { type: Type.STRING },
                          description: { type: Type.STRING },
                          keyVisualElements: { type: Type.STRING },
                          visuals: { type: Type.STRING },
                          transition: { type: Type.STRING },
                          pacingEmotion: { type: Type.STRING },
                        },
                        required: ["title", "location", "timeOfDay", "duration", "atmosphere", "charactersInScene", "description", "keyVisualElements", "visuals", "transition", "pacingEmotion"]
                      }
                    },
                },
                required: ["visualOutline"]
            },
        },
    });
    const visualOutlineData = JSON.parse(visualOutlineResponse.text.trim());
    const rawVisualOutline: Omit<Scene, 'id' | 'sceneNumber' | 'videoPrompt' | 'videoUrl' | 'imageUrl'>[] = visualOutlineData.visualOutline || [];
    
    // Enhance scene description logic...
    const cornucopiaEngineIndex = rawVisualOutline.findIndex(scene => scene.title === 'The Cornucopia Engine');
    if (cornucopiaEngineIndex !== -1) {
        rawVisualOutline[cornucopiaEngineIndex].description = "The last rays of the golden hour bathe the city square in a warm, ethereal glow. Citizens, their faces upturned in serene awe, gaze at the Cornucopia Engine. It's not a machine, but a colossal, crystalline heart of the city, pulsing with a gentle, internal luminescence. Shimmering, iridescent streams of energy flow from it, weaving through the biomorphic architecture like a living circulatory system. The scene is one of profound peace and shared prosperity.";
        rawVisualOutline[cornucopiaEngineIndex].atmosphere = "Golden Hour, Awe, Profound Peace";
    }
    
    // STEP 4: Post-process outline
    const sceneShells: Scene[] = rawVisualOutline.map((sceneData, index) => ({
      ...(sceneData as any), id: `scene_${index}_${Math.random().toString(36).substring(2, 9)}`, sceneNumber: index + 1,
    }));

    // Optimize video settings
    const scenesWithOptimizedSettings: Scene[] = await processInBatches(
      sceneShells,
      scene => optimizeVideoSettingsForScene(scene, visualStyle)
          .then(settings => ({ ...scene, ...settings }))
          .catch(err => {
              console.error(`Failed to optimize settings for scene "${scene.title}"`, err);
              return {
                  ...scene,
                  videoModel: 'veo-3.1-fast-generate-preview',
                  resolution: '720p',
                  aspectRatio: '16:9',
                  videoSettingsReasoning: 'AI optimization failed; using default settings.'
              };
          }),
      1, 500
    );

    const promptGenerationPromises = scenesWithOptimizedSettings.map(scene =>
      regenerateVideoPromptForScene(scene, visualStyle)
        .then(prompt => ({ ...scene, videoPrompt: prompt }))
        .catch(err => {
          console.error(`Failed to generate video prompt for scene "${scene.title}"`, err);
          return { ...scene, videoPrompt: createVideoPrompt(scene, visualStyle) };
        })
    );
    const initialVisualOutline = await Promise.all(promptGenerationPromises);

    const imagePromptGenerationPromises = initialVisualOutline.map(scene =>
      regenerateImagePromptForScene(scene, visualStyle)
        .then(prompt => ({ ...scene, imagePrompt: prompt }))
        .catch(err => {
          console.error(`Failed to generate initial image prompt for scene "${scene.title}"`, err);
          return scene; 
        })
    );
    const outlineWithImagePrompts = await Promise.all(imagePromptGenerationPromises);

    const outlineTextForBTS = formatOutlineForPrompt(outlineWithImagePrompts);
    const btsPrompt = createBTSPrompt(theme, intensity, visualStyle, narrativeTone, scriptTextForPrompts, outlineTextForBTS);
    
    // Key scenes
    const keySceneIndices = [0, Math.floor(outlineWithImagePrompts.length / 2), outlineWithImagePrompts.length - 1];
    const uniqueKeySceneIndices = [...new Set(keySceneIndices)];
    const keyScenesToImage = uniqueKeySceneIndices.map(i => outlineWithImagePrompts[i]).filter(Boolean);

    // Parallel processing
    const sceneImagesPromise = processInBatches(keyScenesToImage, scene => 
        generateImageForScene(scene, visualStyle).then(imageUrl => ({
            sceneId: scene.id,
            imageUrl
        })).catch(err => {
            console.error(`Failed to generate preview image for scene "${scene.title}":`, err); return null;
        }),
        1, 1000
    );

    const btsPromise = ai.models.generateContent({ model: "gemini-3-pro-preview", contents: btsPrompt });
    
    const [moodboardResults, sceneImageResults, btsResponse] = await Promise.all([moodboardPromise, sceneImagesPromise, btsPromise]);
    
    const referenceImages = moodboardResults.filter((r): r is ReferenceImage => r !== null);
    const sceneImageMap = new Map<string, string>(sceneImageResults.filter((r): r is { sceneId: string; imageUrl: string } => r !== null).map(r => [r.sceneId, r.imageUrl]));

    const visualOutline: Scene[] = outlineWithImagePrompts.map((scene) => ({ ...scene, imageUrl: sceneImageMap.get(scene.id) }));
    const btsDocument = btsResponse.text.trim();

    return { script, characters, visualOutline, referenceImages, btsDocument };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes('JSON')) {
            throw new Error("The AI's response was not in the expected format. Please try again.");
        }
    }
    throw new Error("The AI muse hit a block. Please try again.");
  }
};

const createImagePromptForScene = (scene: Scene, visualStyle: VisualStyle): string => {
    if (scene.imagePrompt && scene.imagePrompt.trim() !== '') return scene.imagePrompt;
    const styleDescription = getVisualStyleDescription(visualStyle);
    return `A cinematic, hyper-detailed, photorealistic film still in a 16:9 aspect ratio... Style: ${styleDescription}...`;
};

export const regenerateImagePromptForScene = async (scene: Scene, visualStyle: VisualStyle): Promise<string> => {
  const styleDescription = getVisualStyleDescription(visualStyle);
  const prompt = `
You are an expert prompt engineer for a text-to-image AI model...
**Scene Details:** ${scene.title}, ${scene.description}...
**Visual Style Mandate:** ${styleDescription}
**Quality Mandate:** The image MUST be hyper-realistic...
Output **only the prompt text itself**.
`;

  try {
    const response = await ai.models.generateContent({ model: "gemini-3-pro-preview", contents: prompt });
    return response.text.trim();
  } catch (error) {
    console.error("Error regenerating image prompt:", error);
    if (error instanceof Error) throw new Error(`Failed to regenerate prompt. Reason: ${error.message}`);
    throw new Error("An unknown error occurred.");
  }
};


export const regenerateVideoPromptForScene = async (scene: Scene, visualStyle: VisualStyle): Promise<string> => {
  const styleDescription = getVisualStyleDescription(visualStyle);
  const prompt = `
You are a seasoned Director of Photography and a world-class prompt engineer...
**Scene Brief:** ${scene.title}, ${scene.description}...
**Mandatory Visual Style:** ${styleDescription}
**Quality Mandate:** Hyper-realistic, cinematic look...
Output **only the prompt text itself**.
`;

  try {
    const response = await ai.models.generateContent({ model: "gemini-3-pro-preview", contents: prompt });
    return response.text.trim();
  } catch (error) {
    console.error("Error regenerating video prompt:", error);
    if (error instanceof Error) throw new Error(`Failed to regenerate prompt. Reason: ${error.message}`);
    throw new Error("An unknown error occurred.");
  }
};

export const generateImageForScene = async (scene: Scene, visualStyle: VisualStyle): Promise<string> => {
    try {
        const prompt = createImagePromptForScene(scene, visualStyle);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: '16:9' } },
        });

        let imageUrl: string | null = null;
        if (response.candidates?.[0]?.content?.parts) {
             for (const part of response.candidates[0].content.parts) {
                if (part.inlineData?.data) {
                    imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                    break;
                }
            }
        }
        if (!imageUrl) throw new Error("Image generation failed. No image returned.");
        return imageUrl;
    } catch (error) {
        console.error("Error generating scene image:", error);
        if (error instanceof Error) throw new Error(`Failed to generate preview image. Reason: ${error.message}`);
        throw new Error("An unknown error occurred.");
    }
};

export const generateVideoForScene = async (scene: Scene, signal?: AbortSignal): Promise<string> => {
    try {
      const aiForVideo = new GoogleGenAI({ apiKey: API_KEY as string });
      if (!scene.videoPrompt || scene.videoPrompt.trim() === '') throw new Error("Video prompt is empty.");
      
      let operation = await aiForVideo.models.generateVideos({
        model: scene.videoModel || 'veo-3.1-fast-generate-preview',
        prompt: scene.videoPrompt,
        config: {
            numberOfVideos: 1,
            resolution: scene.resolution || '720p',
            aspectRatio: scene.aspectRatio || '16:9'
        }
      });
  
      while (!operation.done) {
        signal?.throwIfAborted();
        await new Promise(resolve => setTimeout(resolve, 10000));
        signal?.throwIfAborted();
        operation = await aiForVideo.operations.getVideosOperation({ operation: operation });
      }
  
      if (operation.error) throw new Error(`Video generation failed: ${operation.error.message}`);
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("No download link provided.");
      return downloadLink;
    } catch (error) {
        console.error("Error generating video for scene:", error);
        if (error instanceof Error) {
            if (error.message.includes("Requested entity was not found.")) {
                throw new Error("Invalid API Key. Reason: Requested entity was not found.");
            }
            throw new Error(`Video generation failed. Reason: ${error.message}`);
        }
        throw new Error("An unknown error occurred.");
    }
};

export const optimizeVideoSettingsForScene = async (scene: Scene, visualStyle: VisualStyle): Promise<Pick<Scene, 'videoModel' | 'resolution' | 'aspectRatio' | 'videoSettingsReasoning'>> => {
    const styleDescription = getVisualStyleDescription(visualStyle);
    const prompt = `
You are an expert VFX Supervisor... optimize video generation settings...
**Film's Overall Visual Style:** ${styleDescription}
**Scene Details:** ${scene.title}, ${scene.description}...
**Available Settings:** veo-3.1-fast-generate-preview, veo-3.1-generate-preview...
Return JSON.
`;

    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    videoModel: { type: Type.STRING },
                    resolution: { type: Type.STRING },
                    aspectRatio: { type: Type.STRING },
                    reasoning: { type: Type.STRING },
                },
                required: ["videoModel", "resolution", "aspectRatio", "reasoning"],
            },
        },
    });

    const data = JSON.parse(response.text.trim());
    return {
      videoModel: data.videoModel,
      resolution: data.resolution,
      aspectRatio: data.aspectRatio,
      videoSettingsReasoning: data.reasoning,
    };
};

export const refineSceneTransitions = async (outline: Scene[], visualStyle: VisualStyle): Promise<{ id: string; transition: string; }[]> => {
    const styleDescription = getVisualStyleDescription(visualStyle);
    const simplifiedOutline = outline.map(scene => ({
        id: scene.id,
        sceneNumber: scene.sceneNumber,
        title: scene.title,
        description: scene.description.substring(0, 200) + '...',
        currentTransition: scene.transition
    }));

    const prompt = `
You are an expert film editor... rewrite transition descriptions...
**Film's Visual Style:** ${styleDescription}
**Scene Outline:** ${JSON.stringify(simplifiedOutline, null, 2)}
Output JSON with "transitions" array.
`;

    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    transitions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                transition: { type: Type.STRING },
                            },
                            required: ["id", "transition"],
                        },
                    },
                },
                required: ["transitions"],
            },
        },
    });

    const data = JSON.parse(response.text.trim());
    return data.transitions;
};

export const regenerateBTS = async (
  theme: RewriteTomorrowTheme,
  intensity: EmotionalArcIntensity,
  visualStyle: VisualStyle,
  narrativeTone: NarrativeTone,
  script: ScriptBlock[],
  characters: Character[],
  outline: Scene[]
): Promise<string> => {
  const scriptText = script.map(block => {
      const charName = characters.find(c => c.id === block.characterId)?.name || 'Unknown Character';
      return block.type === 'narration' ? `(NARRATION)\n${block.content}` : `${charName.toUpperCase()}\n${block.content}`;
    }).join('\n\n');

  const outlineText = formatOutlineForPrompt(outline);

  const prompt = createBTSPrompt(theme, intensity, visualStyle, narrativeTone, scriptText, outlineText);

  try {
    const response = await ai.models.generateContent({ model: "gemini-3-pro-preview", contents: prompt });
    return response.text.trim();
  } catch (error) {
    console.error("Error regenerating BTS:", error);
    if (error instanceof Error) throw new Error(`Failed to regenerate BTS document. Reason: ${error.message}`);
    throw new Error("An unknown error occurred.");
  }
};
