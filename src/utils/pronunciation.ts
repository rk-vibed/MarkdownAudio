import { PronunciationRule, PronunciationCategory } from '../types';

export const DEFAULT_PRONUNCIATION_RULES: PronunciationRule[] = [
  {
    id: 'rule-sql',
    word: 'SQL',
    replacement: 'Sequel',
    matchType: 'word',
    category: 'Acronym',
    enabled: true,
    notes: 'Industry standard pronunciation for Structured Query Language',
  },
  {
    id: 'rule-k8s',
    word: 'k8s',
    replacement: 'kay-eights',
    matchType: 'word',
    category: 'Tech Term',
    enabled: true,
    notes: 'Shortened name for Kubernetes',
  },
  {
    id: 'rule-kubernetes',
    word: 'Kubernetes',
    replacement: 'koo-ber-net-eez',
    matchType: 'word',
    category: 'Tech Term',
    enabled: true,
    notes: 'Phonetic breakdown of Kubernetes',
  },
  {
    id: 'rule-postgres',
    word: 'PostgreSQL',
    replacement: 'Post-gres-Q-L',
    matchType: 'word',
    category: 'Tech Term',
    enabled: true,
    notes: 'Natural cadence for PostgreSQL',
  },
  {
    id: 'rule-vite',
    word: 'Vite',
    replacement: 'Veet',
    matchType: 'word',
    category: 'Tech Term',
    enabled: true,
    notes: 'French pronunciation for fast',
  },
  {
    id: 'rule-latex',
    word: 'LaTeX',
    replacement: 'Lay-tek',
    matchType: 'word',
    category: 'Tech Term',
    enabled: true,
    notes: 'Standard pronunciation for document typesetting system',
  },
  {
    id: 'rule-gif',
    word: 'GIF',
    replacement: 'Jif',
    matchType: 'word',
    category: 'Acronym',
    enabled: false,
    notes: 'Pronounced as Jif or Giff based on preference',
  },
  {
    id: 'rule-oauth',
    word: 'OAuth',
    replacement: 'Oh-auth',
    matchType: 'word',
    category: 'Acronym',
    enabled: true,
    notes: 'Open Authorization protocol',
  },
  {
    id: 'rule-cli',
    word: 'CLI',
    replacement: 'C-L-I',
    matchType: 'word',
    category: 'Acronym',
    enabled: true,
    notes: 'Spelled out letters for Command Line Interface',
  },
  {
    id: 'rule-gui',
    word: 'GUI',
    replacement: 'gooey',
    matchType: 'word',
    category: 'Acronym',
    enabled: true,
    notes: 'Pronounced gooey',
  },
  {
    id: 'rule-json',
    word: 'JSON',
    replacement: 'jay-sahn',
    matchType: 'word',
    category: 'Tech Term',
    enabled: true,
    notes: 'Phonetic pronunciation for JavaScript Object Notation',
  },
  {
    id: 'rule-yaml',
    word: 'YAML',
    replacement: 'yam-el',
    matchType: 'word',
    category: 'Tech Term',
    enabled: true,
    notes: 'Phonetic pronunciation for YAML',
  },
  {
    id: 'rule-eg',
    word: 'e.g.',
    replacement: 'for example',
    matchType: 'exact',
    category: 'Abbreviation',
    enabled: true,
    notes: 'Exempli gratia converted to natural speech',
  },
  {
    id: 'rule-ie',
    word: 'i.e.',
    replacement: 'that is',
    matchType: 'exact',
    category: 'Abbreviation',
    enabled: true,
    notes: 'Id est converted to natural spoken English',
  },
  {
    id: 'rule-etc',
    word: 'etc.',
    replacement: 'etcetera',
    matchType: 'exact',
    category: 'Abbreviation',
    enabled: true,
    notes: 'Expanded full latin word',
  },
  {
    id: 'rule-dr',
    word: 'Dr.',
    replacement: 'Doctor',
    matchType: 'word',
    category: 'Abbreviation',
    enabled: true,
    notes: 'Title expansion',
  },
];

