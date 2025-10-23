import { GoogleGenAI, Type } from "@google/genai";
import type { GeneratedAssets, ReferenceImage, EmotionalArcIntensity, VisualStyle, NarrativeTone, Character, ScriptBlock, Scene, RewriteTomorrowTheme } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

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

const createPrompt = (theme: RewriteTomorrowTheme, intensity: EmotionalArcIntensity, visualStyle: VisualStyle, narrativeTone: NarrativeTone): string => {
    const themeDescription = getThemeDescription(theme);
    const intensityDescription = getIntensityDescription(intensity);
    const styleDescription = getVisualStyleDescription(visualStyle);
    const toneDescription = getNarrativeToneDescription(narrativeTone);

    return `
You are an expert screenwriter and concept artist creating assets for a film submission to the "1 Billion Summit AI Film Award".

**Competition Theme:** "Rewrite Tomorrow - Stories imagining the future with a positive twist."
**Film Length:** 7 to 10 minutes.
**Storytelling Mandate:** The film must tell a cohesive and emotionally resonant story with a clear narrative structure (beginning, middle, end), character development, dialogue-driven scenes, and a sense of conflict, tension, and resolution, leading to a clear emotional impact. The story must have internal consistency and logic.

**Your Assigned Focus:**
- **Core Concept:** ${themeDescription}

**Creative Direction:**
- **Narrative Tone:** ${toneDescription}
- **Visual Style:** ${styleDescription}
- **Emotional Arc:** ${intensityDescription}

**Your Task:**

1.  **Character Generation:** Based on the theme, create 2-4 compelling characters who will drive the story. For each character, provide a name, a brief, one-sentence description of their essence, and a specific role (e.g., 'Protagonist', 'Antagonist', 'Mentor', 'Supporting Character').

2.  **Script Generation:** Write a detailed narration and dialogue-driven script guided by the specified **Narrative Tone**. The script must be substantial enough for a **7-10 minute film**. Structure it as a sequence of blocks. Each block can be either 'narration' or 'dialogue'. For dialogue blocks, assign a character. It must follow a complete narrative arc with a beginning, middle, and end, featuring clear character development, conflict, and resolution, all aligning with the requested **Emotional Arc**.

3.  **Visual Outline Generation:** Create a detailed, scene-by-scene visual outline (10-15 scenes) that strictly adheres to the specified **Visual Style**. This outline must map directly to the script and be suitable for a 7-10 minute film. For each scene, provide all required fields. Pay special attention to the following fields:
    - **description:** Must be a highly evocative paragraph that paints a vivid picture of the scene, detailing the mood, setting, and key actions while embodying the selected visual style.
    - **charactersInScene:** Must briefly describe which characters are present and their key actions or emotional state.
    - **duration:** Provide a realistic duration estimate for the scene in seconds, formatted as a string (e.g., "15s"). This should reflect the pacing and content of the scene description.
    - **transition:** Must provide a descriptive and cinematic transition to the *next* scene (e.g., 'Match cut on action', 'Slow dissolve to white', 'Iris out', 'Wipe left as character exits frame'). The final scene's transition should be 'Fade to black.'.

**Output Format:**
Return the output as a JSON object with three keys: "characters", "script", and "visualOutline".
- "characters" should be an array of objects, where each object has a "name" key, a "description" key, and a "role" key (e.g., [{ "name": "The Architect", "description": "An AI ethicist designing a system for global good.", "role": "Protagonist" }]).
- "script" should be an array of objects. Each object must have:
    - a "type" key ('narration' or 'dialogue').
    - a "content" key with the text for that block.
    - if the type is 'dialogue', it must also have a "characterName" key matching a name from the characters list.
- "visualOutline" should be an array of scene objects. Each object must have string keys: "title", "location", "timeOfDay", "duration", "atmosphere", "charactersInScene", "description", "keyVisualElements", "visuals", "transition", "pacingEmotion".
`;
}

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
You are a filmmaker writing a "Behind the Scenes" (BTS) document (500-600 words) for the "1 Billion Summit AI Film Award".

**Competition Rules to Address:**
- **Film Length:** 7-10 minutes.
- **AI Integration:** Must be at least 70% AI-generated.
- **Mandatory Tools:** Heavy use of Google Gemini models is required for video generation (e.g., Veo) and image generation (e.g., Imagen).
- **Technical Standards:** Must meet professional production standards (clean audio, audio/visual sync, professional sound design, English subtitles).

