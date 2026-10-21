import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));

// Shared Gemini client with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Supported prebuilt voices
const VALID_VOICES = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'] as const;
type VoiceName = typeof VALID_VOICES[number];

// POST /api/tts/generate
// Generates speech for a single text chunk
app.post('/api/tts/generate', async (req: Request, res: Response) => {
  try {
    const { text, voice = 'Kore', style, model = 'gemini-3.8-flash-lite-tts' } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    const selectedVoice: VoiceName = VALID_VOICES.includes(voice) ? voice : 'Kore';
    const selectedModel = model === 'gemini-3.8-flash-tts' ? 'gemini-3.8-flash-tts' : 'gemini-3.8-flash-lite-tts';

    const speechPart: any = {
      text: text.trim(),
    };

    if (style && typeof style === 'string' && style.trim()) {
      speechPart.speechMetadata = {
        style: style.trim(),
      };
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: [
        {
          role: 'user',
          parts: [speechPart],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find((p: any) => p.inlineData?.data);
    const audioBase64 = audioPart?.inlineData?.data;
    const mimeType = audioPart?.inlineData?.mimeType || 'audio/wav';

    if (!audioBase64) {
      return res.status(500).json({ error: 'No audio data returned from speech synthesis model.' });
    }

    return res.json({
      audioBase64,
      mimeType,
      voice: selectedVoice,
      model: selectedModel,
    });
  } catch (error: any) {
    console.error('Error generating speech:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to synthesize speech',
    });
  }
});

// POST /api/tts/suggest-pronunciations
// Automatically detects technical words, acronyms, and names in Markdown and suggests pronunciation adjustments
app.post('/api/tts/suggest-pronunciations', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Markdown text is required' });
    }

    // Call Gemini to identify tricky terms and recommend phonetic/spoken respellings
    const prompt = `Analyze this markdown text and identify terms that a text-to-speech voice might mispronounce.
Look for:
- Acronyms (e.g. SQL, REST, CLI, SaaS, GUI, JWT, k8s, YAML)
- Technical words and libraries (e.g. Kubernetes, NGINX, LaTeX, Vite, PyTorch, Scikit, PostgreSQL)
- Foreign names, brand names, or jargon
- Ambiguous words (e.g. 'read' in past tense, 'lead' as metal)

For each term, provide:
1. "word": the exact term as it appears in the text
2. "pronunciation": clear phonetic or natural respelling for natural speech (e.g., "Sequel", "kay-eights", "engine-x", "lay-tek", "veet")
3. "category": one of "Acronym", "Tech Term", "Name", "Abbreviation", or "Other"
4. "reason": a short 5-10 word explanation why this pronunciation is recommended

Only return terms actually present in the provided text. Return maximum 12 high-value suggestions.

Markdown Text:
${text.slice(0, 4000)}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              pronunciation: { type: Type.STRING },
              category: { type: Type.STRING },
              reason: { type: Type.STRING },
            },
            required: ['word', 'pronunciation'],
          },
        },
      },
    });

    const suggestions = JSON.parse(response.text || '[]');
    return res.json({ suggestions });
  } catch (error: any) {
    console.error('Error suggesting pronunciations:', error);
    return res.status(500).json({ error: error?.message || 'Failed to analyze pronunciations' });
  }
});

// Helper to scan directory for markdown files
async function scanMarkdownFiles(dirPath: string, rootDir: string): Promise<any[]> {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const results: any[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const nested = await scanMarkdownFiles(fullPath, rootDir);
        results.push(...nested);
      } else if (entry.isFile() && /\.(md|markdown|txt)$/i.test(entry.name)) {
        try {
          const stats = await fs.promises.stat(fullPath);
          const fileContent = await fs.promises.readFile(fullPath, 'utf-8');
          const firstHeadingMatch = fileContent.match(/^#\s+(.+)$/m);
          const title = firstHeadingMatch
            ? firstHeadingMatch[1].trim().replace(/[*_`]/g, '')
            : entry.name.replace(/\.[^/.]+$/, '');
          const cleanPreview = fileContent.replace(/[#*`_>]/g, '').trim().slice(0, 150);
          const wordCount = fileContent.trim() ? fileContent.trim().split(/\s+/).length : 0;

          results.push({
            name: entry.name,
            path: fullPath,
            relativePath: path.relative(rootDir, fullPath),
            size: stats.size,
            modifiedAt: stats.mtime.toISOString(),
            title,
            preview: cleanPreview,
            wordCount,
            sourceType: 'server',
          });
        } catch (err) {
          console.warn(`Could not read file ${fullPath}:`, err);
        }
      }
    }
    return results;
  } catch (err) {
    console.error(`Failed to scan dir ${dirPath}:`, err);
    return [];
  }
}