export const PRESET_PACKS: { name: string; description: string; rules: Omit<PronunciationRule, 'id'>[] }[] = [
  {
    name: 'DevOps & Cloud Systems',
    description: 'Essential pronunciations for DevOps, containerization, and backend infrastructure.',
    rules: [
      { word: 'k8s', replacement: 'kay-eights', matchType: 'word', category: 'Tech Term', enabled: true, notes: 'Kubernetes' },
      { word: 'Kubernetes', replacement: 'koo-ber-net-eez', matchType: 'word', category: 'Tech Term', enabled: true },
      { word: 'NGINX', replacement: 'Engine-X', matchType: 'word', category: 'Tech Term', enabled: true },
      { word: 'sudo', replacement: 'soo-doo', matchType: 'word', category: 'Tech Term', enabled: true },
      { word: 'chmod', replacement: 'ch-mod', matchType: 'word', category: 'Tech Term', enabled: true },
      { word: 'stdout', replacement: 'standard out', matchType: 'word', category: 'Tech Term', enabled: true },
      { word: 'stderr', replacement: 'standard error', matchType: 'word', category: 'Tech Term', enabled: true },
      { word: 'CI/CD', replacement: 'C-I C-D', matchType: 'word', category: 'Acronym', enabled: true },
      { word: 'YAML', replacement: 'yam-el', matchType: 'word', category: 'Tech Term', enabled: true },
      { word: 'SaaS', replacement: 'sass', matchType: 'word', category: 'Acronym', enabled: true },
    ],
  },
  {
    name: 'Web & Frontend Development',
    description: 'Clean pronunciations for modern UI, JavaScript, and CSS frameworks.',
    rules: [
      { word: 'Vite', replacement: 'Veet', matchType: 'word', category: 'Tech Term', enabled: true },
      { word: 'DOM', replacement: 'Dahm', matchType: 'word', category: 'Acronym', enabled: true },
      { word: 'CSS', replacement: 'C-S-S', matchType: 'word', category: 'Acronym', enabled: true },
      { word: 'HTML', replacement: 'H-T-M-L', matchType: 'word', category: 'Acronym', enabled: true },
      { word: 'JSX', replacement: 'J-S-X', matchType: 'word', category: 'Acronym', enabled: true },
      { word: 'TSX', replacement: 'T-S-X', matchType: 'word', category: 'Acronym', enabled: true },
      { word: 'regex', replacement: 'reg-ex', matchType: 'word', category: 'Tech Term', enabled: true },
      { word: 'SVG', replacement: 'S-V-G', matchType: 'word', category: 'Acronym', enabled: true },
      { word: 'RESTful', replacement: 'rest-full', matchType: 'word', category: 'Tech Term', enabled: true },
      { word: 'async/await', replacement: 'async await', matchType: 'word', category: 'Tech Term', enabled: true },
    ],
  },
  {
    name: 'Academic, Formal & Abbreviations',
    description: 'Expands common Latin and formal shorthand into fluent spoken prose.',
    rules: [
      { word: 'e.g.', replacement: 'for example', matchType: 'exact', category: 'Abbreviation', enabled: true },
      { word: 'i.e.', replacement: 'that is', matchType: 'exact', category: 'Abbreviation', enabled: true },
      { word: 'etc.', replacement: 'etcetera', matchType: 'exact', category: 'Abbreviation', enabled: true },
      { word: 'vs.', replacement: 'versus', matchType: 'word', category: 'Abbreviation', enabled: true },
      { word: 'et al.', replacement: 'et all', matchType: 'exact', category: 'Abbreviation', enabled: true },
      { word: 'approx.', replacement: 'approximately', matchType: 'word', category: 'Abbreviation', enabled: true },
      { word: 'Dr.', replacement: 'Doctor', matchType: 'word', category: 'Abbreviation', enabled: true },
      { word: 'Prof.', replacement: 'Professor', matchType: 'word', category: 'Abbreviation', enabled: true },
      { word: 'viz.', replacement: 'namely', matchType: 'exact', category: 'Abbreviation', enabled: true },
      { word: 'w.r.t.', replacement: 'with respect to', matchType: 'exact', category: 'Abbreviation', enabled: true },
    ],
  },
];

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Applies active pronunciation rules to a text string.
 * Uses word boundaries for 'word' type rules to prevent partial word mangling (e.g., "SQL" in "SQL_DATABASE" vs "DISQUALIFY").
 */
export function applyPronunciationRules(
  text: string,
  rules: PronunciationRule[]
): {
  processedText: string;
  appliedCount: number;
  matchedRules: { rule: PronunciationRule; count: number }[];
} {
  let result = text;
  let totalApplied = 0;
  const matchedRules: { rule: PronunciationRule; count: number }[] = [];

  const activeRules = rules.filter((r) => r.enabled && r.word.trim() && r.replacement.trim());

  for (const rule of activeRules) {
    try {
      let regex: RegExp;
      const escaped = escapeRegex(rule.word.trim());

      if (rule.matchType === 'regex') {
        regex = new RegExp(rule.word, 'g');
      } else if (rule.matchType === 'exact') {
        // Case-sensitive, exact word or symbol
        // If word contains punctuation (e.g. "e.g.") avoid simple \b boundary
        if (/[^a-zA-Z0-9_]/.test(rule.word)) {
          regex = new RegExp(escaped, 'g');
        } else {
          regex = new RegExp(`\\b${escaped}\\b`, 'g');
        }
      } else {
        // 'word': case-insensitive whole word
        if (/[^a-zA-Z0-9_]/.test(rule.word)) {
          regex = new RegExp(escaped, 'gi');
        } else {
          regex = new RegExp(`\\b${escaped}\\b`, 'gi');
        }
      }

      const matches = result.match(regex);
      const count = matches ? matches.length : 0;

      if (count > 0) {
        result = result.replace(regex, rule.replacement);
        totalApplied += count;
        matchedRules.push({ rule, count });
      }
    } catch (e) {
      console.warn(`Error applying pronunciation rule for "${rule.word}":`, e);
    }
  }

  return {
    processedText: result,
    appliedCount: totalApplied,
    matchedRules,
  };
}

/**
 * Counts how many times a given rule would match in the text
 */
export function countRuleMatchesInText(text: string, rule: PronunciationRule): number {
  if (!text || !rule.word.trim()) return 0;
  try {
    let regex: RegExp;
    const escaped = escapeRegex(rule.word.trim());
    if (rule.matchType === 'regex') {
      regex = new RegExp(rule.word, 'g');
    } else if (rule.matchType === 'exact') {
      if (/[^a-zA-Z0-9_]/.test(rule.word)) {
        regex = new RegExp(escaped, 'g');
      } else {
        regex = new RegExp(`\\b${escaped}\\b`, 'g');
      }
    } else {
      if (/[^a-zA-Z0-9_]/.test(rule.word)) {
        regex = new RegExp(escaped, 'gi');
      } else {
        regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      }
    }
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  } catch {
    return 0;
  }
}
