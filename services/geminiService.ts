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
**Film Length:** 1 to 3 minutes.
**Storytelling Mandate:** The film must tell a cohesive and emotionally resonant story with a clear narrative structure (beginning, middle, end), character development, and a sense of conflict, tension, or resolution.

**Your Assigned Focus:**
- **Core Concept:** ${themeDescription}

**Creative Direction:**
- **Narrative Tone:** ${toneDescription}
- **Visual Style:** ${styleDescription}
- **Emotional Arc:** ${intensityDescription}

**Your Task:**

1.  **Character Generation:** Based on the theme, create 2-3 compelling characters who will drive the story. For each character, provide a name and a brief, one-sentence description of their role or essence.

2.  **Script Generation:** Write a detailed narration and dialogue-driven script guided by the specified **Narrative Tone**. The script must be substantial enough for a **1-3 minute film**. Structure it as a sequence of blocks. Each block can be either 'narration' or 'dialogue'. For dialogue blocks, assign a character. It must follow a complete narrative arc with clear character development, aligning with the requested **Emotional Arc**.

3.  **Visual Outline Generation:** Create a detailed, scene-by-scene visual outline (3-5 scenes) that strictly adheres to the specified **Visual Style**. This outline must map to the script and be suitable for a 1-3 minute film. For each scene, provide all required fields. Pay special attention to the 'description' field: it must be a highly evocative paragraph that paints a vivid picture of the scene, detailing the mood, setting, and key actions while embodying the selected visual style.

**Output Format:**
Return the output as a JSON object with three keys: "characters", "script", and "visualOutline".
- "characters" should be an array of objects, where each object has a "name" key and a "description" key (e.g., [{ "name": "The Architect", "description": "An AI ethicist designing a system for global good." }]).
- "script" should be an array of objects. Each object must have:
    - a "type" key ('narration' or 'dialogue').
    - a "content" key with the text for that block.
    - if the type is 'dialogue', it must also have a "characterName" key matching a name from the characters list.
- "visualOutline" should be an array of scene objects. Each object must have string keys: "title", "location", "timeOfDay", "atmosphere", "description", "keyVisualElements", "visuals", "transition", "pacingEmotion".
`;
}

const formatOutlineForPrompt = (outline: Scene[]): string => {
  return outline.map((scene, index) => {
    return `
**Scene Number & Title:** Scene ${index + 1}: ${scene.title}
**Location:** ${scene.location}
**Time of Day:** ${scene.timeOfDay}
**Atmosphere:** ${scene.atmosphere}
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
- **Film Length:** 1-3 minutes.
- **AI Integration:** Must be at least 70% AI-generated.
- **Mandatory Tools:** Google Gemini models (Veo, Imagen), ElevenLabs, and Pika or Runway.

**Creative Choices Made:**
- **Theme:** ${theme.charAt(0).toUpperCase() + theme.slice(1)} (${themeDescription}).
- **Narrative Tone:** ${narrativeTone.charAt(0).toUpperCase() + narrativeTone.slice(1)} (${toneDescription}).
- **Visual Style:** ${visualStyle.charAt(0).toUpperCase() + visualStyle.slice(1)} (${styleDescription}).
- **Emotional Arc:** ${intensity.charAt(0).toUpperCase() + intensity.slice(1)} (${intensityDescription}).

**Your Task:**
Write a compelling BTS document that details your creative process using AI as a core partner, ensuring you address the competition's specific requirements.
1.  **Introduction:** Introduce the film's concept, its connection to the "Rewrite Tomorrow" theme, and its ambitious scope as a 1-3 minute, heavily AI-driven narrative.
2.  **AI as Creative Partner:** This is the most crucial section. Explain your specific choices for theme, tone, style, and arc. Describe how these parameters were used to direct a suite of AI tools. Detail the workflow:
    - **Google Gemini:** For generating the foundational script, characters, and scene-by-scene visual outline.
    - **Google Imagen:** For creating the initial concept art and moodboard to establish the film's aesthetic.
    - **Google Veo (or Pika/Runway):** As the primary tool for generating the final video clips, translating the visual outline into cinematic motion.
    - **ElevenLabs:** For generating the high-quality voiceover from the script's narration and dialogue.
