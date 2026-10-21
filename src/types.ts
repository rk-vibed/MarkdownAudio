export type VoiceName = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export interface VoiceOption {
  id: VoiceName;
  name: string;
  gender: 'Female' | 'Male';
  trait: string;
  description: string;
  color: string;
}

export type PronunciationCategory = 'Acronym' | 'Tech Term' | 'Name' | 'Abbreviation' | 'Custom';
export type MatchType = 'word' | 'exact' | 'regex';

export interface PronunciationRule {
  id: string;
  word: string;
  replacement: string;
  matchType: MatchType;
  category: PronunciationCategory;
  enabled: boolean;
  notes?: string;
}

export interface MarkdownSpeechSection {
  id: string;
  title: string;
  level: number; // 0 for paragraph/intro, 1-6 for H1-H6
  rawMarkdown: string;
  spokenText: string;
  status: 'idle' | 'generating' | 'ready' | 'error';
  audioBase64?: string;
  audioBlobUrl?: string;
  duration?: number;
  error?: string;
  audioVoice?: string;
  audioStyle?: string;
  audioModel?: string;
}

export interface PreprocessingOptions {
  includeHeadings: boolean;
  headingPrefix: boolean; // e.g. "Section: Title"
  codeBlockBehavior: 'skip' | 'summarize' | 'read';
  linkBehavior: 'text-only' | 'read-domain';
  bulletStyle: 'smooth' | 'announced';
}

export interface WordReplacementMatch {
  ruleId: string;
  originalWord: string;
  replacement: string;
  category: PronunciationCategory;
}

export interface DirectoryFileInfo {
  name: string;
  path: string;
  relativePath?: string;
  size: number;
  modifiedAt?: string;
  title?: string;
  preview?: string;
  wordCount?: number;
  sourceType: 'local' | 'server';
  fileObject?: File;
}
