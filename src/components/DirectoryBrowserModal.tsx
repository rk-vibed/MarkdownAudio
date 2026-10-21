import React, { useState, useEffect, useRef } from 'react';
import { DirectoryFileInfo } from '../types';
import {
  FolderOpen,
  Folder,
  FileText,
  Search,
  ArrowRight,
  ArrowUp,
  RefreshCw,
  HardDrive,
  FolderTree,
  Clock,
  Layers,
  Sparkles,
  X,
  Loader2,
  Check,
  ChevronRight,
  FileCode,
} from 'lucide-react';

interface DirectoryBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (content: string, fileName: string, autoSynthesize?: boolean) => void;
}

export const DirectoryBrowserModal: React.FC<DirectoryBrowserModalProps> = ({
  isOpen,
  onClose,
  onSelectFile,
}) => {
  const [activeTab, setActiveTab] = useState<'server' | 'local'>('server');

  // Server directory state
  const [directoryPath, setDirectoryPath] = useState<string>('./docs');
  const [serverFiles, setServerFiles] = useState<DirectoryFileInfo[]>([]);
  const [subdirectories, setSubdirectories] = useState<string[]>([]);
  const [currentDisplayPath, setCurrentDisplayPath] = useState<string>('./docs');
  const [parentPath, setParentPath] = useState<string>('');
  const [isLoadingServer, setIsLoadingServer] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Local folder picker state (File System Access API & webkitdirectory)
  const [localFolderFiles, setLocalFolderFiles] = useState<DirectoryFileInfo[]>([]);
  const [localFolderName, setLocalFolderName] = useState<string>('');
  const [isScanningLocal, setIsScanningLocal] = useState<boolean>(false);
  const localFolderInputRef = useRef<HTMLInputElement>(null);

  // Search & Preview state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<DirectoryFileInfo | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  // Fetch server directory files
  const fetchServerDirectory = async (targetPath = directoryPath) => {
    try {
      setIsLoadingServer(true);
      setServerError(null);
      const res = await fetch('/api/directory/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directoryPath: targetPath }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to list directory');
      }

      setServerFiles(data.files || []);
      setSubdirectories(data.subdirectories || []);
      setCurrentDisplayPath(data.displayPath || targetPath);
      setParentPath(data.parentDirectory || '');
      setDirectoryPath(data.displayPath || targetPath);

      // Select first file if available
      if (data.files && data.files.length > 0) {
        handleSelectPreview(data.files[0]);
      } else {
        setSelectedFile(null);
        setPreviewContent('');
      }
    } catch (err: any) {
      console.error('Directory listing error:', err);
      setServerError(err?.message || 'Error listing directory');
    } finally {
      setIsLoadingServer(false);
    }
  };

  // Load server directory on modal open
  useEffect(() => {
    if (isOpen) {
      fetchServerDirectory(directoryPath);
    }
  }, [isOpen]);

  // Handle local folder selection via input[webkitdirectory]
  const handleLocalFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsScanningLocal(true);
    const mdFiles: DirectoryFileInfo[] = [];
    const folderName = files[0].webkitRelativePath
      ? files[0].webkitRelativePath.split('/')[0]
      : 'Local Folder';
    setLocalFolderName(folderName);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (/\.(md|markdown|txt)$/i.test(file.name)) {
        try {
          const text = await file.text();
          const firstHeading = text.match(/^#\s+(.+)$/m);
          const title = firstHeading ? firstHeading[1].trim().replace(/[*_`]/g, '') : file.name.replace(/\.[^/.]+$/, '');
          const cleanPreview = text.replace(/[#*`_>]/g, '').trim().slice(0, 150);
          const words = text.trim() ? text.trim().split(/\s+/).length : 0;

          mdFiles.push({
            name: file.name,
            path: file.webkitRelativePath || file.name,
            relativePath: file.webkitRelativePath || file.name,
            size: file.size,
            modifiedAt: new Date(file.lastModified).toISOString(),
            title,
            preview: cleanPreview,
            wordCount: words,
            sourceType: 'local',
            fileObject: file,
          });
        } catch (err) {
          console.warn(`Could not read local file ${file.name}:`, err);
        }
      }
    }

    setLocalFolderFiles(mdFiles);
    setIsScanningLocal(false);

    if (mdFiles.length > 0) {
      handleSelectPreview(mdFiles[0]);
    }
  };

  // Native showDirectoryPicker if supported
  const handleNativeShowDirectoryPicker = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        setIsScanningLocal(true);
        // @ts-ignore
        const dirHandle = await window.showDirectoryPicker();
        setLocalFolderName(dirHandle.name);
        const mdFiles: DirectoryFileInfo[] = [];

        async function readEntries(handle: any, currentPath = '') {
          for await (const entry of handle.values()) {
            if (entry.kind === 'file' && /\.(md|markdown|txt)$/i.test(entry.name)) {
              const file = await entry.getFile();
              const text = await file.text();
              const firstHeading = text.match(/^#\s+(.+)$/m);
              const title = firstHeading ? firstHeading[1].trim().replace(/[*_`]/g, '') : entry.name.replace(/\.[^/.]+$/, '');
              const cleanPreview = text.replace(/[#*`_>]/g, '').trim().slice(0, 150);
              const words = text.trim() ? text.trim().split(/\s+/).length : 0;

              mdFiles.push({
                name: entry.name,
                path: currentPath ? `${currentPath}/${entry.name}` : entry.name,
                relativePath: currentPath ? `${currentPath}/${entry.name}` : entry.name,
                size: file.size,
                modifiedAt: new Date(file.lastModified).toISOString(),
                title,
                preview: cleanPreview,
                wordCount: words,
                sourceType: 'local',
                fileObject: file,
              });
            } else if (entry.kind === 'directory' && !entry.name.startsWith('.')) {
              await readEntries(entry, currentPath ? `${currentPath}/${entry.name}` : entry.name);
            }
          }
        }

        await readEntries(dirHandle);
        setLocalFolderFiles(mdFiles);
        if (mdFiles.length > 0) {
          handleSelectPreview(mdFiles[0]);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Native folder pick failed, falling back to input:', err);
          localFolderInputRef.current?.click();
        }
      } finally {
        setIsScanningLocal(false);
      }
    } else {
      localFolderInputRef.current?.click();
    }
  };

  // Preview a selected file
  const handleSelectPreview = async (file: DirectoryFileInfo) => {
    setSelectedFile(file);
    try {
      setIsLoadingPreview(true);
      if (file.sourceType === 'local' && file.fileObject) {
        const text = await file.fileObject.text();
        setPreviewContent(text);
      } else {
        const res = await fetch('/api/directory/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: file.path }),
        });
        const data = await res.json();
        if (data.content) {
          setPreviewContent(data.content);
        }
      }
    } catch (err) {
      console.error('Error loading preview:', err);
      setPreviewContent('Failed to load file preview.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Confirm file selection for synthesis
  const handleConfirmSelection = (autoSynthesize = false) => {
    if (!selectedFile || !previewContent) return;
    onSelectFile(previewContent, selectedFile.name, autoSynthesize);
    onClose();
  };

  if (!isOpen) return null;

  const currentFiles = activeTab === 'server' ? serverFiles : localFolderFiles;
  const filteredFiles = currentFiles.filter((f) => {
    const query = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(query) ||
      (f.title && f.title.toLowerCase().includes(query)) ||
      (f.relativePath && f.relativePath.toLowerCase().includes(query))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">Browse & Select Markdown Files</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {filteredFiles.length} Markdown File{filteredFiles.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Explore local folders or server directories and select files for speech synthesis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Location Controls */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
              <button
                onClick={() => setActiveTab('server')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === 'server'
                    ? 'bg-slate-800 text-indigo-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Project / Workspace Directory</span>
              </button>

              <button
                onClick={() => setActiveTab('local')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === 'local'
                    ? 'bg-slate-800 text-indigo-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Pick Folder on Computer</span>
              </button>
            </div>
          </div>

          {activeTab === 'server' ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <input
                  type="text"
                  value={directoryPath}
                  onChange={(e) => setDirectoryPath(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchServerDirectory(directoryPath)}
                  placeholder="Enter path (e.g. ./docs, ./)"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <button
                onClick={() => fetchServerDirectory(directoryPath)}
                disabled={isLoadingServer}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                title="Scan directory"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingServer ? 'animate-spin' : ''}`} />
              </button>

              <div className="flex items-center gap-1">
                {['./docs', './'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setDirectoryPath(preset);
                      fetchServerDirectory(preset);
                    }}
                    className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors ${
                      directoryPath === preset
                        ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="file"
                ref={localFolderInputRef}
                // @ts-ignore
                webkitdirectory="true"
                // @ts-ignore
                directory="true"
                onChange={handleLocalFolderSelect}
                className="hidden"
              />
              <button
                onClick={handleNativeShowDirectoryPicker}
                disabled={isScanningLocal}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-indigo-950/40"
              >
                {isScanningLocal ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Scanning local files...</span>
                  </>
                ) : (
                  <>
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Choose Local Folder...</span>
                  </>
                )}
              </button>

              {localFolderName && (
                <span className="text-xs text-indigo-300 font-mono px-2 py-1 rounded bg-slate-800 border border-slate-700">
                  📁 {localFolderName} ({localFolderFiles.length} files)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Subdirectories navigation (Server mode) */}
        {activeTab === 'server' && subdirectories.length > 0 && (
          <div className="px-6 py-2 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-500 text-[11px] uppercase font-semibold">Subfolders:</span>
            {subdirectories.map((sub) => (
              <button
                key={sub}
                onClick={() => {
                  const newPath = `${directoryPath.replace(/\/$/, '')}/${sub}`;
                  setDirectoryPath(newPath);
                  fetchServerDirectory(newPath);
                }}
                className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 flex items-center gap-1 transition-colors whitespace-nowrap"
              >
                <Folder className="w-3 h-3 text-indigo-400" />
                <span>{sub}</span>
              </button>
            ))}
          </div>
        )}

        {/* Search bar */}
        <div className="px-6 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter markdown files by title or filename..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            {selectedFile ? `Selected: ${selectedFile.name}` : 'Click a file to preview'}
          </div>
        </div>

        {/* Two-Pane Body: File List (Left) & Preview (Right) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-[380px]">
          {/* Left Pane: Files List */}
          <div className="md:col-span-6 border-r border-slate-800 overflow-y-auto p-4 space-y-2 bg-slate-950/30">
            {isLoadingServer ? (
              <div className="text-center py-16 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                <p className="text-xs">Scanning directory for Markdown files...</p>
              </div>
            ) : serverError && activeTab === 'server' ? (
              <div className="text-center py-12 p-4">
                <p className="text-xs text-rose-400 font-semibold mb-1">Could not open directory</p>
                <p className="text-[11px] text-slate-400 mb-3">{serverError}</p>
                <button
                  onClick={() => {
                    setDirectoryPath('./docs');
                    fetchServerDirectory('./docs');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700"
                >
                  Load Default ./docs Directory
                </button>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <FileCode className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-slate-400">No Markdown files found</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {activeTab === 'server'
                    ? 'No .md or .txt files found in this path. Try ./docs or another directory.'
                    : 'Click "Choose Local Folder" above to select a folder containing Markdown files.'}
                </p>
              </div>
            ) : (
              filteredFiles.map((file) => {
                const isSelected = selectedFile?.path === file.path;

                return (
                  <div
                    key={file.path}
                    onClick={() => handleSelectPreview(file)}
                    className={`group p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                        <h4 className="text-xs font-semibold text-slate-100 group-hover:text-indigo-200 transition-colors line-clamp-1">
                          {file.title || file.name}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-500 mb-1.5 truncate">
                      {file.relativePath || file.name}
                    </div>

                    {file.preview && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                        {file.preview}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-800/60">
                      <span>{file.wordCount ? `${file.wordCount} words` : 'Markdown document'}</span>
                      <span className="flex items-center gap-1 text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform">
                        <span>Preview</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Pane: Markdown Content Preview */}
          <div className="md:col-span-6 flex flex-col bg-slate-950/80 overflow-hidden">
            <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Document Preview</span>
              </span>
              {selectedFile && (
                <span className="text-[11px] font-mono text-indigo-300">
                  {selectedFile.wordCount || 0} words
                </span>
              )}
            </div>

            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-text">
              {isLoadingPreview ? (
                <div className="text-center py-16 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                  <p>Loading document content...</p>
                </div>
              ) : previewContent ? (
                previewContent
              ) : (
                <div className="text-center py-16 text-slate-500">
                  <p>Select a file from the list to preview its Markdown source.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 text-xs">
          <div className="text-slate-400 hidden sm:block">
            {selectedFile ? (
              <span>Ready to synthesize: <strong className="text-slate-200">{selectedFile.name}</strong></span>
            ) : (
              <span>No file selected</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={() => handleConfirmSelection(false)}
              disabled={!selectedFile || !previewContent}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md shadow-indigo-950/40 disabled:opacity-40 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Load into Studio</span>
            </button>

            <button
              onClick={() => handleConfirmSelection(true)}
              disabled={!selectedFile || !previewContent}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition-all shadow-md shadow-emerald-950/40 disabled:opacity-40 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load & Synthesize All</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