**Creative Choices Made:**
- **Theme:** ${theme.charAt(0).toUpperCase() + theme.slice(1)} (${themeDescription}).
- **Narrative Tone:** ${narrativeTone.charAt(0).toUpperCase() + narrativeTone.slice(1)} (${toneDescription}).
- **Visual Style:** ${visualStyle.charAt(0).toUpperCase() + visualStyle.slice(1)} (${styleDescription}).
- **Emotional Arc:** ${intensity.charAt(0).toUpperCase() + intensity.slice(1)} (${intensityDescription}).

**Your Task:**
Write a compelling BTS document detailing your creative process using AI as a core partner.

1.  **Introduction:** Introduce the film's concept, its connection to the "Rewrite Tomorrow" theme, and its ambitious scope as a **7-10 minute**, heavily AI-driven narrative.

2.  **AI as Creative Partner & Workflow:** This is the most crucial section. Detail the end-to-end workflow using the Google Gemini ecosystem:
    - **Google Gemini (Pro/Flash):** Explain how it was used for the initial brainstorming and to generate the foundational script, characters, and a detailed, scene-by-scene visual outline for a 7-10 minute film.
    - **Google Imagen:** Describe its role in creating the initial concept art and a comprehensive moodboard to establish a consistent aesthetic, aligning with the chosen visual style.
    - **Google Veo:** Detail how Veo will be the primary tool for generating the final video clips, translating the visual outline's cinematic descriptions into high-quality motion.
    - **Supplemental AI Tools:** Briefly mention plans for using tools like ElevenLabs for high-quality voiceover generation from the script's narration and dialogue.

3.  **Narrative & Technical Execution:** Analyze how the generated script and outline successfully build a complete 7-10 minute story. Explain the plan for post-production, including editing the AI-generated clips for continuity, creating a clean audio mix, ensuring proper dialogue sync, and implementing a professional sound design with separate dialogue, music, and effects tracks. Mention the final step of adding English subtitles.

4.  **Achieving >70% AI-Generation:** Clearly state how the project meets this requirement. Emphasize that all core narrative and visual assets (script, scenes, video clips, concept art) originate from AI, with human effort focused on creative direction, prompt engineering, editing, sound design, and final assembly.

5.  **Ethical & Innovative Use:** Conclude by highlighting the innovative aspects of this AI-centric workflow for longer-form storytelling. Affirm a commitment to ethical AI use, including full transparency about the tools employed and a dedication to creating an unbiased, positive film.

