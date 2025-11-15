
# 🎬 Rewrite Tomorrow Film Generator

**AI-powered film creation toolkit for the 1 Billion Summit AI Film Award**

Rewrite Tomorrow Film Generator is an intelligent, end-to-end **AI co-pilot for filmmakers**.
It transforms high-level creative ideas into a complete, production-ready film package — including a script, storyboard, moodboard, and AI-generated video clips — all aligned with the *Rewrite Tomorrow* theme of positive future narratives.

Built specifically for submissions to the **1 Billion Summit AI Film Award**, the app uses the full power of Google’s Gemini model family (Gemini Pro, Imagen, Veo) to deliver a seamless, professional pre-production pipeline.

---

## 🚀 What It Does

The application functions as a **comprehensive pre-production suite**, allowing filmmakers to move from concept to visual assets within minutes. Every asset is editable, re-generatable, and optimized for a 7–10 minute AI-generated short film.

---

## ✨ Core Features

### **1. Guided Creative Input**

Users make four foundational creative decisions:

* **Theme**
* **Narrative Tone**
* **Visual Style**
* **Emotional Arc**

These inputs guide every subsequent AI-driven stage of development.

---

### **2. Full Creative Asset Generation**

The system generates all essential storytelling components in a single workflow:

* **Characters** — Cast list with roles, personality notes, and story function
* **Script** — A fully formatted narrative with dialogue and narration
* **Visual Outline** — Detailed scene-by-scene storyboard with locations, timing, transitions
* **Moodboard** — Imagen-generated reference visuals defining cinematic style
* **Behind-the-Scenes Document** — A polished, competition-ready BTS narrative explaining the AI-driven process

All content is tailored to the competition's criteria and storytelling framework.

---

### **3. Interactive Editing Suite**

Everything generated can be edited inside the application:

* Rewrite dialogue
* Adjust scenes
* Modify character arcs
* Update prompts for images or videos

Autosave ensures creators never lose progress.

---

### **4. AI-Powered Visual Production**

The most advanced feature: converting the storyboard into real visuals.

* **Preview Mode** — Generate static storyboard frames using Imagen-style prompts
* **Video Mode** — Create fully animated scene clips with Veo, matched to duration, pacing, and style
* **Cinematic Fidelity** — Each clip respects the chosen visual grammar, mood, and color language

---

### **5. Advanced Workflow Tools**

Designed for speed and creative control:

* **Bulk Generation** — Create all missing previews, prompts, or videos in one click
* **Generate Full Film** — Fully automated pipeline producing every clip in sequence
* **Prompt Enhancer** — AI improves all visual prompts for clarity and cinematic depth
* **Scene Dependencies** — Enforce continuity by generating scenes in logical order

---

## 🎥 The Production Pipeline

1. **Envision** — User selects thematic + stylistic direction
2. **Generate** — AI produces script, characters, and storyboard
3. **Refine** — User edits, rewrites, and polishes
4. **Visualize** — Generate preview images
5. **Animate** — Generate full-motion video clips

The result: a **7–10 minute short film blueprint**, ready for final editing and competition submission.

---

## 🌟 Why It Matters

Rewrite Tomorrow Film Generator showcases the future of filmmaking:
a **human–AI partnership** where vision and technology merge to accelerate storytelling, democratize production, and empower filmmakers to imagine better futures.

---
Hier is een **professionele GitHub-introsectie** met badges, inclusief een duidelijke juridische disclaimer dat **niemand dit project zonder toestemming mag gebruiken, kopiëren of distribueren** — precies zoals je wilt.
Daaronder staat een strakke **Installation**-sectie.

Je kunt dit direct in **README.md** plakken.

---

# 🌟 Rewrite Tomorrow Film Generator

![Build Status](https://img.shields.io/badge/build-passing-4CAF50)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-red)

> **⚠️ Important Notice**
> This project is **NOT open source**.
> All rights are fully reserved by **Roos van der Jagt / Earth Rising Foundation**.
>
> **No part of this code, design, workflow, prompt architecture, UI, or documentation may be copied, reproduced, forked, modified, or redistributed without explicit written permission.**
>
> Unauthorized use will be considered a violation of intellectual property rights.

---

## 📦 Installation

### **1. Clone the Repository**

```bash
git clone https://github.com/doubleoroos/1-billion-followers-script-generator.git
cd 1-billion-followers-script-generator
```

### **2. Install Dependencies**

*(Choose your environment — both examples included)*

#### **Node / JavaScript**

```bash
npm install
```

#### **Python (if using Gemini Python SDK)**

```bash
pip install -r requirements.txt
```

#### **Flutter (if applicable)**

```bash
flutter pub get
```

---

### **3. Set Up Environment Variables**

Create a `.env` file in the project root:

```
GEMINI_API_KEY=your_api_key_here
VEO_API_KEY=your_api_key_here
IMAGEN_API_KEY=your_api_key_here
```

> **Note:** Gemini + Veo require authenticated access.
> Never commit API keys to GitHub.

---

### **4. Start the Development Server**

#### Web

```bash
npm run dev
```

#### Flutter

```bash
flutter run
```

---

### **5. Build for Production**

#### Web

```bash
npm run build
```

#### Flutter

```bash
flutter build release
```

---

### **6. Run the App**

Once dependencies are installed and the environment is configured, the app can be accessed at:

```
http://localhost:3000/
```

(or the port configured in your dev environment)



<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/136gwHAsH5Rr9Exh9oaXkLQdZc6jEG5aq

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
