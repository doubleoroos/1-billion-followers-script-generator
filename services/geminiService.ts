import { GoogleGenAI, Type } from "@google/genai";
import type { GeneratedAssets, ReferenceImage, EmotionalArcIntensity } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const getIntensityDescription = (intensity: EmotionalArcIntensity): string => {
    switch (intensity) {
        case 'subtle':
            return "The emotional arc should be gentle and contemplative, building slowly with a quiet, introspective tone. Focus on nuanced feelings and gradual shifts in mood.";
        case 'intense':
            return "Design a powerful and dramatic emotional arc. Use stark contrasts in visuals and narration, build to moments of profound emotional weight, and aim for a climactic, cathartic release. The pacing should be dynamic and impactful.";
        case 'moderate':
        default:
            return "Craft a balanced emotional journey with clear peaks and valleys, moving from curiosity to tension, and finally to a hopeful resolution. This should follow a standard cinematic arc for a 10-minute film.";
    }
}

const createPrompt = (intensity: EmotionalArcIntensity): string => {
    const intensityDescription = getIntensityDescription(intensity);

    return `
You are an expert screenwriter and concept artist specializing in philosophical, visually-driven short films. Your task is to generate a complete script and visual outline for a 10-minute film based on the following concept.

**Project Title:** 1 Billion Followers

**Theme:** Create a short film that envisions a future where 1 billion people follow a single, positive idea.

**Core Concept:** A poetic AI-generated short film that explores the journey of a single, powerful, positive idea—from its inception in the mind of one person to its adoption by a billion people, transforming the world. The film visualizes the birth, spread, and ultimate impact of this idea, imagining a future defined by collective hope, unity, and constructive action. The film's core message should be optimistic and inspiring.

**Emotional Arc Instruction:** The overall emotional arc for this 10-minute film should be **${intensity.toUpperCase()}**. ${intensityDescription}

**Your Task:**

1.  **Script Generation:** Write a poetic, philosophical narration script. The script should guide the viewer through the emotional and temporal journey of the idea. The tone should be meditative, hopeful, and profound, **adhering strictly to the specified '${intensity}' emotional arc.** The total spoken length should be appropriate for a 10-minute film. Format it with standard narration script conventions.

2.  **Visual Outline Generation:** Create a detailed, scene-by-scene visual outline. For each scene, describe:
    *   **Scene Number & Title:**
    *   **Scene Description:** An evocative paragraph setting the scene, describing key actions, and establishing the overall mood. This provides narrative context.
    *   **Key Visual Elements:** A bulleted list of 3-5 specific, crucial visual elements (props, character details, background features) that define the scene's look and feel.
    *   **Visuals:** Specific details on camera angles, lighting, and composition.
    *   **Transition:** How this scene transitions to the next.
    *   **Pacing & Emotion:** **Crucially, ensure this section reflects the requested '${intensity}' emotional arc.** Note the intended emotional journey and pacing for the scene to match the overall intensity.

**Output Format:**
Return the output as a JSON object with two keys: "script" and "visualOutline".
- The "script" should be a single string with proper formatting for a narration script.
- The "visualOutline" should be a single string formatted with Markdown for clarity (e.g., using headings for scenes).
`;
}

const createBTSPrompt = (intensity: EmotionalArcIntensity, script: string, visualOutline: string): string => {
  return `
You are a filmmaker creating a submission for the "1 Billion Followers" AI film competition. Your task is to write a "Behind the Scenes" (BTS) document of approximately 400-500 words. This document will detail the creative process for generating the film's script and visual concept using AI.

**Context:**
- **Competition Theme:** Envision a future where 1 billion people follow a single, positive idea.
- **AI Tools Used:**
    - Script & Visual Outline: Google Gemini 2.5 Pro
    - Concept Art/Reference Images: Google Imagen 4.0
- **Creative Choices:** The emotional arc was set to **'${intensity}'**.
- **Generated Assets:** You have been provided with the final narration script and the detailed visual outline.

**Your Task:**
Write a compelling BTS document that covers the following points:
1.  **Introduction:** Briefly introduce the project "1 Billion Followers" and its core optimistic message.
2.  **Creative Vision & AI Partnership:** Describe how you approached the project, framing AI not just as a tool, but as a creative partner. Explain the decision to set a specific emotional arc ('${intensity}') and how that guided the AI's generation process.
3.  **The Scripting Process:** Briefly analyze the generated script. Mention its poetic and philosophical tone, and how it aligns with the chosen emotional arc and the film's core theme.
4.  **Visual Development:** Discuss the generated visual outline. Explain how it translates the script's abstract ideas into concrete, evocative scenes. Touch upon how the visual language supports the '${intensity}' emotional journey.
5.  **Conclusion:** Summarize the process and reiterate the film's hopeful vision for the future.

**Formatting and Tone:**
- The tone should be professional, insightful, and reflective of a creative process.
- The document should be well-structured with clear paragraphs.
- Do not use markdown. Output a single block of text.
- The total length should be around 400-500 words.

**Here are the generated assets to base your document on:**

---
**NARRATION SCRIPT:**
${script}
---
**VISUAL OUTLINE:**
${visualOutline}
---
`;
}


