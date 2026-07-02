# CLAUDE.md

This file provides guidance for AI assistants working with this codebase.

## Project Overview

**AI Studio History Cleaner** (v1.2.40) is a lightweight, browser-based tool that parses Google AI Studio JSON export files and converts them to clean, readable Markdown format. It supports optional inclusion of model "thinking/reasoning" blocks.

**Live Demo**: https://shfqrkhn.github.io/AI-Studio-Cleaner/

## Architecture

### Single-File Application
The entire application lives in `index.html` - a self-contained React app with no build step required. This design choice enables:
- Zero-dependency deployment (just serve the HTML file)
- GitHub Pages hosting without any CI/CD pipeline
- Easy local usage (double-click to open)

### Technology Stack
- **React 18** (via unpkg CDN)
- **Tailwind CSS** (via cdn.tailwindcss.com)
- **Babel Standalone** (for in-browser JSX compilation)
- **No Node.js runtime required** for the app itself

### Key Components in index.html

| Line Range | Component/Function | Purpose |
|------------|-------------------|---------|
| 34-48 | `Icon`, `Icons` | Inline SVG icon components |
| 52-56 | `Card` | Reusable card wrapper |
| 58-74 | `Button` | Styled button with variants |
| 79-130 | `parseAIStudioJSON()` | Core JSON parsing logic (defined outside component for performance) |
| 132-358 | `App()` | Main application component |

## File Structure

```
/
├── index.html              # Main application (React + Tailwind + Babel)
├── package.json            # Metadata only (no dependencies)
├── README.md               # User documentation
├── CLAUDE.md               # AI context and instructions
├── LICENSE                 # MIT License
├── .jules/steward.md       # Known constraints and protocols
│
├── benchmark_icon_paths.js     # SVG path merging vs separate nodes
├── benchmark_loop.js           # for..of vs forEach performance
├── benchmark_markdown_gen.js   # String concat vs array join
├── benchmark_optimization.js   # Parser optimization comparison
├── simulation_stress_test.js   # Large-scale stress testing (24-240 months)
│
├── screenshot.png          # Screenshot for README
```

## Development Guidelines

### Performance Patterns (IMPORTANT)

The codebase has specific performance optimizations that must be preserved:

1. **Define functions outside React components**
   - `parseAIStudioJSON` is defined at module level, NOT inside `App()`
   - This prevents function recreation on every render (~5.4x faster)

2. **Use static style objects**
   - `variants` and `baseStyle` are defined outside `Button` component
   - Prevents object recreation on every render

3. **Prefer `String.replace()` over `split/map/join`**
   - For indenting text: `'> ' + text.replace(/\n/g, '\n> ')` (~2.6x faster)
   - NOT: `text.split('\n').map(l => '> ' + l).join('\n')`

4. **Use array push + join for string building**
   - Build strings with `parts.push()` then `parts.join('')`
   - NOT: repeated string concatenation (`+=`)

### Known Constraints

From `.jules/steward.md`:

1. **Tailwind CDN CORS Constraint**: Cannot use Subresource Integrity (SRI) with `cdn.tailwindcss.com` - no CORS headers are served.

2. **Mobile Input Latency**: All interactive elements must use `touch-manipulation` class to eliminate 300ms tap delay.

3. **Empty Thought Filtering**: The parser must filter out whitespace-only thought blocks to prevent visual noise.

### Code Style

- Single-file architecture - keep everything in `index.html`
- Use inline SVG for icons (avoid external icon libraries)
- Tailwind utility classes for all styling
- React hooks: `useState`, `useMemo` only (no external state management)

## Testing

### Running Benchmarks

All benchmarks are Node.js scripts run from the terminal:

```bash
# Core parsing performance
node benchmark_optimization.js

# Loop performance (forEach vs for..of)
node benchmark_loop.js

# Markdown generation strategies
node benchmark_markdown_gen.js

# Icon path rendering optimization
node benchmark_icon_paths.js

# Full stress test (24, 60, 120, 240 months + chaos mode)
node simulation_stress_test.js
```

### Stress Test Scenarios

`simulation_stress_test.js` validates:
- **Scale**: 24 to 240 months of chat history (1,200 to 12,000 files)
- **Large files**: Single file with 5,000 messages
- **Chaos mode**: Malformed JSON, empty files, null values, wrong types

### Benchmark Conventions

- Each benchmark extracts logic from `index.html` or recreates it
- Use `perf_hooks.performance.now()` for timing
- Include warmup iterations before measurement
- Verify correctness (outputs match) before reporting speedup

## JSON Format Support

The parser handles multiple AI Studio export formats:

```javascript
// Format 1: chunkedPrompt wrapper
{ "chunkedPrompt": { "chunks": [...] } }

// Format 2: Direct chunks array
{ "chunks": [...] }

// Chunk structure
{
  "role": "user" | "model",
  "text": "...",           // Optional: direct text
  "parts": [               // Optional: structured parts
    { "text": "...", "thought": true },  // Thinking block
    { "text": "...", "isThought": true }, // Alt format
    { "text": "..." }       // Regular content
  ]
}
```

## Common Tasks

### Adding a New Feature
1. Read the existing `index.html` thoroughly
2. Keep changes minimal and within the single-file architecture
3. Run relevant benchmarks to ensure no performance regression
4. Test with `simulation_stress_test.js` for edge cases

### Fixing Bugs
1. Check if the issue is covered by chaos mode in stress tests
2. Add a new chaos case if not covered
3. Fix in `index.html`
4. Verify fix doesn't break other scenarios

### Updating Dependencies
CDN versions are pinned in `index.html`:
- React: 18.3.1
- ReactDOM: 18.3.1
- Babel: 7.28.6
- Tailwind: 3.4.17

Update with caution - test thoroughly after version changes.

## Deployment

Deployed automatically via GitHub Pages from the `main` branch root directory. No build step - just push to main.

## Do NOT

- Add a build process (webpack, vite, etc.)
- Split into multiple files
- Add npm dependencies for runtime
- Add SRI to Tailwind CDN script
- Remove `touch-manipulation` from interactive elements
- Move `parseAIStudioJSON` inside the `App` component
- Use string concatenation for building large outputs
