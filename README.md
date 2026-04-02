# AI Studio History Cleaner v1.2.40

A lightweight, browser-based tool to parse and clean up exported chat history JSON files from Google AI Studio. It extracts the conversation into a clean, readable Markdown format, with optional support for including "Thinking" (Reasoning) blocks.

[**Live Demo**](https://shfqrkhn.github.io/AI-Studio-Cleaner/)

![Screenshot](./screenshot.png)

## 🚀 Features

- **Drag & Drop Interface**: Easily upload multiple JSON export files at once.
- **Smart Parsing**: Automatically handles different JSON structures (`chunks`, `parts`, etc.) found in AI Studio exports.
- **Reasoning Toggle**: Choose whether to include or hide the internal "Thinking" blocks from the model.
- **Markdown Preview**: View the generated Markdown directly in the browser.
- **One-Click Copy/Download**: Copy the result to your clipboard or download it as a `.md` file.
- **Zero Dependencies**: Runs entirely in the browser using a single HTML file. No backend or build step required.

## 🛠️ How to Use

### Option 1: Live Demo (GitHub Pages)

https://shfqrkhn.github.io/AI-Studio-Cleaner/

### Option 2: Run Locally

1. Download the `index.html` file from this repository.
2. Double-click `index.html` to open it in your web browser.
3. Drag and drop your Google AI Studio `.json` files into the upload zone.

## 📦 Deployment

This project is designed to be hosted effortlessly on **GitHub Pages** without any build process (npm/yarn/vite).

1. **Fork or Clone** this repository.
2. Ensure `index.html` is in the root directory.
3. Go to your repository **Settings** > **Pages**.
4. Under **Source**, select `Deploy from a branch`.
5. Under **Branch**, select `main` (or `master`) and `/ (root)`.
6. Click **Save**.

Your site will be live in a few moments!

## 💻 Tech Stack

- **React 18** (via CDN)
- **Tailwind CSS** (via CDN for styling)
- **Babel Standalone** (for in-browser JSX compilation)
- **Inline SVG Icons** (custom lightweight icons)

## 📄 License


MIT License - feel free to use, modify, and distribute as you wish.
