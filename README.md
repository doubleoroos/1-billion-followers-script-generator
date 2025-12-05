# Rewrite Tomorrow Studio | AI Command Center

![Status](https://img.shields.io/badge/Status-Production-success)
![Tech](https://img.shields.io/badge/Stack-React_|_TypeScript_|_Tailwind-blue)
![AI](https://img.shields.io/badge/AI-Gemini_Pro_|_Veo_|_Imagen_3-purple)
![Competition](https://img.shields.io/badge/Competition-1_Billion_Followers-gold)

**Rewrite Tomorrow** is a professional-grade AI Film Generation Studio built specifically for the **1 Billion Followers Film Competition**. It functions as a "Senior Creative Partner," orchestrating Google's most advanced Generative AI models to assist filmmakers in visualizing positive, regenerative futures (Solarpunk, Protopian, Abundance).

The application features a **"Hollywood Studio Control Panel"** aesthetic—a high-contrast, dark-mode interface designed for creative professionals, featuring rack-mount style components, LED indicators, and cinematic typography.

---

## 🏆 Official Selection Features (1BFS Optimization)

This tool is tuned to strictly adhere to the competition criteria:

*   **WGA-Standard Scriptwriting**: The AI is prompted to act as a Senior Screenwriter, prioritizing subtext, strong narrative structure (Inciting Incident -> Climax), and distinct character voices over generic AI dialogue.
*   **High-Fashion Cinematic Aesthetic**: Visuals are automatically injected with "High-fashion editorial" and "Arri Alexa LF" keywords, ensuring a premium, cinematic look with subtle luxury details (Chanel-esque accessories) as per the director's vision.
*   **10-Second Veo Pacing**: Video prompts are optimized for Google Veo to generate "Long continuous takes (10s)" and "Slow motion (0.5x)", maximizing the perceived duration and stability of the generated clips.

---

## 🚀 Key Features

### 🧠 Creative Orchestration (Gemini 3 Pro)
- **Narrative Architecture**: Generates Loglines, Synopses, and Characters based on distinct themes (Abundance, Ascension, Harmony).
- **Screenplay Generation**: Produces formatted scripts with Scene Headings, Dialogue, and Narration, adhering to strict industry formatting.
- **Visual Outlining**: Creates scene-by-scene breakdowns using a **Compact Data Strip** layout for metadata (Location | Time | Duration), optimizing screen real estate.

### 🎨 Visual & Motion Synthesis
- **Google Veo Integration**: Generates cinematic 1080p video previews.
- **Imagen 3 Integration**: Creates 8K photorealistic film stills for storyboards and moodboards.
- **Prompt Engineering Engine**: Automated refinement system that upgrades generic descriptions into award-winning cinematography prompts.

### 🎛️ Studio Workflow Tools
- **Batch Rendering**: "Render All Images" and "Render All Videos" capability with real-time progress tracking.
- **Smart Refinement**: Bulk actions to "Refine Titles", "Deepen Narrative", and "Analyze Flow" (Dependency mapping).
- **Tactile UI**: A "Physical" interface design where buttons depress, toggles glow neon, and inputs look like rack-mounted hardware cartridges.
- **Official Selection Badge**: Visual branding to elevate the project's prestige.

### 🔊 Audio Engineering
- **TTS Pipeline**: Generates WAV audio stems for dialogue and narration using `gemini-2.5-flash-preview-tts`.
- **Character Voice Assignment**: Automatically maps specific voice models (Kore, Fenrir, Puck, etc.) to characters based on gender and role.
- **Persistent Playback**: Inline audio players with waveform visualization and download capabilities.

### 📄 Production Export
- **PDF Generation**: Compiles the entire project (Script, Characters, Prompts, BTS) into a formatted PDF.
- **Monetization Logic**: Implements a Freemium model (Seed/Sapling/Forest tiers) supporting *Stichting Earth Rising*, with watermarking logic for free users.

---

## 🛠 Tech Stack

*   **Core**: React 19, TypeScript, Vite
*   **Styling**: Tailwind CSS (Custom "Studio" Config: Gunmetal, Cyan, Slate)
*   **AI SDK**: `@google/genai`
*   **Fonts**: Oswald (Headers), Roboto (UI), Courier Prime (Script)
*   **State Management**: React Hooks + LocalStorage Autosave
*   **Utilities**: `jspdf` (Export), Custom WAV Encoder

---

## ⚙️ Installation & Setup

### Prerequisites
*   Node.js v18+
*   A valid Google Cloud Project with Vertex AI enabled.
*   **Note**: Veo Video generation requires a specific trusted tester API key or a paid tier key selected via the client-side UI.

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/rewrite-tomorrow.git
cd rewrite-tomorrow
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory. You must provide a valid API Key for the initial Gemini connection.

```env
API_KEY=your_google_ai_studio_api_key
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 🎨 Design System: "Studio Command"

The UI uses a custom Tailwind configuration to achieve the cinematic look.

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-studio` | `#020617` | Main Background (Slate 950) |
| `bg-gunmetal` | `#0f172a` | Panels & Cards (Slate 900) |
| `text-cyan-400` | `#22d3ee` | Primary Accents & Active States |
| `font-display` | `Oswald` | Headers, Buttons, Labels |
| `font-mono` | `Courier` | Script, Metadata, Technical info |

---

## 🤝 Contribution & Foundation

This tool was built to support **Stichting Earth Rising**, a non-profit dedicated to empowering storytellers to imagine regenerative futures.

**License**: Proprietary / Foundation Use.
**Contact**: info@earthrising.space

---

*Built with ❤️ for the future.*