// POST /api/directory/list
// Lists all markdown and text files in a given directory path
app.post('/api/directory/list', async (req: Request, res: Response) => {
  try {
    const requestedDir = req.body?.directoryPath ? String(req.body.directoryPath).trim() : './docs';
    const resolvedPath = path.isAbsolute(requestedDir)
      ? path.normalize(requestedDir)
      : path.resolve(process.cwd(), requestedDir);

    if (!fs.existsSync(resolvedPath)) {
      if (requestedDir === './docs' || requestedDir === 'docs') {
        await fs.promises.mkdir(resolvedPath, { recursive: true });
      } else {
        return res.status(404).json({ error: `Directory not found: ${requestedDir}` });
      }
    }

    const stat = await fs.promises.stat(resolvedPath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: `Path is not a directory: ${requestedDir}` });
    }

    // List subdirectories for folder navigation
    const entries = await fs.promises.readdir(resolvedPath, { withFileTypes: true });
    const subdirectories: string[] = [];
    for (const e of entries) {
      if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'dist') {
        subdirectories.push(e.name);
      }
    }

    // Scan markdown files
    const files = await scanMarkdownFiles(resolvedPath, resolvedPath);

    return res.json({
      currentDirectory: resolvedPath,
      displayPath: path.relative(process.cwd(), resolvedPath) || '.',
      parentDirectory: path.dirname(resolvedPath),
      subdirectories,
      files,
    });
  } catch (error: any) {
    console.error('Error listing directory:', error);
    return res.status(500).json({ error: error?.message || 'Failed to list directory' });
  }
});

// POST /api/directory/read
// Reads content of a selected markdown file
app.post('/api/directory/read', async (req: Request, res: Response) => {
  try {
    const { filePath } = req.body;
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'File path is required' });
    }

    const resolvedPath = path.isAbsolute(filePath)
      ? path.normalize(filePath)
      : path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: `File not found: ${filePath}` });
    }

    const stat = await fs.promises.stat(resolvedPath);
    if (!stat.isFile()) {
      return res.status(400).json({ error: `Path is not a file: ${filePath}` });
    }

    const content = await fs.promises.readFile(resolvedPath, 'utf-8');
    return res.json({
      content,
      fileName: path.basename(resolvedPath),
      filePath: resolvedPath,
      size: stat.size,
      modifiedAt: stat.mtime.toISOString(),
    });
  } catch (error: any) {
    console.error('Error reading file:', error);
    return res.status(500).json({ error: error?.message || 'Failed to read file' });
  }
});

// POST /api/audio/save
// Saves converted audio WAV file directly to a local directory (defaults to ./audio_output)
app.post('/api/audio/save', async (req: Request, res: Response) => {
  try {
    const { fileName, audioBase64, outputDir = './audio_output' } = req.body;
    if (!fileName || !audioBase64) {
      return res.status(400).json({ error: 'fileName and audioBase64 are required' });
    }

    const safeFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const cleanFileName = safeFileName.endsWith('.wav') ? safeFileName : `${safeFileName}.wav`;
    const targetDir = path.isAbsolute(outputDir)
      ? path.normalize(outputDir)
      : path.resolve(process.cwd(), outputDir);

    if (!fs.existsSync(targetDir)) {
      await fs.promises.mkdir(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, cleanFileName);
    const buffer = Buffer.from(audioBase64, 'base64');
    await fs.promises.writeFile(filePath, buffer);

    return res.json({
      success: true,
      fileName: cleanFileName,
      relativePath: path.relative(process.cwd(), filePath),
      fullPath: filePath,
      size: buffer.length,
    });
  } catch (error: any) {
    console.error('Error saving audio file:', error);
    return res.status(500).json({ error: error?.message || 'Failed to save audio file to disk' });
  }
});

// GET /api/audio/list
// Lists all saved audio files in ./audio_output
app.get('/api/audio/list', async (_req: Request, res: Response) => {
  try {
    const outputDir = path.resolve(process.cwd(), './audio_output');
    if (!fs.existsSync(outputDir)) {
      await fs.promises.mkdir(outputDir, { recursive: true });
    }

    const entries = await fs.promises.readdir(outputDir, { withFileTypes: true });
    const files: any[] = [];
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.wav')) {
        const filePath = path.join(outputDir, entry.name);
        const stat = await fs.promises.stat(filePath);
        files.push({
          name: entry.name,
          path: filePath,
          relativePath: path.relative(process.cwd(), filePath),
          size: stat.size,
          modifiedAt: stat.mtime.toISOString(),
        });
      }
    }

    return res.json({
      outputDir: path.relative(process.cwd(), outputDir),
      files: files.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()),
    });
  } catch (error: any) {
    console.error('Error listing audio files:', error);
    return res.status(500).json({ error: error?.message || 'Failed to list audio files' });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`MarkdownAudio Studio server listening on port ${PORT}`);
  });
}

startServer();