3.  **Narrative Construction:** Analyze how the generated script and outline successfully build a complete story for a 1-3 minute runtime, focusing on character development and emotional resonance.
4.  **Achieving 70% AI-Generation:** Briefly explain the plan to meet this requirement, emphasizing that the core visual and narrative elements originate from the AI tools, with human effort focused on editing, sound design, and final assembly.
5.  **Ethical & Innovative Use:** Conclude by summarizing the innovative aspects of using AI for long-form storytelling and affirm a commitment to ethical AI use, including transparency about the tools employed.

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
    return `Create a short, 5-second video clip for a film scene.
**Visual Style:** ${styleDescription}.
**Scene Title:** ${scene.title}.
**Atmosphere:** ${scene.atmosphere}.
**Description:** ${scene.description}.
**Key Visuals:** ${scene.keyVisualElements}.
The video should be cinematic, high-quality, and evoke the emotion of: ${scene.pacingEmotion}.`;
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
                  description: { type: Type.STRING, description: "A brief, one-sentence description of the character's role or essence." }
                },
                required: ["name", "description"],
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
                  atmosphere: { type: Type.STRING },
                  description: {
                    type: Type.STRING,
                    description: "A highly evocative and detailed paragraph that paints a vivid picture of the scene, embodying the selected visual style. It must detail the mood, setting, and key actions or moments."
                  },
                  keyVisualElements: { type: Type.STRING },
                  visuals: { type: Type.STRING },
                  transition: { type: Type.STRING },
                  pacingEmotion: { type: Type.STRING },
                },
                required: ["title", "location", "timeOfDay", "atmosphere", "description", "keyVisualElements", "visuals", "transition", "pacingEmotion"]
              }
            },
          },
          required: ["characters", "script", "visualOutline"],
        },
      },
    });

    const imageStages = getThemeBasedImageStages(theme, visualStyle);
    const imagePromises = imageStages.map(stage => 
      ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: stage.prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
      }).then(response => {
        if (!response.generatedImages || response.generatedImages.length === 0 || !response.generatedImages[0].image) {
            console.error("Image generation failed for stage:", stage.title, "Response:", response);
            throw new Error(`Image generation failed for "${stage.title}". The model did not return an image, which may be due to safety filters or a temporary model issue.`);
        }
        return {
          title: stage.title,
          imageUrl: `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`
        };
      })
    );
    
    const [scriptResponse, referenceImages] = await Promise.all([
      scriptPromise,
      Promise.all(imagePromises)
    ]);
    
    const jsonText = scriptResponse.text.trim();
    const parsedData = JSON.parse(jsonText);
    
    // Process characters and script
    const rawCharacters: { name: string; description: string; }[] = parsedData.characters || [];
    const rawScript: { type: 'narration' | 'dialogue', characterName?: string, content: string }[] = parsedData.script || [];

    const characters: Character[] = rawCharacters.map(c => ({ 
        id: `char_${Math.random().toString(36).substring(2, 9)}`, 
        name: c.name,
        description: c.description
    }));
    
    const characterNameToIdMap = new Map(characters.map(c => [c.name, c.id]));

    const script: ScriptBlock[] = rawScript.map(block => ({
        id: `block_${Math.random().toString(36).substring(2, 9)}`,
        type: block.type,
        content: block.content,
        characterId: block.type === 'dialogue' && block.characterName ? characterNameToIdMap.get(block.characterName) : undefined,
    }));
    
    const rawVisualOutline: Omit<Scene, 'id' | 'videoPrompt'>[] = parsedData.visualOutline || [];
    const visualOutline: Scene[] = rawVisualOutline.map((sceneData, index) => {
        const title = `Scene ${index + 1}: ${sceneData.title}`;
        const sceneWithTitle = { ...sceneData, title };
        return {
            ...sceneWithTitle,
            id: `scene_${index}_${Math.random().toString(36).substring(2, 9)}`,
            videoPrompt: createVideoPrompt(sceneWithTitle as Scene, visualStyle),
        };
    });

    // Create a plain text version of the script for the BTS prompt
    const scriptTextForBTS = script.map(block => {
      if (block.type === 'narration') {
        return `(NARRATION)\n${block.content}`;
      }
      const charName = characters.find(c => c.id === block.characterId)?.name || 'Unknown Character';
      return `${charName.toUpperCase()}\n${block.content}`;
    }).join('\n\n');

    const outlineTextForBTS = formatOutlineForPrompt(visualOutline);
    const btsPrompt = createBTSPrompt(theme, intensity, visualStyle, narrativeTone, scriptTextForBTS, outlineTextForBTS);
    const btsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: btsPrompt,
    });
    
    const btsDocument = btsResponse.text.trim();

    return {
      script,
      characters,
      visualOutline,
      referenceImages: referenceImages as ReferenceImage[],
      btsDocument,
    };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("The AI muse hit a block. Perhaps try a different creative direction or check your connection.");
  }
};

