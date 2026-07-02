# CODEBASE.md
## Scope
- apparent purpose: A lightweight, browser-based tool to parse and clean up exported chat history JSON files from Google AI Studio into readable Markdown format.
- stack/languages/frameworks: HTML, JavaScript (ES6+), React 18 (CDN), Tailwind CSS (CDN), Babel Standalone (CDN).
- entry points: `index.html`.
- build/run/test systems: No build system. Uses Node.js for benchmarking and stress testing scripts (`npm run test:stress`, `bench:opt`, etc.). Hosted on GitHub Pages.
- architectural style: Single-file Single-Page Application (SPA). Data parsing and formatting functions are defined outside React components for performance. Processes data in asynchronous batches to prevent UI blocking.
- major operational invariants: Must execute entirely client-side without a Node.js runtime. Must handle multiple large JSON files without freezing the browser thread. Must preserve exact file behavior via dynamic extraction in tests.

## Repository Map
```
.
├── .jules
│   └── steward.md
├── CLAUDE.md
├── LICENSE
├── README.md
├── benchmark_icon_paths.js
├── benchmark_loop.js
├── benchmark_markdown_gen.js
├── benchmark_optimization.js
├── index.html
├── package.json
├── screenshot.png
└── simulation_stress_test.js

2 directories, 12 files
```

## Authoritative Review Summary
- core flows: File upload (Drag & Drop or click) -> `handleFiles` (reads file text) -> `parseAIStudioJSON` (extracts conversation and thoughts) -> `generateMarkdown` (formats output) -> UI preview rendering and File Download/Copy generation.
- important interfaces: `parseAIStudioJSON(json)`: returns an array of structured conversation objects `{role, content, thoughts, hasThoughts}`. Fallback extraction strategy `extractContent` handles varied Google AI Studio schema representations.
- key configs: Dependencies (React, Tailwind, Babel) hardcoded as CDN links in `index.html`. Testing commands defined in `package.json`. No external configuration files required.
- major invariants: Incremental state updates (`errorCount`, `fileCount`, `outputChunks`) instead of derived O(N) recalculations. Pure standalone functions for data transformation logic. Touch-manipulation on mobile interactive elements.
- principal risks: Client-side memory exhaustion during parsing of extremely large files (>100MB) or massive quantities of files. Changes to Google AI Studio export schemas could break `parseAIStudioJSON` heuristics.

## File Inventory
| Path | Role | Priority | Inclusion | Reason |
|---|---|---|---|---|
| `index.html` | Entry point & Logic | Critical | Full | Contains the entire application frontend, UI state, and parsing logic. |
| `package.json` | Metadata & Scripts | Important | Full | Defines NPM scripts for testing/benchmarking. Master version source. |
| `.jules/steward.md` | Architecture rules | Critical | Full | Contains historical constraints, UX rules, and memory leak prevention protocols. |
| `CLAUDE.md` | AI context | Context | Summary | Guidelines for modifying the codebase, architecture overview, and schemas. |
| `README.md` | Documentation | Context | Summary | Project overview, usage instructions, and deployment guide. |
| `simulation_stress_test.js` | Performance & Correctness Tests | Important | Excerpt | High-signal test covering scale and chaos mode edge cases. Excerpted chaos mode generation. |
| `benchmark_optimization.js` | Performance Measurement | Context | Summary | Validates `parseAIStudioJSON` speedups against legacy approaches. |
| `benchmark_loop.js` | Performance Measurement | Context | Summary | Validates `for...of` loop optimization. |
| `benchmark_markdown_gen.js` | Performance Measurement | Context | Summary | Validates string building optimizations (`push` vs `+=`). |
| `benchmark_icon_paths.js` | Performance Measurement | Context | Summary | Validates combined SVG path performance. |
| `LICENSE` | Legal | Context | Excluded | Standard MIT license. |
| `screenshot.png` | Asset | Context | Excluded | Visual asset for README. |

