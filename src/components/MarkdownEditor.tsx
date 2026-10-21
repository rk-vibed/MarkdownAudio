import React, { useState, useRef } from 'react';
import { marked } from 'marked';
import {
  FileText,
  Upload,
  Eye,
  Edit3,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Clock,
  Layers,
  FileCode,
  FolderOpen,
} from 'lucide-react';
import { SAMPLE_DOCS, SampleDoc } from '../utils/sampleDocs';

interface MarkdownEditorProps {
  markdown: string;
  onChange: (val: string) => void;
  sectionCount: number;
  onOpenDirectoryBrowser: () => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  markdown,
  onChange,
  sectionCount,
  onOpenDirectoryBrowser,
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [copied, setCopied] = useState(false);
  const [showSamplesMenu, setShowSamplesMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats calculation
  const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const chars = markdown.length;
  // Average speaking rate: ~140 words per minute
  const estSeconds = Math.ceil((words / 140) * 60);
  const estMinutes = Math.floor(estSeconds / 60);
  const estRemainingSecs = estSeconds % 60;

  // File upload handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (typeof content === 'string') {
        onChange(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Drag and drop handling
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.markdown'))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (typeof content === 'string') {
          onChange(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadSample = (sample: SampleDoc) => {
    onChange(sample.content);
    setShowSamplesMenu(false);
  };

  // Render markdown HTML
  const renderedHtml = React.useMemo(() => {
    try {
      return marked.parse(markdown || '*No markdown text provided yet.*');
    } catch {
      return '<p>Error rendering markdown preview</p>';
    }
  }, [markdown]);

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="bg-slate-900/70 border border-slate-800 rounded-2xl flex flex-col shadow-xl backdrop-blur-md overflow-hidden h-full flex-1 min-h-0"
    >
      {/* Editor Header Toolbar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'edit'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Markdown Source</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'preview'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Rendered Preview</span>
            </button>
          </div>

          {/* Sample Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSamplesMenu(!showSamplesMenu)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Load Sample</span>
            </button>

            {showSamplesMenu && (
              <div className="absolute left-0 mt-1 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-20">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  Select Sample Document
                </div>
                {SAMPLE_DOCS.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => loadSample(doc)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 transition-colors flex flex-col"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-200">{doc.title}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/20">
                        {doc.badge}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{doc.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenDirectoryBrowser}
            className="px-2.5 py-1 text-xs text-indigo-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/80 hover:border-indigo-500/40 flex items-center gap-1.5 transition-colors"
            title="Browse and select Markdown files from a directory"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Browse Directory</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            accept=".md,.markdown,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/80 flex items-center gap-1.5 transition-colors"
            title="Upload single .md or .txt file"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Upload File</span>
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700/60 transition-colors"
            title="Copy Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => onChange('')}
            className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-rose-950/20 rounded-lg border border-slate-700/60 transition-colors"
            title="Clear text"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 relative overflow-hidden bg-slate-950/60">
        {activeTab === 'edit' ? (
          <textarea
            value={markdown}
            onChange={(e) => onChange(e.target.value)}
            placeholder="# Write or paste your Markdown here...&#10;&#10;Or drop a .md file directly into this editor!"
            className="w-full h-full p-4 font-mono text-xs sm:text-sm text-slate-200 bg-transparent resize-none focus:outline-none leading-relaxed selection:bg-indigo-500/30"
            spellCheck={false}
          />
        ) : (
          <div className="w-full h-full p-5 overflow-y-auto text-slate-200 text-sm leading-relaxed prose prose-invert max-w-none prose-headings:text-indigo-200 prose-headings:font-bold prose-code:text-indigo-300 prose-code:bg-slate-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800">
            <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
          </div>
        )}
      </div>

      {/* Footer Stats Bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>{words.toLocaleString()} words</span>
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline">{chars.toLocaleString()} characters</span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1.5 text-indigo-300">
            <Layers className="w-3.5 h-3.5" />
            <span>{sectionCount} speech sections</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-medium text-emerald-400">
          <Clock className="w-3.5 h-3.5" />
          <span>
            Est. Audio: {estMinutes > 0 ? `${estMinutes}m ` : ''}
            {estRemainingSecs}s
          </span>
        </div>
      </div>
    </div>
  );
};
