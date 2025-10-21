
import { GoogleGenAI, Type } from "@google/genai";
import type { GeneratedAssets, ReferenceImage, EmotionalArcIntensity, VisualStyle, NarrativeTone, Character, ScriptBlock, Scene, RewriteTomorrowTheme } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const getThemeDescription = (theme: RewriteTomorrowTheme): string => {
    switch (theme) {
        case 'symbioticCities': return "The film explores a future where cities are living organisms, with technology and nature seamlessly integrated. It's a story of ecological harmony and architectural innovation.";
        case 'renaissanceOfConnection': return "The film explores how AI, rather than isolating us, fosters deeper, more meaningful human connections, bridging emotional and cultural divides.";
        case 'postScarcityCreators': return "The film showcases a world where AI has automated labor, freeing humanity to pursue art, science, and passion. It's a story of universal creativity and purpose.";
        case 'guardiansOfMemory': return "The film tells a story about how AI helps preserve and resurrect lost cultures, languages, and histories, ensuring the wisdom of the past guides the future.";
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
You are an expert screenwriter and concept artist creating assets for a film submission to the "REWRITE TOMORROW" film award.

**Competition Theme:** "Stories imagining the future with a positive twist."
**Film Length:** 7 to 10 minutes.
**Storytelling Mandate:** The film must tell a cohesive and emotionally resonant story with a clear narrative structure (beginning, middle, end), character development, and a sense of conflict, tension, or resolution.

**Your Assigned Focus:**
- **Core Concept:** ${themeDescription}

**Creative Direction:**
- **Narrative Tone:** ${toneDescription}
- **Visual Style:** ${styleDescription}
- **Emotional Arc:** ${intensityDescription}

**Your Task:**

1.  **Character Generation:** Based on the theme, create 2-3 compelling characters who will drive the story. For each character, provide a name and a brief, one-sentence description of their role or essence.

2.  **Script Generation:** Write a detailed narration and dialogue-driven script guided by the specified **Narrative Tone**. The script must be substantial enough for a **7-10 minute film**. Structure it as a sequence of blocks. Each block can be either 'narration' or 'dialogue'. For dialogue blocks, assign a character. It must follow a complete narrative arc with clear character development, aligning with the requested **Emotional Arc**.

3.  **Visual Outline Generation:** Create a detailed, scene-by-scene visual outline (8-12 scenes) that strictly adheres to the specified **Visual Style**. This outline must map to the script and be suitable for a 7-10 minute film. For each scene, provide all required fields. Pay special attention to the 'description' field: it must be a highly evocative paragraph that paints a vivid picture of the scene, detailing the mood, setting, and key actions while embodying the selected visual style.

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
You are a filmmaker writing a "Behind the Scenes" (BTS) document (500-600 words) for the "REWRITE TOMORROW" film award.

**Competition Rules to Address:**
- **Film Length:** 7-10 minutes.
- **AI Integration:** Must be at least 70% AI-generated.
- **Mandatory Tools:** Google Gemini models (including Veo for video, Imagen for images, and Flow for workflow).

**Creative Choices Made:**
- **Theme:** ${theme.charAt(0).toUpperCase() + theme.slice(1)} (${themeDescription}).
- **Narrative Tone:** ${narrativeTone.charAt(0).toUpperCase() + narrativeTone.slice(1)} (${toneDescription}).
- **Visual Style:** ${visualStyle.charAt(0).toUpperCase() + visualStyle.slice(1)} (${styleDescription}).
- **Emotional Arc:** ${intensity.charAt(0).toUpperCase() + intensity.slice(1)} (${intensityDescription}).

**Your Task:**
Write a compelling BTS document that details your creative process using AI as a core partner, ensuring you address the competition's specific requirements.
1.  **Introduction:** Introduce the film's concept, its connection to the "Rewrite Tomorrow" theme, and its ambitious scope as a 7-10 minute, heavily AI-driven narrative.
2.  **AI as Creative Partner:** This is the most crucial section. Explain your specific choices for theme, tone, style, and arc. Describe how these parameters were used to direct a suite of Google AI tools. Detail the workflow:
    - **Google Gemini:** For generating the foundational script, characters, and scene-by-scene visual outline.
    - **Google Imagen:** For creating the initial concept art and moodboard to establish the film's aesthetic.
    - **Google Veo:** As the primary tool for generating the final video clips, translating the visual outline into cinematic motion.
    - **Google Flow:** Mentioned as the underlying orchestrator for managing these complex generation pipelines.
3.  **Narrative Construction:** Analyze how the generated script and outline successfully build a complete story for a 7-10 minute runtime, focusing on character development and emotional resonance.
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
        case 'symbioticCities':
            return [
                { title: 'The Solstice Tower', prompt: `A breathtaking skyscraper covered in bioluminescent algae that glows softly at dusk, with sky-bridges connecting to other buildings draped in vertical gardens. ${commonPromptSuffix}` },
                { title: 'The River Market', prompt: `A bustling market where people travel in silent, autonomous pods along a crystal-clear waterway flowing through the center of a building complex. Nature and commerce in harmony. ${commonPromptSuffix}` },
                { title: 'The Rooftop Sanctuary', prompt: `A serene, park-like rooftop high above the city, where a person meditates beside a robotic gardener tending to rare flowers. A moment of peace amidst the clouds. ${commonPromptSuffix}` },
                { title: 'The Mycelium Network', prompt: `An underground view of the city's foundation, showing a glowing, AI-managed mycelium network recycling waste and transmitting information between buildings. ${commonPromptSuffix}` }
            ];
        case 'renaissanceOfConnection':
            return [
                { title: 'The Empathy Bridge', prompt: `Two people from different cultures sit opposite each other, wearing sleek AR visors. Between them, an AI visualizes their shared emotions as a beautiful, evolving sculpture of light. ${commonPromptSuffix}` },
                { title: 'The Ancestral Story', prompt: `A family gathered around a holographic fire, as an AI storyteller projects a life-sized, interactive story of their ancestors, allowing them to speak with their past. ${commonPromptSuffix}` },
                { title: 'The Collaborative Dream', prompt: `A global team of scientists solving a complex problem, their individual thoughts and ideas visualized by an AI as interconnected strands of energy forming a single, brilliant solution. ${commonPromptSuffix}` },
                { title: 'The Silent Conversation', prompt: `A person communicates with a loved one who has lost the ability to speak, using a brain-computer interface that translates their thoughts into poetic, projected text. ${commonPromptSuffix}` }
            ];
        case 'postScarcityCreators':
            return [
                { title: 'The Ocean Sculptor', prompt: `An artist using an AI-guided energy beam to sculpt a colossal, intricate form from a coral reef, a new art form that also helps the ecosystem. ${commonPromptSuffix}` },
                { title: 'The Composer of Worlds', prompt: `A musician in a simple room, conducting a symphony of light and sound with hand gestures, as an AI translates her imagination into a fully immersive sensory experience. ${commonPromptSuffix}` },
                { title: 'The Neighborhood Foundry', prompt: `A community gathered in a local fabrication lab, using AI to design and 3D-print everything they need, from custom furniture to advanced scientific tools. ${commonPromptSuffix}` },
                { title: 'The Infinite Library', prompt: `A single, floating crystal in a vast space, which is an AI that contains every story ever imagined. A child reaches out, and a new, personalized universe unfolds before them. ${commonPromptSuffix}` }
            ];
        case 'guardiansOfMemory':
            return [
                { title: 'The Ghost Language', prompt: `An AI archeologist projecting the glowing, 3D form of an extinct language's grammar over ancient ruins, allowing a linguist to finally understand it. ${commonPromptSuffix}` },
                { title: 'The Living Archive', prompt: `An elder tribal leader feeding her stories into a bio-organic data crystal. The crystal pulses with light, as an AI ensures the cultural memory is preserved forever. ${commonPromptSuffix}` },
                { title: 'The Resurrected City', prompt: `A student walking through a perfect, full-scale holographic reconstruction of an ancient city like Babylon, interacting with AI-driven citizens living their daily lives. ${commonPromptSuffix}` },
                { title: 'The Council of Ages', prompt: `A person facing a difficult decision consults an AI that synthesizes the wisdom of her ancestors, presenting their advice as a series of profound, ghostly figures. ${commonPromptSuffix}` }
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
    const prompt = `You are a cinematic director and prompt engineer. Rewrite and enhance the following video generation prompt to be more evocative, detailed, and visually specific, while staying true to the scene's core elements. The output should be ONLY the new prompt text, without any preamble or markdown.

    **SCENE DETAILS:**
    - **Title:** ${scene.title}
    - **Atmosphere:** ${scene.atmosphere}
    - **Description:** ${scene.description}
    - **Key Visuals:** ${scene.keyVisualElements}
    - **Pacing/Emotion:** ${scene.pacingEmotion}
    - **Visual Style:** ${styleDescription}

    **CURRENT PROMPT TO IMPROVE:**
    "${scene.videoPrompt}"

    **YOUR TASK:**
    Generate a new, improved prompt. Be more descriptive about camera angles (e.g., "slow dolly shot", "crane shot revealing..."), lighting ("dappled sunlight", "neon glow"), mood, and specific actions. Make it truly cinematic for a tool like Google Veo. Aim for about 3-4 sentences.`;

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
