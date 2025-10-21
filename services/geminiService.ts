import { GoogleGenAI, Type } from "@google/genai";
import type { GeneratedAssets, ReferenceImage, EmotionalArcIntensity, VisualStyle, NarrativeTone, Character, ScriptBlock, Scene } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

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

const createPrompt = (intensity: EmotionalArcIntensity, visualStyle: VisualStyle, narrativeTone: NarrativeTone): string => {
    const intensityDescription = getIntensityDescription(intensity);
    const styleDescription = getVisualStyleDescription(visualStyle);
    const toneDescription = getNarrativeToneDescription(narrativeTone);

    return `
You are an expert screenwriter and concept artist specializing in philosophical, visually-driven short films. Your task is to generate a complete set of creative assets for a 10-minute film.

**Project Title:** 1 Billion Followers
**Theme:** A short film that envisions a future where 1 billion people follow a single, positive idea.
**Core Concept:** A poetic AI-generated film exploring the journey of a powerful, positive idea—from its inception to its adoption by a billion people, transforming the world with collective hope and unity.

**Creative Direction:**
- **Narrative Tone:** ${toneDescription}
- **Visual Style:** ${styleDescription}
- **Emotional Arc:** ${intensityDescription}

**Your Task:**

1.  **Character Generation:** Based on the theme, create 2-3 compelling, archetypal characters who could narrate or speak. For each character, provide a name and a brief, one-sentence description of their role or essence.

2.  **Script Generation:** Write a narration and dialogue script guided by the specified **Narrative Tone**. The script should be structured as a sequence of blocks. Each block can be either 'narration' or 'dialogue'. For dialogue blocks, assign a character. The total spoken length should be appropriate for a 10-minute film, and it must align with the requested **Emotional Arc**.

3.  **Visual Outline Generation:** Create a detailed, scene-by-scene visual outline that strictly adheres to the specified **Visual Style**. For each scene, provide all required fields. Pay special attention to the 'description' field: it must be a highly evocative paragraph that paints a vivid picture of the scene, detailing the mood, setting, and key actions while embodying the selected visual style.

**Output Format:**
Return the output as a JSON object with three keys: "characters", "script", and "visualOutline".
- "characters" should be an array of objects, where each object has a "name" key and a "description" key (e.g., [{ "name": "The Seeker", "description": "A curious wanderer representing humanity's search for meaning." }]).
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


const createBTSPrompt = (intensity: EmotionalArcIntensity, visualStyle: VisualStyle, narrativeTone: NarrativeTone, script: string, visualOutline: string): string => {
  const intensityDescription = getIntensityDescription(intensity).split('.')[0];
  const styleDescription = getVisualStyleDescription(visualStyle).split('.')[0];
  const toneDescription = getNarrativeToneDescription(narrativeTone).split('.')[0];
  
  return `
You are a filmmaker writing a "Behind the Scenes" (BTS) document (400-500 words) for the "1 Billion Followers" AI film competition.

**Creative Choices Made:**
- **Narrative Tone:** ${narrativeTone.charAt(0).toUpperCase() + narrativeTone.slice(1)} (${toneDescription}).
- **Visual Style:** ${visualStyle.charAt(0).toUpperCase() + visualStyle.slice(1)} (${styleDescription}).
- **Emotional Arc:** ${intensity.charAt(0).toUpperCase() + intensity.slice(1)} (${intensityDescription}).

**Your Task:**
Write a compelling BTS document that explains your creative process using AI as a partner.
1.  **Introduction:** Introduce the project's optimistic message.
2.  **Creative Vision & AI Partnership:** Explain your deliberate choice of tone, style, and emotional arc. Describe how these specific parameters guided the AI (Gemini and Imagen) to generate a cohesive and unique vision. This is the most important section.
3.  **The Scripting Process:** Analyze how the generated script reflects the chosen **Narrative Tone** and **Emotional Arc**.
4.  **Visual Development:** Discuss how the visual outline and reference images translate the script's ideas into the chosen **Visual Style**.
5.  **Conclusion:** Summarize the process and reiterate the film's hopeful vision.

**Formatting:**
- Professional, insightful tone.
- Well-structured paragraphs.
- Output a single block of text (no markdown).
- Total length: 400-500 words.

**Generated Assets for Reference:**
---
**NARRATION SCRIPT (formatted for context):**
${script}
---
**VISUAL OUTLINE:**
${visualOutline}
---
`;
}

const getImageStages = (visualStyle: VisualStyle): { title: string, prompt: string }[] => {
    const styleDescription = getVisualStyleDescription(visualStyle);
    return [
      {
        title: 'The Spark',
        prompt: `An intimate, powerful, hopeful portrait of a single person, their face softly illuminated by an internal, warm light. Their eyes are closed in deep thought. The background is dark and abstract. Style: ${styleDescription}. Cinematic, 16:9 aspect ratio, hyper-detailed.`
      },
      {
        title: 'The Ripple',
        prompt: `A stunning visual metaphor of an idea spreading. A luminous, golden thread of light travels from one person to another across a diverse tapestry of faces from all over the world, forming a beautiful web of light. Style: ${styleDescription}. Cinematic, 16:9 aspect ratio, hyper-detailed.`
      },
      {
        title: 'The Chorus',
        prompt: `An awe-inspiring, high-angle shot of a vast, diverse crowd of a billion people. They are a beautiful mosaic of individuals, standing together in a vast landscape at twilight, all looking up at a subtle aurora of light representing their shared idea. Style: ${styleDescription}. Cinematic, 16:9 aspect ratio, hyper-detailed.`
      },
      {
        title: 'The New Dawn',
        prompt: `A breathtaking, utopian landscape representing the future transformed. A futuristic, yet harmonious city integrated with nature. People walk together, their faces filled with peace and purpose, bathed in the warm, golden light of a sunrise. Style: ${styleDescription}. Cinematic, 16:9 aspect ratio, hyper-detailed.`
      }
    ];
};

export const generateCreativeAssets = async (intensity: EmotionalArcIntensity, visualStyle: VisualStyle, narrativeTone: NarrativeTone): Promise<GeneratedAssets> => {
  try {
    const prompt = createPrompt(intensity, visualStyle, narrativeTone);
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

    const imageStages = getImageStages(visualStyle);
    const imagePromises = imageStages.map(stage => 
      ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: stage.prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
      }).then(response => ({
        title: stage.title,
        imageUrl: `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`
      }))
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
    
    const rawVisualOutline: Omit<Scene, 'id'>[] = parsedData.visualOutline || [];
    const visualOutline: Scene[] = rawVisualOutline.map((sceneData, index) => ({
        ...sceneData,
        id: `scene_${index}_${Math.random().toString(36).substring(2, 9)}`,
        title: `Scene ${index + 1}: ${sceneData.title}`
    }));

    // Create a plain text version of the script for the BTS prompt
    const scriptTextForBTS = script.map(block => {
      if (block.type === 'narration') {
        return `(NARRATION)\n${block.content}`;
      }
      const charName = characters.find(c => c.id === block.characterId)?.name || 'Unknown Character';
      return `${charName.toUpperCase()}\n${block.content}`;
    }).join('\n\n');

    const outlineTextForBTS = formatOutlineForPrompt(visualOutline);
    const btsPrompt = createBTSPrompt(intensity, visualStyle, narrativeTone, scriptTextForBTS, outlineTextForBTS);
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
    throw new Error("Failed to communicate with the AI model. Please check your API key and network connection.");
  }
};

// Revision logic would need significant rework for the new data structure and is out of scope for this change.
export const reviseScript = async (): Promise<string> => {
    throw new Error("Script revision is not supported in this version.");
}