## Embedded Critical Files
### `index.html`
- exact relative path: `index.html`
- role: Main Application
- why it matters: It is the entire runnable application. Defines UI components, React hooks, file processing batches, and data parsing algorithms.
- inclusion mode: Full
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="A lightweight tool to clean and convert Google AI Studio JSON exports to Markdown.">
    <meta name="theme-color" content="#2563eb">
    <title>AI Studio History Cleaner</title>

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com/3.4.17"></script>

    <!-- React & ReactDOM -->
    <script crossorigin src="https://unpkg.com/react@18.3.1/umd/react.production.min.js" integrity="sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js" integrity="sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1"></script>

    <!-- Babel for JSX -->
    <script crossorigin src="https://unpkg.com/@babel/standalone@7.28.6/babel.min.js" integrity="sha384-JPppEYE7ZC9vFS/7cNjjowtWnUZ23GWT7OnRptB9bRQlXx1ufYwKfNbS2DrBYZ4a"></script>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- Favicon & Metadata -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧹</text></svg>">
    <meta property="og:title" content="AI Studio History Cleaner">
    <meta property="og:description" content="Parse and clean Google AI Studio JSON exports into readable Markdown.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://shfqrkhn.github.io/AI-Studio-Cleaner/">

    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-slate-50 text-slate-900">
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useMemo, useCallback, useRef } = React;

        // --- ICONS (Inline SVGs to avoid complex CDN imports) ---
        // Optimization: Component memoized to prevent re-renders when path and className are stable
        const Icon = React.memo(({ path, className }) => (
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
                {path}
            </svg>
        ));

        // Optimization: Extracted paths to constants to avoid recreation on every render
        const IconPaths = {
            FileJson: <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2zM14 2V8h6" />,
            Trash2: <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />,
            Copy: <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1M11 9h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z" />,
            Download: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
            RefreshCw: <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />,
            FileText: <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2zM14 2V8h6M16 13H8M16 17H8M10 9H8" />,
            Check: <path d="M20 6l-11 11-5-5" />
        };

        const Icons = {
            FileJson: (props) => <Icon {...props} path={IconPaths.FileJson} />,
            Trash2: (props) => <Icon {...props} path={IconPaths.Trash2} />,
            Copy: (props) => <Icon {...props} path={IconPaths.Copy} />,
            Download: (props) => <Icon {...props} path={IconPaths.Download} />,
            RefreshCw: (props) => <Icon {...props} path={IconPaths.RefreshCw} />,
            FileText: (props) => <Icon {...props} path={IconPaths.FileText} />,
            Check: (props) => <Icon {...props} path={IconPaths.Check} />
        };

        // --- COMPONENTS ---

        const Card = ({ children, className = "" }) => (
            <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
                {children}
            </div>
        );

        // Optimization: Defined outside component to prevent recreation
        const variants = {
            primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform active:scale-95",
            secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm",
            danger: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
        };

        const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation";

        const Button = React.memo(({ children, onClick, variant = "primary", className = "", disabled = false }) => {
            return (
                <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} disabled={disabled}>
                    {children}
                </button>
            );
        });

        // Optimization: Pre-defined children for Button stability with React.memo
        const ClearButtonContent = <><Icons.Trash2 className="w-4 h-4" /> Clear All</>;
        const DownloadButtonContent = <><Icons.Download className="w-4 h-4" /> Download .md</>;
        const CopyButtonContent = <><Icons.Copy className="w-4 h-4" /> Copy</>;
        const CopiedButtonContent = <><Icons.Check className="w-4 h-4 text-green-600" /><span className="text-green-600">Copied!</span></>;

        // --- MAIN APP LOGIC ---

        // Optimization: Defined outside component to prevent recreation on every render (Verified ~5.4x faster via benchmark)
        const parseAIStudioJSON = (json) => {
            try {
                const data = JSON.parse(json);
                if (!data || typeof data !== 'object') return null;

                let conversation = [];

                // Helper to extract content and thoughts from any message object (chunk or systemInstruction)
                const extractContent = (item) => {
                    let thoughts = [];
                    let contentParts = [];

                    if (item.parts && Array.isArray(item.parts) && item.parts.length > 0) {
                        for (const part of item.parts) {
                            if (!part || typeof part !== 'object') continue;

                            if (part.thought || part.isThought) {
                                let t = part.text;
                                if ((t === undefined || t === null) && typeof part.thought === 'string') t = part.thought;
                                const trimmed = (t !== undefined && t !== null ? String(t) : '').trim();
                                if (trimmed) {
                                    thoughts.push(trimmed);
                                }
                            } else if (part.text !== undefined && part.text !== null) {
                                contentParts.push(part.text);
                            }
                        }
                    } else if (item.text !== undefined && item.text !== null) {
                        // Fallback to top-level text if parts are missing
                        contentParts.push(item.text);
                    }

                    const content = contentParts.join('').trim();
                    const thoughtsStr = thoughts.join('\n\n');
                    const hasThoughts = thoughts.length > 0;

                    return {
                        content,
                        thoughts: thoughtsStr,
                        hasThoughts,
                        isValid: (content.length > 0 || hasThoughts)
                    };
                };

                // Handle System Instruction (often at root or inside chunkedPrompt)
                const sysInstruction = data.systemInstruction || data.chunkedPrompt?.systemInstruction;
                if (sysInstruction) {
                    const { content, thoughts, hasThoughts, isValid } = extractContent(sysInstruction);
                    if (isValid) {
                        conversation.push({
                            role: 'System',
                            content,
                            thoughts,
                            hasThoughts
                        });
                    }
                }

                // Handle standard AI Studio export format
                let chunks = data.chunkedPrompt?.chunks || data.chunks;
                if (!Array.isArray(chunks)) chunks = [];

                for (const chunk of chunks) {
                    if (!chunk || typeof chunk !== 'object') continue;

                    // Enhance role detection: Map 'system' to 'System', 'model' to 'Model', others to 'User'
                    let role = 'User';
                    if (chunk.role === 'model') role = 'Model';
                    else if (chunk.role === 'system') role = 'System';

                    const { content, thoughts, hasThoughts, isValid } = extractContent(chunk);

                    if (isValid) {
                        conversation.push({
                            role,
                            content,
                            thoughts,
                            hasThoughts
                        });
                    }
                }

                return conversation;
            } catch (e) {
                return null;
            }
        };

        // Optimization: Extracted to standalone function
        const generateMarkdown = (parsedData, includeThoughts) => {
            const parts = [];

            for (const { name, conversation, error, errorMessage } of parsedData) {
                if (error) {
                    const reason = errorMessage || 'Invalid or unsupported JSON format';
                    parts.push('> ⚠️ Error parsing file: ', name, ' (', reason, ')\n\n');
                    continue;
                }

                parts.push('# Source: ', name, '\n\n');

                for (const msg of conversation) {
                    let roleIcon = '👤';
                    if (msg.role === 'Model') roleIcon = '🤖';
                    else if (msg.role === 'System') roleIcon = '⚙️';

                    const willHaveThoughts = includeThoughts && msg.hasThoughts;

                    if (willHaveThoughts || msg.content) {
                        parts.push('## ', roleIcon, ' ', msg.role, '\n\n');
                    }

                    if (willHaveThoughts) {
                        // Optimization: replace is ~2.6x faster than split/map/join
                        const indentedThoughts = '> ' + msg.thoughts.replace(/\n/g, '\n> ');
                        parts.push('> **🧠 Thinking Process**\n> \n', indentedThoughts, '\n\n');
                    }

                    if (msg.content) {
                        parts.push(msg.content, '\n\n');
                    }

                    if (willHaveThoughts || msg.content) {
                        parts.push('---\n\n');
                    }
                }
            }

            return parts.join('');
        };

        const MAX_PREVIEW_LENGTH = 100000;
        const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB guardrail for browser memory safety
        const BATCH_SIZE = 500;
        const normalizeFileName = (name) => String(name || 'unknown').replace(/[\r\n\t]+/g, ' ').trim();
        const safeDownloadName = (name) => normalizeFileName(name).replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
        const isSupportedFile = (fileName) => /\.(json|txt)$/i.test(normalizeFileName(fileName));

        function App() {
            const [fileCount, setFileCount] = useState(0);
            const [errorCount, setErrorCount] = useState(0); // Optimization: Standalone state to avoid O(N) recalculation
            const [parsedData, setParsedData] = useState([]);
            const [outputChunks, setOutputChunks] = useState([]); // Optimization: Array of strings instead of single string
            const [includeThoughts, setIncludeThoughts] = useState(false);
            const [isProcessing, setIsProcessing] = useState(false);
            const [dragActive, setDragActive] = useState(false);
            const [copySuccess, setCopySuccess] = useState(false);
            const processingRef = useRef(false);

            const handleFiles = useCallback(async (fileList) => {
                if (processingRef.current) return;
                processingRef.current = true;
                setIsProcessing(true);
                try {
                    const newFiles = Array.from(fileList);
                    const oversizedResults = [];
                    const validFiles = [];

                    for (const file of newFiles) {
                        const normalizedName = normalizeFileName(file.name);
                        if (!isSupportedFile(normalizedName)) {
                            oversizedResults.push({
                                name: normalizedName,
                                error: true,
                                errorMessage: 'Unsupported file type (use .json or .txt)'
                            });
                        } else if (file.size > MAX_FILE_SIZE_BYTES) {
                            oversizedResults.push({
                                name: normalizedName,
                                error: true,
                                errorMessage: 'File exceeds 10MB limit'
                            });
                        } else {
                            validFiles.push(file);
                        }
                    }

                    if (oversizedResults.length > 0) {
                        setParsedData(prev => [...prev, ...oversizedResults]);
                        setFileCount(prev => prev + oversizedResults.length);
                        setErrorCount(prev => prev + oversizedResults.length);
                        setOutputChunks(prev => [...prev, generateMarkdown(oversizedResults, includeThoughts)]);
                    }

                    for (let i = 0; i < validFiles.length; i += BATCH_SIZE) {
                        const batch = validFiles.slice(i, i + BATCH_SIZE);
                        const batchResults = await Promise.all(batch.map(async (file) => {
                            try {
                                const text = await file.text();
                                const conversation = parseAIStudioJSON(text);
                                return { name: normalizeFileName(file.name), conversation, error: !conversation };
                            } catch (e) {
                                return { name: normalizeFileName(file.name), error: true };
                            }
                        }));

                        let currentBatchErrors = 0;
                        for (let j = 0; j < batchResults.length; j++) {
                            if (batchResults[j].error) {
                                currentBatchErrors++;
                            }
                        }

                        setParsedData(prev => [...prev, ...batchResults]);
                        setFileCount(prev => prev + batch.length);
                        if (currentBatchErrors > 0) {
                            setErrorCount(prev => prev + currentBatchErrors);
                        }

                        // Optimization: Incrementally append markdown chunks to prevent O(N^2)
                        const batchMarkdown = generateMarkdown(batchResults, includeThoughts);
                        setOutputChunks(prev => [...prev, batchMarkdown]);

                        // Yield to main thread to maintain UI responsiveness
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                } finally {
                    processingRef.current = false;
                    setIsProcessing(false);
                }
            }, [includeThoughts]);

            const handleToggleThoughts = useCallback(async () => {
                if (isProcessing) return;
                setIsProcessing(true);

                // Yield to allow UI update (show spinner)
                await new Promise(resolve => setTimeout(resolve, 0));

                const newValue = !includeThoughts;
                setIncludeThoughts(newValue);

                let newChunks = [];

                for (let i = 0; i < parsedData.length; i += BATCH_SIZE) {
                    const batch = parsedData.slice(i, i + BATCH_SIZE);
                    newChunks.push(generateMarkdown(batch, newValue));

                    // Yield to main thread to maintain responsiveness
                    await new Promise(resolve => setTimeout(resolve, 0));
                }

                setOutputChunks(newChunks);
                setIsProcessing(false);
            }, [isProcessing, includeThoughts, parsedData]);

            const onDragEnter = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }, []);
            const onDragLeave = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }, []);
            const onDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); }, []);
            const onDrop = useCallback((e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(false);
                if (isProcessing) return;
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFiles(e.dataTransfer.files);
                }
            }, [handleFiles, isProcessing]);

            const handleInputChange = useCallback((e) => {
                if (isProcessing) return;
                if (e.target.files && e.target.files[0]) {
                    handleFiles(e.target.files);
                    e.target.value = ''; // Reset input to allow selecting the same file again
                }
            }, [handleFiles, isProcessing]);

            const handleClear = useCallback(() => {
                setFileCount(0);
                setErrorCount(0);
                setParsedData([]);
                setOutputChunks([]);
            }, []);

            const copyToClipboard = useCallback(async () => {
                // Optimization: Join chunks only on demand
                const fullText = outputChunks.join('');
                try {
                    await navigator.clipboard.writeText(fullText);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                } catch (err) {
                    // Fallback for older browsers
                    const el = document.createElement('textarea');
                    el.value = fullText;
                    document.body.appendChild(el);
                    el.select();
                    document.execCommand('copy');
                    document.body.removeChild(el);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                }
            }, [outputChunks]);

            const downloadMarkdown = useCallback(() => {
                const element = document.createElement("a");
                // Optimization: Pass array of chunks directly to Blob constructor
                const file = new Blob(outputChunks, {type: 'text/markdown'});
                const url = URL.createObjectURL(file);
                element.href = url;

                let filename = "cleaned_chat_history.md";
                if (parsedData.length === 1 && parsedData[0].name) {
                    filename = safeDownloadName(parsedData[0].name).replace(/\.(json|txt)$/i, '') + '.md';
                }

                element.download = filename;
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
                URL.revokeObjectURL(url);
            }, [outputChunks, parsedData]);

            const previewOutput = useMemo(() => {
                // Optimization: Efficiently construct preview from chunks without joining full text
                if (outputChunks.length === 0) return '';

                let preview = '';
                for (const chunk of outputChunks) {
                    preview += chunk;
                    if (preview.length > MAX_PREVIEW_LENGTH) {
                         return preview.slice(0, MAX_PREVIEW_LENGTH) + "\n\n... [Content truncated for performance. Download or copy to see full text] ...";
                    }
                }
                return preview;
            }, [outputChunks]);

            const hasOutput = outputChunks.length > 0;

            return (
                <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 p-6 md:p-12">
                    <main className="max-w-6xl mx-auto space-y-8">

                        {/* Header */}
                        <div className="text-center space-y-2">
                            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                                AI Studio <span className="text-blue-600">Cleaner</span>
                            </h1>
                            <p className="text-slate-500 max-w-2xl mx-auto">
                                Drag and drop your Google AI Studio export JSON files to extract a clean, readable Markdown chat history.
                            </p>
                            <p className="text-xs text-slate-400 font-mono">v1.2.40</p>
                        </div>

                        {/* Main Grid */}
                        <div className="grid md:grid-cols-3 gap-6 md:h-[70vh]">

                            {/* Left Column */}
                            <div className="md:col-span-1 flex flex-col gap-6 h-full">

                                {/* Upload Zone */}
                                <div
                                    className={`flex-1 rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center p-8 text-center cursor-pointer relative bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 touch-manipulation
                                        ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}
                                    onDragEnter={onDragEnter}
                                    onDragLeave={onDragLeave}
                                    onDragOver={onDragOver}
                                    onDrop={onDrop}
                                >
                                    <input
                                        type="file"
                                        multiple
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer touch-manipulation disabled:cursor-not-allowed"
                                        onChange={handleInputChange}
                                        disabled={isProcessing}
                                        accept=".json,.txt"
                                        aria-label="Upload AI Studio JSON export"
                                    />
                                    <div className="bg-blue-100 p-4 rounded-full mb-4">
                                        <Icons.FileJson className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h3 className="font-semibold text-lg text-slate-700 mb-1">Upload JSON</h3>
                                    <p className="text-sm text-slate-500">Drag & drop or click to browse</p>
                                    <p className="mt-2 text-xs text-slate-400">Supports .json/.txt, max 10MB per file</p>
                                </div>

                                {/* Controls */}
                                <Card className="p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-slate-700 flex items-center gap-2">
                                            <span className="text-lg" aria-hidden="true">🧠</span> Thoughts
                                        </span>
                                        <button
                                            onClick={handleToggleThoughts}
                                            disabled={isProcessing}
                                            role="switch"
                                            aria-checked={includeThoughts}
                                            aria-label="Toggle reasoning blocks"
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed ${includeThoughts ? 'bg-blue-600' : 'bg-slate-200'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${includeThoughts ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Enable to include "Reasoning" blocks in output.
                                    </p>
                                    <div className="pt-2 border-t border-slate-100">
                                        <div className="flex flex-col gap-2">
                                            {fileCount > 0 && (
                                                <div aria-live="polite" className="text-sm text-slate-600 font-medium mb-2 flex justify-between items-center">
                                                    <span>Processed {fileCount} file(s)</span>
                                                    {errorCount > 0 && (
                                                        <span className="text-red-600 font-bold text-xs bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                                            {errorCount} Error{errorCount > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            <Button onClick={handleClear} variant="danger" disabled={!hasOutput || isProcessing} className="w-full justify-center">
                                                {ClearButtonContent}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>

                            </div>

                            {/* Right Column */}
                            <div className="md:col-span-2 flex flex-col h-full min-h-[50vh] md:min-h-0">
                                <Card className="flex-1 flex flex-col h-full shadow-md">
                                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                                            <Icons.FileText className="w-4 h-4 text-blue-500" /> Preview
                                        </h2>
                                        <div className="flex gap-2">
                                            <Button variant="secondary" onClick={copyToClipboard} disabled={!hasOutput || isProcessing} className="text-sm py-1.5 h-9">
                                                {copySuccess ? CopiedButtonContent : CopyButtonContent}
                                            </Button>
                                            <Button onClick={downloadMarkdown} disabled={!hasOutput || isProcessing} className="text-sm py-1.5 h-9">
                                                {DownloadButtonContent}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex-1 relative bg-white group">
                                        {hasOutput && (
                                            <textarea
                                                className={`w-full h-full p-6 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset font-mono text-sm text-slate-800 leading-relaxed transition-opacity duration-200 touch-manipulation ${isProcessing ? 'opacity-50' : ''}`}
                                                value={previewOutput}
                                                readOnly
                                                aria-label="Generated Markdown"
                                            />
                                        )}
                                        {(!hasOutput || isProcessing) && (
                                            <div aria-live="polite" aria-busy={isProcessing} className={`absolute inset-0 flex flex-col items-center justify-center text-slate-400 ${hasOutput ? 'z-10' : ''}`}>
                                                <div className="bg-slate-50 p-4 rounded-full mb-3 shadow-sm">
                                                    <Icons.RefreshCw className={`w-6 h-6 ${isProcessing ? 'animate-spin text-blue-500' : ''}`} />
                                                </div>
                                                {isProcessing && <span className="sr-only">Processing...</span>}
                                                {!hasOutput && <p>Upload a file to generate Markdown</p>}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>

                        </div>
                    </main>
                </div>
            );
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>
```

### `package.json`
- exact relative path: `package.json`
- role: Metadata & Scripts
- why it matters: Defines the project version and test runner commands. Must be the single source of truth for versions.
- inclusion mode: Full
```json
{
  "name": "ai-studio-cleaner",
  "version": "1.2.40",
  "description": "A lightweight, browser-based tool to parse and clean up exported chat history JSON files from Google AI Studio.",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "test:stress": "node simulation_stress_test.js",
    "bench:opt": "node benchmark_optimization.js",
    "bench:loop": "node benchmark_loop.js",
    "bench:markdown": "node benchmark_markdown_gen.js",
    "bench:icons": "node benchmark_icon_paths.js"
  },
  "keywords": [
    "ai-studio",
    "gemini",
    "export",
    "markdown",
    "converter",
    "cleaner"
  ],
  "author": "shfqrkhn",
  "license": "MIT"
}
```

### `.jules/steward.md`
- exact relative path: `.jules/steward.md`
- role: Architecture Rules
- why it matters: Defines critical constraints for maintaining performance, UX, and code hygiene across iterations.
- inclusion mode: Full
```markdown
## 2026-01-25 - [Sentinel] - [Tailwind Play CDN CORS Constraint]
**Insight:** The Tailwind Play CDN (`https://cdn.tailwindcss.com`) does not serve `Access-Control-Allow-Origin` headers. This prevents the use of Subresource Integrity (SRI) because `integrity` requires `crossorigin="anonymous"`, which fails without CORS headers.
**Protocol:** Do not attempt to add SRI to `cdn.tailwindcss.com` scripts unless the CDN configuration changes or the architecture moves to a local build.

## 2026-02-04 - [Palette] - [Mobile Input Latency]
**Insight:** Standard buttons trigger a 300ms delay on mobile browsers to detect double-tap gestures, degrading perceived responsiveness.
**Protocol:** All interactive elements must apply `touch-action: manipulation` (Tailwind: `touch-manipulation`) to disable double-tap zoom and eliminate the delay.

## 2026-02-02 - [Palette] - [Decorative Icon Noise]
**Insight:** Functional React components wrapping raw SVGs (like `Icon`) often lack accessibility context, causing screen readers to announce them as "group" or "image" without labels.
**Protocol:** All decorative icon components MUST strictly include `aria-hidden="true"` by default unless explicitly labeled.

## 2026-02-14 - [Bolt] - [Logic Extraction for Verification]
**Insight:** Embedding complex logic (like markdown generation) inside React hooks makes it inaccessible to external verification scripts (e.g., stress tests) without fragile string parsing.
**Protocol:** complex data transformation logic MUST be extracted into standalone pure functions outside the component to enable direct testing and benchmarking.

## 2026-02-15 - [Palette] - [Empty Thought Noise]
**Insight:** Empty "Thinking Process" blocks (whitespace only) degrade UX by displaying meaningless containers.
**Protocol:** The parser MUST filter out any thought parts that contain only whitespace or are empty before adding them to the conversation object.

## 2026-02-18 - [Sentinel] - [Falsy Text Data Loss]
**Insight:** Using simple truthiness checks (e.g., `if (text)`) on content fields causes data loss for valid falsy values like `0` (number), which are critical for mathematical or code contexts.
**Protocol:** Content validation MUST explicitly check for `undefined` or `null` (e.g., `if (text !== undefined && text !== null)`) instead of relying on implicit type coercion.

## 2026-02-16 - [Palette] - [Semantic Drift]
**Protocol:** Toggle UI elements (switches) must use semantic `role="switch"` and `aria-checked`, not `button` + `aria-pressed`.

## 2026-02-16 - [Hygiene] - [Artifact Decay]
**Protocol:** Benchmark scripts must be actively referenced in `package.json`; unreferenced scripts are considered entropy and must be purged.

## 2026-02-18 - [Hygiene] - [Documentation Drift]
**Insight:** `CLAUDE.md` file listings often drift from the actual repository state as files are added or removed.
**Protocol:** Any file addition or deletion MUST be accompanied by an update to the "File Structure" section in `CLAUDE.md`.

## 2026-03-02 - [Bolt] - [Object Retention Memory Leaks]
**Insight:** Storing arrays of raw `File` objects in React state prevents garbage collection over thousands of uploads, creating a significant memory leak and violating performance mandates.
**Protocol:** When only scalar metrics (like the total count of processed files) are needed for UI rendering, track that metric directly (e.g. `fileCount`) rather than retaining an array of raw objects.

## 2026-03-03 - [Bolt] - [O(N) Derived State in High-Frequency Batches]
**Insight:** Using `useMemo` to derive a scalar value (e.g., `errorCount = parsedData.filter(p => p.error).length`) from an array that continuously grows during batch processing causes an O(N) operation on every render, severely degrading performance for large datasets.
**Protocol:** When incrementally building a large dataset, standalone scalar metrics (like `errorCount`) MUST be tracked directly via state and updated incrementally, avoiding full array traversals.
```

### `simulation_stress_test.js`
- exact relative path: `simulation_stress_test.js`
- role: Load and Edge Case Testing
- why it matters: Evaluates correctness under malformed JSON ('Chaos Mode') and load limits.
- inclusion mode: Excerpt
- minimal note: The 'Chaos Mode' test generation logic, covering edge cases like null values, empty thoughts, and type variations that `parseAIStudioJSON` must handle safely.
```javascript
const chaosFiles = [
        { name: "bad_json.json", content: "{ unquoted: key }" },
        { name: "empty.json", content: "" },
        { name: "null.json", content: "null" },
        { name: "no_chunks.json", content: "{}" },
        { name: "empty_chunks.json", content: '{"chunks": []}' },
        { name: "missing_text.json", content: '{"chunks": [{"role": "user"}]}' }, // Missing parts/text
        { name: "null_part.json", content: '{"chunks": [{"role": "model", "parts": [null]}]}' },
        { name: "empty_thought.json", content: '{"chunks": [{"role": "model", "parts": [{"text": "   ", "thought": true}, {"text": "Hello"}]}]}' },
        { name: "zero_text.json", content: '{"chunks": [{"role": "user", "text": 0}, {"role": "model", "parts": [{"text": 0}]}]}' }, // Falsy values (0)
        { name: "wrong_type.json", content: '{"chunks": "not_an_array"}' },
        { name: "mixed_validity.json", content: '{"chunks": [{"role": "user", "text": "ok"}, {"role": "model", "parts": "broken"}]}' },
        { name: "string_thought.json", content: '{"chunks": [{"role": "model", "parts": [{"thought": "String thought content", "text": null}, {"text": "Hello"}]}]}' },
        { name: "zero_thought.json", content: '{"chunks": [{"role": "model", "parts": [{"text": 0, "thought": true}]}]}' }
    ];
```

## Summarized Files
- **`CLAUDE.md`**: Provides context for AI assistants, enforcing the single-file architecture constraint, detailing benchmark commands, and summarizing the AI Studio JSON schema formats handled by the tool (`chunkedPrompt`, `chunks`, `parts` with `thought`/`isThought`).
- **`README.md`**: Outlines the project's purpose, features, deployment instructions (GitHub pages), and tech stack. References `screenshot.png`.
- **`benchmark_optimization.js`**: Node script comparing 'Legacy' parsing logic (using `forEach` and heavy object creation) against the current `parseAIStudioJSON` to track speedups.
- **`benchmark_loop.js`**: Node script validating the performance gains (~2.5x-2.7x) of using `for...of` loops over `Array.forEach` in parsing high-volume JSON data.
- **`benchmark_markdown_gen.js`**: Node script evaluating markdown generation performance, specifically verifying that granular array `push()` followed by `join()` outperforms continuous string concatenation by ~40%.
- **`benchmark_icon_paths.js`**: Node script verifying that combining SVG shapes into single `<path>` definitions yields a ~1.9x rendering speedup compared to separate elements.

## Cross-File Relationships
- startup wiring: Browser loads `index.html` -> loads React/Babel/Tailwind via CDN -> parses inline script -> renders `<App />` into `#root`.
- module relationships: All logic exists within `index.html`. Data components (`Icon`, `Card`, `Button`), core business logic (`parseAIStudioJSON`, `generateMarkdown`), and application state (`App`) are tightly coupled but cleanly separated via functional boundaries.
- API/data flow: User Drops JSON -> `handleFiles` (reads file in batches of 500) -> `parseAIStudioJSON` -> `generateMarkdown` -> React state (`outputChunks`, `parsedData`) -> UI Update.
- config/env flow: Dependency versions are hardcoded as CDN links in `index.html`. `package.json` version acts as the authoritative master version.
- test-to-implementation mapping: All `benchmark_*.js` and `simulation_stress_test.js` scripts dynamically read `index.html` via `fs` and extract the target function (e.g., `parseAIStudioJSON`) using Regex. This ensures tests evaluate exact production logic without drift.
- dependency hotspots: Relies entirely on external CDNs (Tailwind, React, Babel) for runtime execution. If a CDN is down or blocks the request, the application fails to load. Tailwind CDN lacks CORS, preventing SRI usage.

## Review Hotspots
- likely correctness risks: The heuristic logic inside `parseAIStudioJSON` mapping varied AI Studio schemas (`data.chunkedPrompt?.chunks`, `sysInstruction`, `part.thought`) must handle nulls, undefined values, and structural variations safely. Specifically, falsy values like `0` must be preserved (e.g., `text !== undefined && text !== null`).
- security risks: Parsing arbitrary JSON files in the browser. No execution of parsed content occurs (it is rendered as text), but extremely large payloads could cause Denial of Service (memory exhaustion).
- performance risks: `parseAIStudioJSON` and `generateMarkdown` must maintain low algorithmic complexity. Current batching (`BATCH_SIZE = 500`) with `setTimeout(..., 0)` yields to the main thread to prevent UI lockup. `previewOutput` string truncation (`MAX_PREVIEW_LENGTH`) prevents massive DOM string allocation.
- state/concurrency risks: Using arrays (`parsedData`, `outputChunks`) means memory footprint grows linearly with uploaded file count. Tracking scalar variables (e.g., `fileCount`) rather than arrays of raw `File` objects prevents critical memory leaks.
- maintainability smells: Storing all logic in a single HTML file requires strict discipline to prevent spaghetti code. Benchmark scripts rely on brittle regex extraction to test inline functions.
- UX/accessibility risks: Toggle switches must use `role="switch"` and `aria-checked`. Loading states must use `aria-live="polite"` and `aria-busy`. Mobile interactions must use `touch-manipulation` to prevent 300ms tap delay.

## Packaging Notes
- exclusions: `screenshot.png` and `LICENSE` were excluded as they contain no behavioral logic.
- compression decisions: `simulation_stress_test.js` was excerpted to show only the critical 'Chaos Mode' data generator, omitting the verbose runner logic and file-system regex extraction logic to maximize density. Benchmark scripts were summarized as they track optimization progress rather than implementing core functionality.
- fidelity limits: The regex-based extraction mechanism used in the benchmark files is not explicitly shown in code blocks, but its behavior and risk profile are summarized under *Cross-File Relationships* and *Review Hotspots*.
- missing/unreadable content: None. All critical files (`index.html`, `package.json`, `.jules/steward.md`) are embedded completely.
- self-containment/downstream review confidence: High. `index.html` contains the entirety of the application logic, styling, and markup. The embedded historical constraints (`steward.md`) provide the necessary context to review the performance and UX optimizations reliably.