const IMAGE_STAGES = [
  {
    title: 'The Spark',
    prompt: 'Ultra-photorealistic, emotionally resonant portrait of a single person, their face softly illuminated by an internal, warm light. Their eyes are closed in deep thought, a subtle smile playing on their lips as a profound, world-changing positive idea dawns upon them. The background is dark and abstract, focusing all attention on their moment of quiet epiphany. Mood: Intimate, powerful, hopeful. Cinematic, 16:9 aspect ratio, hyper-detailed.'
  },
  {
    title: 'The Ripple',
    prompt: 'A stunning visual metaphor of an idea spreading. A luminous, golden thread of light travels from one person to another across a diverse tapestry of faces from all over the world. The network grows exponentially, forming a beautiful, intricate web of light against a dark background. The faces show expressions of dawning realization and connection. Mood: Dynamic, interconnected, and optimistic. Cinematic, 16:9 aspect ratio, hyper-detailed.'
  },
  {
    title: 'The Chorus',
    prompt: 'An awe-inspiring, high-angle shot of a vast, diverse crowd of what feels like a billion people. They are not a uniform mass, but a beautiful mosaic of individuals. They stand together in a natural landscape—perhaps a vast desert or plain at twilight—all looking up at the sky where a subtle aurora of light represents their shared idea. Mood: Awe-inspiring, unified, and monumental. Cinematic, 16:9 aspect ratio, hyper-detailed.'
  },
  {
    title: 'The New Dawn',
    prompt: 'A breathtaking, utopian landscape representing the future transformed by the positive idea. A futuristic, yet harmonious city integrated with nature. Lush vertical gardens climb elegant, organic architecture, and clean energy sources hum quietly. People of all ages walk together, their faces filled with peace and purpose, bathed in the warm, golden light of a sunrise. Mood: Serene, hopeful, and transformative. Cinematic, 16:9 aspect ratio, hyper-detailed.'
  }
];


export const generateCreativeAssets = async (intensity: EmotionalArcIntensity): Promise<GeneratedAssets> => {
  try {
    const prompt = createPrompt(intensity);
    const scriptPromise = ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            script: {
              type: Type.STRING,
              description: 'The poetic narration script for the film, formatted correctly.',
            },
            visualOutline: {
              type: Type.STRING,
              description: 'The detailed scene-by-scene visual outline, formatted with Markdown.',
            },
          },
          required: ["script", "visualOutline"],
        },
      },
    });

    const imagePromises = IMAGE_STAGES.map(stage => 
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
    
    // Step 1: Generate Script, Outline, and Images
    const [scriptResponse, referenceImages] = await Promise.all([
      scriptPromise,
      Promise.all(imagePromises)
    ]);
    
    const jsonText = scriptResponse.text.trim();
    const parsedScriptData = JSON.parse(jsonText);
    
    if (typeof parsedScriptData.script !== 'string' || typeof parsedScriptData.visualOutline !== 'string') {
      throw new Error("Invalid JSON structure received from API for script.");
    }
    
    const { script, visualOutline } = parsedScriptData;

    // Step 2: Generate BTS Document based on the results of Step 1
    const btsPrompt = createBTSPrompt(intensity, script, visualOutline);
    const btsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: btsPrompt,
    });
    
    const btsDocument = btsResponse.text.trim();

    return {
      script,
      visualOutline,
      referenceImages: referenceImages as ReferenceImage[],
      btsDocument,
    };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to communicate with the AI model. Please check your API key and network connection.");
  }
};