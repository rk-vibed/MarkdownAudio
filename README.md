# MarkdownAudio Studio 🎙️

**MarkdownAudio Studio** is a full-stack web application that transforms Markdown documents into natural-sounding speech using Gemini 3.8 Text-to-Speech (TTS) models, complete with an interactive **Custom Pronunciation Lexicon** and section-by-section audio synthesis.

---

## ✨ Features

### 1. 📖 Intelligent Markdown Preprocessing
- **Direct File Import**: Drag-and-drop or upload `.md`, `.markdown`, or `.txt` files directly into the studio.
- **Local Directory Browser**:
  - **Server / Workspace Directory**: Point to any local folder (e.g. `./docs`, `./content`, or custom paths) and recursively list all Markdown documents with file sizes, word counts, subdirectories, and heading previews.
  - **Computer Folder Picker**: Uses the browser File System Access API / `webkitdirectory` to select any folder on the user's computer and instantly list all Markdown documents.
  - **1-Click Synthesis**: Preview document content directly in the browser dialog and click *"Load into Studio"* or *"Load & Synthesize All"*.
- **Dual-Mode Editor**: Seamlessly switch between the monospaced Markdown source editor and the formatted HTML preview.
- **Smart Speech Cleaning**:
  - **Code Blocks**: Choose whether to summarize (e.g. *"[Here is a TypeScript code snippet containing 12 lines]"*), read aloud, or omit code blocks entirely.
  - **Links**: Converts Markdown links `[Title](url)` to clean spoken anchor text, with an option to include the website domain.
  - **Headings & Hierarchy**: Automatically recognizes `#`, `##`, `###` headings and decomposes the document into logical speech sections/chapters.
  - **Lists & Formatting**: Strips decorative markdown symbols (`**`, `*`, `~~`, `_`) while retaining conversational cadence.
- **Live Metrics**: Real-time word count, character count, section count, and estimated spoken audio duration.

### 2. 🗣️ Natural-Sounding Voice Models & Tone Direction
- **Powered by Gemini 3.8 Audio Models**:
  - `gemini-3.8-flash-lite-tts`: High efficiency, low latency, and crystal-clear pronunciation for long-form reading and documentation.
  - `gemini-3.8-flash-tts`: Flagship audio model with expressive nuance, vocal styling, and dynamic prosody.
- **5 Prebuilt Persona Voices**:
  - **Kore** *(Female)*: Warm, calm, and soothing — ideal for audiobooks, narratives, and long articles.
  - **Puck** *(Male)*: Youthful, lively, and approachable — great for tutorials and podcasts.
  - **Charon** *(Male)*: Deep, resonant, and cinematic — perfect for documentaries and executive briefs.
  - **Fenrir** *(Male)*: Energetic and bold — punchy cadence for product presentations.
  - **Zephyr** *(Female)*: Smooth, crisp, and balanced — excellent for technical manuals.
- **Instant Voice Audition**: Preview any voice with a single click before generating full audio.
- **Narration Tone Presets**: Direct the delivery style (*Natural & Articulate*, *Audiobook Storyteller*, *Tech Educator*, *Crisp Broadcaster*, *Calm & Mindful*, or custom prompt instructions).

### 3. 📚 Custom Pronunciation Lexicon & AI Term Scanner
- **Phonetic Respelling & Substitutions**: Overcomes TTS mispronunciations of technical jargon, acronyms, and foreign names:
  - `SQL` → `Sequel`
  - `k8s` → `kay-eights`
  - `PostgreSQL` → `Post-gres-Q-L`
  - `Vite` → `Veet`
  - `LaTeX` → `Lay-tek`
  - `OAuth` → `Oh-auth`
  - `e.g.` → `for example`
- **Matching Modes**: Whole-word boundaries (avoids accidental partial replacements), exact case-sensitive matches, or custom regular expressions (Regex).
- **Interactive Rule Audition**: Listen to how the selected voice speaks each rule replacement before applying it.
- **Live Match Counter**: Shows in real-time how many times each pronunciation rule is triggered in the active Markdown document.
- **AI-Powered Term Scanner**: Automatically analyzes the document text to detect technical terms, libraries, and acronyms, suggesting phonetic pronunciations that can be added in one click.
- **Domain Preset Packs**: 1-click import packs for:
  - *DevOps & Cloud Systems* (`k8s`, `NGINX`, `sudo`, `CI/CD`, `YAML`, etc.)
  - *Web & Frontend Development* (`Vite`, `DOM`, `JSX`, `RESTful`, `regex`, etc.)
  - *Academic & Shorthand Abbreviations* (`e.g.`, `i.e.`, `et al.`, `approx.`, `Dr.`, etc.)
- **Import / Export**: Save and share pronunciation dictionaries as JSON files.