**Formatting:**
- Professional, insightful tone.
- Well-structured paragraphs.
- Output a single block of text (no markdown).
- Total length: 500-600 words.

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
    const commonPromptSuffix = `Style: ${styleDescription}. Cinematic, 16:9 aspect ratio, hyper-detailed, emotionally resonant.`;
    
    switch (theme) {
        case 'abundance':
            return [
                { title: 'The Cornucopia Engine', prompt: `A city center where an elegant, glowing AI core distributes energy and resources as beautiful streams of light, flowing to every home. ${commonPromptSuffix}` },
                { title: 'The Atelier for All', prompt: `A public workshop where people of all ages use AI-assisted tools to design and fabricate anything they can imagine, from intricate art to advanced technology. ${commonPromptSuffix}` },
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
    
    return `Generate a cinematic, 5-second video clip embodying a **${styleDescription}** visual style. The scene should feel **${scene.pacingEmotion}** and have a palpable **${scene.atmosphere}** atmosphere.
    
**Scene Narrative:** In a setting described as "${scene.location}", the following unfolds: ${scene.description}.
    
**Key Focus:** The camera should capture **${scene.charactersInScene}**. Emphasize these key visual elements: ${scene.keyVisualElements}. The transition out of the scene is: ${scene.transition}.
    
The final shot must be hyper-detailed, emotionally powerful, and suitable for a high-quality film.`;
};


export const generateCreativeAssets = async (theme: RewriteTomorrowTheme, intensity: EmotionalArcIntensity, visualStyle: VisualStyle, narrativeTone: NarrativeTone): Promise<GeneratedAssets> => {
  try {
    const prompt = createPrompt(theme, intensity, visualStyle, narrativeTone);
    const scriptPromise = ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
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
                  charactersInScene: { 
                    type: Type.STRING,
                    description: "A description of which characters are present in this scene and their key actions or emotional states."
                  },
                  description: {
                    type: Type.STRING,
                    description: "A highly evocative and detailed paragraph that paints a vivid picture of the scene, embodying the selected visual style. It must detail the mood, setting, and key actions or moments."
                  },
                  keyVisualElements: { type: Type.STRING },
                  visuals: { type: Type.STRING },
                  transition: { type: Type.STRING },
                  pacingEmotion: { type: Type.STRING },
                },
                required: ["title", "location", "timeOfDay", "duration", "atmosphere", "charactersInScene", "description", "keyVisualElements", "visuals", "transition", "pacingEmotion"]
              }
            },
          },
          required: ["characters", "script", "visualOutline"],
        },
      },
    });

    const imageStages = getThemeBasedImageStages(theme, visualStyle);
    const moodboardImagePromises = imageStages.map(stage => 
      ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: stage.prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' },
      }).then(response => {
        if (!response.generatedImages || response.generatedImages.length === 0 || !response.generatedImages[0].image) {
            console.error("Image generation failed for stage:", stage.title, "Response:", response);
            throw new Error(`Image generation failed for "${stage.title}". The model did not return an image, which may be due to safety filters or a temporary model issue.`);
        }
        return { title: stage.title, imageUrl: `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}` };
      })
    );
    
    const [scriptResponse, referenceImages] = await Promise.all([scriptPromise, Promise.all(moodboardImagePromises)]);
    
    const jsonText = scriptResponse.text.trim();
    const parsedData = JSON.parse(jsonText);
    
    const rawCharacters: { name: string; description: string; role: string; }[] = parsedData.characters || [];
    const rawScript: { type: 'narration' | 'dialogue', characterName?: string, content: string }[] = parsedData.script || [];

    const characters: Character[] = rawCharacters.map(c => ({ 
        id: `char_${Math.random().toString(36).substring(2, 9)}`, name: c.name, description: c.description, role: c.role,
    }));
    
    const characterNameToIdMap = new Map(characters.map(c => [c.name, c.id]));
    const script: ScriptBlock[] = rawScript.map(block => ({
        id: `block_${Math.random().toString(36).substring(2, 9)}`, type: block.type, content: block.content,
        characterId: block.type === 'dialogue' && block.characterName ? characterNameToIdMap.get(block.characterName) : undefined,
    }));
    
    const rawVisualOutline: Omit<Scene, 'id' | 'sceneNumber' | 'videoPrompt' | 'videoUrl' | 'imageUrl'>[] = parsedData.visualOutline || [];
    const sceneShells: Scene[] = rawVisualOutline.map((sceneData, index) => ({
      ...(sceneData as any), id: `scene_${index}_${Math.random().toString(36).substring(2, 9)}`, sceneNumber: index + 1,
    }));

    const promptGenerationPromises = sceneShells.map(scene =>
      regenerateVideoPromptForScene(scene, visualStyle)
        .then(prompt => ({ ...scene, videoPrompt: prompt }))
        .catch(err => {
          console.error(`Failed to generate cinematic video prompt for scene "${scene.title}", falling back to basic template.`, err);
          return { ...scene, videoPrompt: createVideoPrompt(scene, visualStyle) };
        })
    );
    const initialVisualOutline = await Promise.all(promptGenerationPromises);

    const scriptTextForBTS = script.map(block => {
      const charName = characters.find(c => c.id === block.characterId)?.name || 'Unknown Character';
      return block.type === 'narration' ? `(NARRATION)\n${block.content}` : `${charName.toUpperCase()}\n${block.content}`;
    }).join('\n\n');
    const outlineTextForBTS = formatOutlineForPrompt(initialVisualOutline);

    const sceneImagePromises = initialVisualOutline.map(scene => 
        generateImageForScene(scene, visualStyle).catch(err => {
            console.error(`Failed to generate preview image for scene "${scene.title}":`, err); return null;
        })
    );
    const btsPrompt = createBTSPrompt(theme, intensity, visualStyle, narrativeTone, scriptTextForBTS, outlineTextForBTS);
    const btsPromise = ai.models.generateContent({ model: "gemini-2.5-flash", contents: btsPrompt });
    const [sceneImageUrls, btsResponse] = await Promise.all([Promise.all(sceneImagePromises), btsPromise]);
    
    const visualOutline: Scene[] = initialVisualOutline.map((scene, index) => ({ ...scene, imageUrl: sceneImageUrls[index] ?? undefined }));
    const btsDocument = btsResponse.text.trim();

    return { script, characters, visualOutline, referenceImages: referenceImages as ReferenceImage[], btsDocument };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("The AI muse hit a block. Perhaps try a different creative direction or check your connection.");
  }
};

