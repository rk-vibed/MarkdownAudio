import React, { useState } from 'react';
import { PronunciationRule, PronunciationCategory, MatchType, VoiceName } from '../types';
import { PRESET_PACKS, countRuleMatchesInText } from '../utils/pronunciation';
import {
  BookOpen,
  Plus,
  Trash2,
  Volume2,
  Sparkles,
  Download,
  Upload,
  Search,
  CheckCircle2,
  X,
  RotateCcw,
  Loader2,
  Lightbulb,
} from 'lucide-react';

interface PronunciationDictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: PronunciationRule[];
  onUpdateRules: (rules: PronunciationRule[]) => void;
  activeMarkdownText: string;
  selectedVoice: VoiceName;
  onResetDefaults: () => void;
}

export const PronunciationDictionaryModal: React.FC<PronunciationDictionaryModalProps> = ({
  isOpen,
  onClose,
  rules,
  onUpdateRules,
  activeMarkdownText,
  selectedVoice,
  onResetDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'suggestions' | 'presets'>('rules');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [testingRuleId, setTestingRuleId] = useState<string | null>(null);

  // New rule form state
  const [newWord, setNewWord] = useState('');
  const [newReplacement, setNewReplacement] = useState('');
  const [newMatchType, setNewMatchType] = useState<MatchType>('word');
  const [newCategory, setNewCategory] = useState<PronunciationCategory>('Tech Term');
  const [newNotes, setNewNotes] = useState('');

  // AI Suggestions state
  const [isScanning, setIsScanning] = useState(false);
  const [suggestions, setSuggestions] = useState<
    { word: string; pronunciation: string; category: string; reason: string }[]
  >([]);

  if (!isOpen) return null;

  // Filter rules
  const filteredRules = rules.filter((rule) => {
    const matchesSearch =
      rule.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.replacement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rule.notes && rule.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || rule.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Test pronunciation rule via backend TTS
  const testPronunciation = async (ruleId: string, textToSpeak: string) => {
    try {
      setTestingRuleId(ruleId);
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Pronounced as: ${textToSpeak}`,
          voice: selectedVoice,
          style: 'Clear, articulate, natural pronunciation',
        }),
      });
      const data = await res.json();
      if (data.audioBase64) {
        const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
        audio.play();
      }
    } catch (err) {
      console.error('Failed to audition pronunciation rule:', err);
    } finally {
      setTestingRuleId(null);
    }
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newReplacement.trim()) return;

    const newRule: PronunciationRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      word: newWord.trim(),
      replacement: newReplacement.trim(),
      matchType: newMatchType,
      category: newCategory,
      enabled: true,
      notes: newNotes.trim() || undefined,
    };

    onUpdateRules([newRule, ...rules]);
    setNewWord('');
    setNewReplacement('');
    setNewNotes('');
  };

  const handleToggleRule = (id: string) => {
    onUpdateRules(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const handleDeleteRule = (id: string) => {
    onUpdateRules(rules.filter((r) => r.id !== id));
  };

  // AI-assisted document scanner
  const handleScanMarkdown = async () => {
    if (!activeMarkdownText.trim()) return;
    try {
      setIsScanning(true);
      setActiveTab('suggestions');
      const res = await fetch('/api/tts/suggest-pronunciations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: activeMarkdownText }),
      });
      const data = await res.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddSuggestion = (s: { word: string; pronunciation: string; category: string; reason: string }) => {
    // Avoid duplicate
    const exists = rules.some((r) => r.word.toLowerCase() === s.word.toLowerCase());
    if (exists) return;

    const rule: PronunciationRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      word: s.word,
      replacement: s.pronunciation,
      matchType: 'word',
      category: (s.category as PronunciationCategory) || 'Tech Term',
      enabled: true,
      notes: s.reason,
    };
    onUpdateRules([rule, ...rules]);
    setSuggestions(suggestions.filter((item) => item.word !== s.word));
  };

  const handleAddAllSuggestions = () => {
    const newItems: PronunciationRule[] = suggestions
      .filter((s) => !rules.some((r) => r.word.toLowerCase() === s.word.toLowerCase()))
      .map((s) => ({
        id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        word: s.word,
        replacement: s.pronunciation,
        matchType: 'word',
        category: (s.category as PronunciationCategory) || 'Tech Term',
        enabled: true,
        notes: s.reason,
      }));

    onUpdateRules([...newItems, ...rules]);
    setSuggestions([]);
    setActiveTab('rules');
  };

  // Preset import
  const handleImportPreset = (presetRules: Omit<PronunciationRule, 'id'>[]) => {
    const existingWords = new Set(rules.map((r) => r.word.toLowerCase()));
    const toAdd: PronunciationRule[] = [];

    for (const r of presetRules) {
      if (!existingWords.has(r.word.toLowerCase())) {
        toAdd.push({
          ...r,
          id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        });
        existingWords.add(r.word.toLowerCase());
      }
    }

    onUpdateRules([...toAdd, ...rules]);
    setActiveTab('rules');
  };

  // Export & Import JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(rules, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'markdown_audio_pronunciations.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          onUpdateRules(imported);
        }
      } catch (err) {
        console.error('Invalid JSON file:', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">Pronunciation Lexicon & Rules</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {rules.filter((r) => r.enabled).length} Active Rules
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Override how acronyms, technical terms, and names are spoken by natural voices
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleScanMarkdown}
              disabled={isScanning || !activeMarkdownText.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-950/40 flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Automatically detect technical terms in your document"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                  <span>Scan Document</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 pt-3 border-b border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'rules'
                  ? 'border-indigo-500 text-indigo-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Active Dictionary ({rules.length})
            </button>
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'suggestions'
                  ? 'border-indigo-500 text-indigo-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>AI Term Scanner</span>
              {suggestions.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500 text-white font-bold">
                  {suggestions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'presets'
                  ? 'border-indigo-500 text-indigo-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Curated Presets
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={handleExportJson}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 flex items-center gap-1 transition-colors"
              title="Export as JSON"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>

            <label className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors">
              <Upload className="w-3 h-3" />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>

            <button
              onClick={onResetDefaults}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-md border border-slate-800 transition-colors flex items-center gap-1"
              title="Reset to default rules"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'rules' && (
            <>
              {/* Add New Rule Form */}
              <form
                onSubmit={handleAddRule}
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-200">Add Custom Pronunciation Rule</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs mb-3">
                  <div className="sm:col-span-3">
                    <label className="block text-slate-400 mb-1">Target Term / Word</label>
                    <input
                      type="text"
                      required
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      placeholder="e.g. k8s, Vite, SQL"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-slate-400 mb-1">Sounds Like / Respelling</label>
                    <input
                      type="text"
                      required
                      value={newReplacement}
                      onChange={(e) => setNewReplacement(e.target.value)}
                      placeholder="e.g. kay-eights, Veet, Sequel"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as PronunciationCategory)}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Tech Term">Tech Term</option>
                      <option value="Acronym">Acronym</option>
                      <option value="Name">Name</option>
                      <option value="Abbreviation">Abbreviation</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1">Matching</label>
                    <select
                      value={newMatchType}
                      onChange={(e) => setNewMatchType(e.target.value as MatchType)}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="word">Word Boundary</option>
                      <option value="exact">Exact (Case-Sensitive)</option>
                      <option value="regex">Regex</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 flex items-end">
                    <button
                      type="submit"
                      className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-950/40 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Rule</span>
                    </button>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Optional notes or context (e.g. 'Kubernetes shorthand')"
                    className="w-full px-3 py-1 text-xs rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </form>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search terms or replacements..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  {['All', 'Tech Term', 'Acronym', 'Abbreviation', 'Name', 'Custom'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rules List Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-semibold">
                      <th className="py-2.5 px-4 w-12 text-center">Status</th>
                      <th className="py-2.5 px-4">Original Term</th>
                      <th className="py-2.5 px-4">Spoken Respelling</th>
                      <th className="py-2.5 px-4 hidden sm:table-cell">Category</th>
                      <th className="py-2.5 px-4 text-center">Doc Matches</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredRules.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No pronunciation rules found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredRules.map((rule) => {
                        const matchCount = countRuleMatchesInText(activeMarkdownText, rule);
                        const isTesting = testingRuleId === rule.id;

                        return (
                          <tr
                            key={rule.id}
                            className={`hover:bg-slate-800/40 transition-colors ${
                              !rule.enabled ? 'opacity-50 bg-slate-950/30' : ''
                            }`}
                          >
                            <td className="py-2.5 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={rule.enabled}
                                onChange={() => handleToggleRule(rule.id)}
                                className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                                title={rule.enabled ? 'Rule active' : 'Rule disabled'}
                              />
                            </td>

                            <td className="py-2.5 px-4">
                              <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                                <code>{rule.word}</code>
                                {rule.matchType === 'exact' && (
                                  <span className="text-[10px] text-amber-400/80 bg-amber-950/40 px-1 rounded">
                                    Exact
                                  </span>
                                )}
                                {rule.matchType === 'regex' && (
                                  <span className="text-[10px] text-purple-400/80 bg-purple-950/40 px-1 rounded">
                                    Regex
                                  </span>
                                )}
                              </div>
                              {rule.notes && (
                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{rule.notes}</p>
                              )}
                            </td>

                            <td className="py-2.5 px-4 font-medium text-indigo-300">
                              <span className="bg-indigo-950/40 border border-indigo-500/20 px-2 py-0.5 rounded text-indigo-200">
                                {rule.replacement}
                              </span>
                            </td>

                            <td className="py-2.5 px-4 hidden sm:table-cell text-slate-400">
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 border border-slate-700 text-slate-300">
                                {rule.category}
                              </span>
                            </td>

                            <td className="py-2.5 px-4 text-center">
                              {matchCount > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                                  {matchCount} in doc
                                </span>
                              ) : (
                                <span className="text-slate-600 text-[11px]">0</span>
                              )}
                            </td>

                            <td className="py-2.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => testPronunciation(rule.id, rule.replacement)}
                                  disabled={isTesting}
                                  className="p-1.5 rounded-md bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 border border-slate-700 transition-colors"
                                  title="Test how this sounds"
                                >
                                  {isTesting ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                                  ) : (
                                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteRule(rule.id)}
                                  className="p-1.5 rounded-md bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                                  title="Delete rule"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* AI Suggestions Tab */}
          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">Document Pronunciation Scanner</h3>
                    <p className="text-xs text-slate-400">
                      Scans your active markdown document for acronyms, technical terms, and non-phonetic words.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {suggestions.length > 0 && (
                    <button
                      onClick={handleAddAllSuggestions}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Add All Suggestions ({suggestions.length})</span>
                    </button>
                  )}
                  <button
                    onClick={handleScanMarkdown}
                    disabled={isScanning || !activeMarkdownText.trim()}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Scanning...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Rescan Document</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {suggestions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                  <Lightbulb className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-60" />
                  <p className="text-sm text-slate-300 font-medium">No pending suggestions</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Click "Scan Document" above to inspect your markdown for technical jargon, acronyms, and specialized
                    terms.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestions.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 flex items-start justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-xs font-bold text-slate-100">{s.word}</code>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                            {s.category}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-emerald-400 mb-1 flex items-center gap-1.5">
                          <span>Sounds like:</span>
                          <span className="bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            {s.pronunciation}
                          </span>
                        </div>
                        {s.reason && <p className="text-[11px] text-slate-400">{s.reason}</p>}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => testPronunciation(`sug-${idx}`, s.pronunciation)}
                          className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-indigo-300 border border-slate-700"
                          title="Test pronunciation"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddSuggestion(s)}
                          className="px-2.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1 shadow-sm"
                          title="Add to active dictionary"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preset Packs Tab */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Quickly import specialized pronunciation packs tailored for common domains:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PRESET_PACKS.map((pack) => (
                  <div
                    key={pack.name}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-slate-100 text-sm mb-1">{pack.name}</h4>
                      <p className="text-xs text-slate-400 mb-3">{pack.description}</p>
                      <div className="space-y-1 mb-4">
                        {pack.rules.slice(0, 4).map((r, i) => (
                          <div key={i} className="text-[11px] flex items-center justify-between text-slate-300">
                            <code>{r.word}</code>
                            <span className="text-indigo-300 font-mono text-[10px]">→ {r.replacement}</span>
                          </div>
                        ))}
                        {pack.rules.length > 4 && (
                          <div className="text-[10px] text-slate-500 italic">+{pack.rules.length - 4} more rules</div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleImportPreset(pack.rules)}
                      className="w-full py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Import {pack.name} ({pack.rules.length})</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 text-xs text-slate-400">
          <span>Rules are automatically applied when parsing markdown sections into speech.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