export const generateVideoForScene = async (scene: Scene, visualStyle: VisualStyle, signal?: AbortSignal): Promise<string> => {
    try {
      // Re-initialize to ensure the latest API key is used, as per guidelines for Veo models.
      const aiForVideo = new GoogleGenAI({ apiKey: API_KEY as string });
  
      if (!scene.videoPrompt || scene.videoPrompt.trim() === '') {
        throw new Error("Video prompt is empty. Please provide a prompt before generating the video.");
      }
      
      const prompt = scene.videoPrompt;
  
      let operation = await aiForVideo.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });
  
      while (!operation.done) {
        signal?.throwIfAborted();
        await new Promise(resolve => setTimeout(resolve, 10000));
        signal?.throwIfAborted();
        operation = await aiForVideo.operations.getVideosOperation({ operation: operation });
      }
  
      if (operation.error) {
          throw new Error(`Video generation failed: ${operation.error.message}`);
      }
  
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) {
        throw new Error("Video generation completed, but no download link was provided.");
      }
  
      return downloadLink;
  
    } catch (error) {
        console.error("Error generating video:", error);
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw error; // Re-throw cancellation error to be handled by caller
        }
        if (error instanceof Error) {
          throw new Error(`Failed to generate video. Reason: ${error.message}`);
        }
        throw new Error("An unknown error occurred during video generation.");
    }
  };

export const regenerateVideoPromptForScene = async (scene: Scene, visualStyle: VisualStyle): Promise<string> => {
    const styleDescription = getVisualStyleDescription(visualStyle);
    
    const promptTask = (scene.videoPrompt && scene.videoPrompt.trim() !== '')
      ? `**CURRENT PROMPT TO IMPROVE:**\n"${scene.videoPrompt}"\n\n**YOUR TASK:**\nRewrite and enhance the prompt above. Be more descriptive about camera angles (e.g., "slow dolly shot", "crane shot revealing..."), lighting ("dappled sunlight", "neon glow"), mood, and specific actions.`
      : `**YOUR TASK:**\nGenerate a new, cinematic prompt from scratch based on the scene details. Be descriptive about camera angles (e.g., "slow dolly shot", "crane shot revealing..."), lighting ("dappled sunlight", "neon glow"), mood, and specific actions.`;

    const prompt = `You are a cinematic director and prompt engineer. Your goal is to create a video generation prompt that is evocative, detailed, and visually specific for a tool like Google Veo. The output must be ONLY the new prompt text, without any preamble or markdown. Aim for about 3-4 sentences.

    **SCENE DETAILS:**
    - **Title:** ${scene.title}
    - **Atmosphere:** ${scene.atmosphere}
    - **Description:** ${scene.description}
    - **Key Visuals:** ${scene.keyVisualElements}
    - **Pacing/Emotion:** ${scene.pacingEmotion}
    - **Visual Style:** ${styleDescription}

    ${promptTask}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error regenerating video prompt:", error);
        throw new Error("The AI director is busy on another set. Failed to regenerate prompt.");
    }
};

// Revision logic would need significant rework for the new data structure and is out of scope for this change.
export const reviseScript = async (): Promise<string> => {
    throw new Error("Script revision is not supported in this version.");
}