const createImagePromptForScene = (scene: Scene, visualStyle: VisualStyle): string => {
    const styleDescription = getVisualStyleDescription(visualStyle);
    return `A cinematic, hyper-detailed film still in a 16:9 aspect ratio, capturing a single, powerful moment from a scene.
    
**Visual Style:** ${styleDescription}.
    
**Scene Details:** The scene, titled "${scene.title}," is infused with a feeling of **${scene.pacingEmotion}** and a **${scene.atmosphere}** atmosphere. It features **${scene.charactersInScene}**.
    
**Core Moment to Capture:** ${scene.description} The key visual elements to emphasize are: **${scene.keyVisualElements}**.`;
};

export const regenerateVideoPromptForScene = async (scene: Scene, visualStyle: VisualStyle): Promise<string> => {
  const styleDescription = getVisualStyleDescription(visualStyle);
  const prompt = `
You are an expert prompt engineer for a text-to-video AI model (like Google Veo). Your task is to take the details of a film scene and write a new, highly-effective, and cinematic prompt for video generation.
**Scene Details:**
- **Title:** ${scene.title}, **Location:** ${scene.location}, **Time of Day:** ${scene.timeOfDay}, **Atmosphere:** ${scene.atmosphere}, **Pacing & Emotion:** ${scene.pacingEmotion}, **Characters Present:** ${scene.charactersInScene}, **Key Visual Elements:** ${scene.keyVisualElements}, **Core Scene Description:** ${scene.description}
**Visual Style Mandate:** ${styleDescription}
**Your Instructions:**
1. Synthesize all details into a single, cohesive, evocative paragraph.
2. The prompt should be a descriptive, narrative style painting a vivid picture.
3. Focus on action, mood, and visual detail, incorporating the specified **Visual Style**.
4. The output should be **only the prompt text itself**, concise but powerful, ideally under 150 words.`;

  try {
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    return response.text.trim();
  } catch (error) {
    console.error("Error regenerating video prompt:", error);
    if (error instanceof Error) throw new Error(`Failed to regenerate prompt. Reason: ${error.message}`);
    throw new Error("An unknown error occurred during prompt regeneration.");
  }
};

export const generateImageForScene = async (scene: Scene, visualStyle: VisualStyle): Promise<string> => {
    try {
        const prompt = createImagePromptForScene(scene, visualStyle);
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001', prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' },
        });
        if (!response.generatedImages || response.generatedImages.length === 0 || !response.generatedImages[0].image) {
            throw new Error("Image generation failed. The model did not return an image.");
        }
        return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
    } catch (error) {
        console.error("Error generating scene image:", error);
        if (error instanceof Error) throw new Error(`Failed to generate preview image. Reason: ${error.message}`);
        throw new Error("An unknown error occurred during image generation.");
    }
};

export const generateVideoForScene = async (scene: Scene, visualStyle: VisualStyle, signal?: AbortSignal): Promise<string> => {
    try {
      const aiForVideo = new GoogleGenAI({ apiKey: API_KEY as string });
      if (!scene.videoPrompt || scene.videoPrompt.trim() === '') throw new Error("Video prompt is empty.");
      
      let operation = await aiForVideo.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview', prompt: scene.videoPrompt,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
      });
  
      while (!operation.done) {
        signal?.throwIfAborted();
        await new Promise(resolve => setTimeout(resolve, 10000));
        signal?.throwIfAborted();
        operation = await aiForVideo.operations.getVideosOperation({ operation: operation });
      }
  
      if (operation.error) throw new Error(`Video generation failed: ${operation.error.message}`);
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("Video generation completed, but no download link was provided.");
      return downloadLink;
    } catch (error) {
        console.error("Error generating video for scene:", error);
        if (error instanceof Error) {
            if (error.message.includes("Requested entity was not found.")) {
                throw new Error("Invalid API Key. Reason: Requested entity was not found.");
            }
            throw new Error(`Video generation failed. Reason: ${error.message}`);
        }
        throw new Error("An unknown error occurred during video generation.");
    }
};