### 4. 🎛️ Section-by-Section Studio & Master WAV Concatenation
- **Section Chunking**: Synthesize individual sections independently to iterate rapidly without regenerating the whole document.
- **Spoken Text Inspector**: Visual diff showing the exact text sent to the voice engine, highlighting replaced terms in real-time.
- **Docked Audio Player**:
  - Scrub bar with seeking and timestamp display.
  - Playback speed chips (`0.75x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`).
  - Skip forward/backward 5 seconds.
  - Continuous autoplay mode (smoothly advances through sections).
  - Volume control and mute toggle.
- **Master WAV Stitcher**: Concatenates individual section 24kHz 16-bit mono PCM buffers into a unified, downloadable `.wav` audio file with valid RIFF headers.
- **Asynchronous Local Disk Audio Storage**:
  - Synthesized audio files are safely stored asynchronously on the local disk (`./audio_output/cache/`) keyed deterministically by SHA-256 hash of text, voice, style, and model.
  - On app reload, previously synthesized audio is automatically retrieved from local disk without re-calling the Gemini API.
  - New synthesis calls are only triggered if the section text or voice settings change.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/), [Marked](https://marked.js.org/) for Markdown rendering, [Lucide React](https://lucide.dev/) icons.
- **Backend**: [Express](https://expressjs.com/) proxy server running with [Vite](https://vitejs.dev/) middleware.
- **AI Engine**: `@google/genai` TypeScript SDK invoking Gemini 3.8 TTS and Flash models server-side.
- **Audio Processing**: Client-side WAV concatenation and PCM buffer stitching.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 20 or higher recommended)
- A [Gemini API Key](https://aistudio.google.com/) configured in `.env`

### Environment Configuration

Create a `.env` file in the root directory (based on `.env.example`):

```bash
# Required for server-side Gemini TTS & analysis calls
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

### Installation

Install dependencies:

```bash
npm install
```

### Running the App

Start the full-stack development server on port 3000:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

Compile client assets and verify TypeScript types:

```bash
npm run build
npm run lint
```

Run in production:

```bash
npm start
```

---

## 🐳 Running with Docker

### Option 1: Docker Compose (Recommended)

1. Make sure your `.env` contains `GEMINI_API_KEY="YOUR_KEY"`.
2. Start the container:
   ```bash
   docker compose up --build
   ```
3. Open [http://localhost:3000](http://localhost:3000).

Your local `./docs` and `./audio_output` directories are automatically mounted as volumes, so you can place markdown files in `./docs` and access all generated `.wav` audio files in `./audio_output`.

### Option 2: Docker CLI

Build the Docker image:

```bash
docker build -t markdown-audio-studio .
```

Run the container:

```bash
docker run -d \
  -p 3000:3000 \
  -e GEMINI_API_KEY="YOUR_GEMINI_API_KEY" \
  -v $(pwd)/docs:/app/docs \
  -v $(pwd)/audio_output:/app/audio_output \
  --name markdown-audio-studio \
  markdown-audio-studio
```

---

## 📂 Project Structure

```
├── server.ts                             # Express backend entry point
├── server/                               # Backend services & utilities
│   └── audioCacheKey.ts                  # Deterministic SHA-256 hash key generator for audio cache
├── tests/                                # Backend unit tests
│   └── audioCacheKey.test.ts             # Unit test suite for cache key generation
├── src/
│   ├── components/
│   │   ├── AudioPlayerBar.tsx            # Bottom audio dock with scrub bar, speed & master WAV export
│   │   ├── Header.tsx                    # Top navigation, status indicator & dictionary trigger
│   │   ├── HelpModal.tsx                 # In-app guide and pronunciation tips
│   │   ├── MarkdownEditor.tsx            # Markdown editor, previewer, metrics & sample loader
│   │   ├── PronunciationDictionaryModal.tsx # Rule manager, AI scanner, presets & test audition
│   │   ├── SpeechInspector.tsx           # Section cards, speech text visualizer & highlight badges
│   │   └── VoiceSettings.tsx             # Voice picker, audition buttons & style presets
│   ├── utils/
│   │   ├── audioConcat.ts                # Binary WAV stitching and base64 audio decoders
│   │   ├── markdownSpeech.ts             # Markdown syntax cleaner and section segmenter
│   │   ├── pronunciation.ts              # Word-boundary substitution engine, presets & defaults
│   │   └── sampleDocs.ts                 # Pre-loaded Markdown sample documents
│   ├── types.ts                          # Shared TypeScript interfaces and enums
│   ├── App.tsx                           # Main application controller and state management
│   ├── index.css                         # Global CSS with Tailwind CSS v4
│   └── main.tsx                          # React entry point
├── index.html                            # HTML template with SEO tags
├── package.json                          # Dependencies and scripts
├── tsconfig.json                         # TypeScript configuration
└── vite.config.ts                        # Vite configuration
```

---

## 📄 License

This project is open-source and available under the [Apache-2.0 License](LICENSE).
