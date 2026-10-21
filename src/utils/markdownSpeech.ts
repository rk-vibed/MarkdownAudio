import { MarkdownSpeechSection, PreprocessingOptions, PronunciationRule } from '../types';
import { applyPronunciationRules } from './pronunciation';

export const DEFAULT_PREPROCESSING_OPTIONS: PreprocessingOptions = {
  includeHeadings: true,
  headingPrefix: true,
  codeBlockBehavior: 'summarize',
  linkBehavior: 'text-only',
  bulletStyle: 'smooth',
};

/**
 * Clean a single markdown block into natural spoken English
 */
export function cleanMarkdownForSpeech(
  markdown: string,
  options: PreprocessingOptions = DEFAULT_PREPROCESSING_OPTIONS
): string {
  let text = markdown;

  // 1. Handle Code blocks ```lang\ncode\n```
  text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    if (options.codeBlockBehavior === 'skip') {
      return '';
    }
    if (options.codeBlockBehavior === 'summarize') {
      const languageName = lang ? `${lang} ` : '';
      const lineCount = code.trim().split('\n').length;
      return ` [Here is a ${languageName}code snippet containing ${lineCount} lines.] `;
    }
    // 'read': Clean code slightly for vocalization
    return ` [Code begins: ${code.replace(/[{}[\]();]/g, ' ')} Code ends.] `;
  });

  // 2. Handle Markdown Images ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, (_match, alt) => {
    return alt ? ` [Image: ${alt}] ` : '';
  });

  // 3. Handle Markdown Links [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, linkText, url) => {
    if (options.linkBehavior === 'read-domain') {
      try {
        const domain = new URL(url).hostname.replace('www.', '');
        return `${linkText} on ${domain}`;
      } catch {
        return linkText;
      }
    }
    return linkText;
  });

  // 4. Handle HTML tags <tag>...</tag>
  text = text.replace(/<\/?[^>]+(>|$)/g, ' ');

  // 5. Handle blockquotes >
  text = text.replace(/^\s*>\s?/gm, '');

  // 6. Handle horizontal rules
  text = text.replace(/^[-*_]{3,}\s*$/gm, '');

  // 7. Handle Bullet and Numbered Lists
  // Replace "- item" or "* item" with clean text followed by comma or pause
  text = text.replace(/^\s*[-*+]\s+/gm, '• ');
  text = text.replace(/^\s*(\d+)\.\s+/gm, '$1: ');

  // 8. Handle Inline code `something`
  text = text.replace(/`([^`]+)`/g, '$1');

  // 9. Handle bold and italic (**bold**, *italic*, __bold__, _italic_, ~~strike~~)
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');
  text = text.replace(/~~([^~]+)~~/g, '$1');

  // 10. Normalize multiple punctuation and spacing
  text = text.replace(/\n\s*\n+/g, '\n\n');
  text = text.replace(/[ \t]+/g, ' ');
  text = text.trim();

  return text;
}

/**
 * Splits a full markdown string into structured sections based on Headings (#, ##, ###)
 * and standalone paragraphs.
 */
export function parseMarkdownSections(
  markdown: string,
  options: PreprocessingOptions = DEFAULT_PREPROCESSING_OPTIONS,
  rules: PronunciationRule[] = []
): MarkdownSpeechSection[] {
  if (!markdown || !markdown.trim()) {
    return [];
  }

  const lines = markdown.split('\n');
  const sections: MarkdownSpeechSection[] = [];

  let currentTitle = 'Introduction';
  let currentLevel = 0;
  let currentRawLines: string[] = [];
  let sectionIndex = 0;

  const pushCurrentSection = () => {
    if (currentRawLines.length === 0) return;
    const rawMarkdown = currentRawLines.join('\n').trim();
    if (!rawMarkdown) return;

    // Clean text for speech
    let spoken = cleanMarkdownForSpeech(rawMarkdown, options);

    // If section has a title and user wants heading announced:
    if (currentLevel > 0 && options.includeHeadings) {
      const prefix = options.headingPrefix ? `Section: ${currentTitle}. ` : `${currentTitle}. `;
      // Avoid duplicate title if already starts with title
      if (!spoken.toLowerCase().startsWith(currentTitle.toLowerCase())) {
        spoken = `${prefix}${spoken}`;
      }
    }

    // Apply custom pronunciation rules
    const { processedText } = applyPronunciationRules(spoken, rules);

    sections.push({
      id: `sec-${sectionIndex++}`,
      title: currentTitle,
      level: currentLevel,
      rawMarkdown,
      spokenText: processedText.trim(),
      status: 'idle',
    });

    currentRawLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headerMatch) {
      // Flush previous section
      pushCurrentSection();

      currentLevel = headerMatch[1].length;
      currentTitle = headerMatch[2].trim().replace(/[*_`#]/g, '');
      currentRawLines.push(line);
    } else {
      currentRawLines.push(line);
    }
  }

  // Push final section
  pushCurrentSection();

  // If no sections were formed, create a single fallback section
  if (sections.length === 0 && markdown.trim()) {
    const spoken = cleanMarkdownForSpeech(markdown, options);
    const { processedText } = applyPronunciationRules(spoken, rules);
    sections.push({
      id: 'sec-0',
      title: 'Full Document',
      level: 0,
      rawMarkdown: markdown,
      spokenText: processedText,
      status: 'idle',
    });
  }

  return sections;
}
