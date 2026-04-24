# Nexora - PM Session Manager

**Nexora** is a premium, locally-stored Chrome Extension (Manifest V3) specifically engineered for Product Managers. It enables PMs to save, organize, and instantly restore complex browser sessions—ensuring contextual continuity across sprints, planning, and daily workflows.

---

## 📖 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture & Folder Structure](#architecture--folder-structure)
4. [Development Phases Log](#development-phases-log)
5. [Feature Roadmap](#feature-roadmap)
6. [Testing & Deployment](#testing--deployment)
7. [Changelog](#changelog)

---

## 1. Project Overview
- **Name:** Nexora
- **Core Purpose:** Save and restore browser tab sessions to reduce mental load and prevent context loss.
- **Target User:** Product Managers switching context between Jira, Confluence, Figma, Analytics, Slack, and Notion.
- **Privacy:** 100% local storage. No cloud integration (in the initial phases), ensuring total data privacy for enterprise users.

## 2. Technology Stack
- **Extension Framework:** Chrome Extensions Manifest V3
- **Frontend Core:** React.js (v19)
- **Build Tool:** Vite.js
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Typography:** Inter (Google Fonts)

## 3. Architecture & Folder Structure
```text
/Vieron (Project Root)
├── /dist                   # The compiled extension ready for Chrome loading
├── /public                 
│   ├── background.js       # Background service worker (Event listening)
│   └── manifest.json       # Manifest V3 configuration & permissions
├── /src                    
│   ├── App.jsx             # Main UI logic, State Management, Tab/Storage Logic
│   ├── index.css           # Global Tailwind & Custom scrollbar styles
│   └── main.jsx            # React root injection
├── index.html              # Extension popup container
├── package.json            # Node.js dependencies
└── vite.config.js          # Vite build configuration tailored for Chrome Extension
```

## 4. Development Phases Log

### Phase 1: Minimum Viable Product (MVP) - *Completed*
- [x] Initialized Chrome Manifest V3 setup.
- [x] Engineered `chrome.storage.local` database schema for saving sessions.
- [x] Built core `chrome.tabs.query` logic to capture current active tabs.
- [x] Added restoration logic utilizing `chrome.windows.create`.

### Phase 2: UI/UX Enhancements - *Completed*
- [x] Designed a sleek, dark professional theme optimized for PMs.
- [x] Built smooth micro-animations, hover states, and dynamic status banners.
- [x] Sorted sessions intelligently by most recent creation date.
- [x] Integrated custom scrollbars for a polished, application-like feel.

### Phase 3: Smart PM Features - *Completed*
- [x] Integrated Auto-Detection System for major PM software URLs (Jira, Confluence, Figma, Notion, Slack).
- [x] Created an auto-titling algorithm (e.g., detects Jira + Confluence and auto-suggests "Sprint Planning Session").
- [x] Implemented dynamic UI suggestions.

## 5. Feature Roadmap (Upcoming)
*These features are planned for future iterations and will be tracked in the Changelog upon implementation.*
- **Phase 4:** Auto-save listeners triggering silently when an active window is closed (`chrome.windows.onRemoved`).
- **Phase 5:** LLM (AI) generated one-line summary describing the saved session content.
- **Phase 6:** Export/Import JSON utilities for session sharing.
- **Phase 7:** Enterprise Cloud Sync (Supabase/Firebase integration) for cross-device access.

## 6. Testing & Deployment

### Testing Locally
1. Compile the latest code:
   ```bash
   npm run build
   ```
2. Open Chrome and navigate to `chrome://extensions/`.
3. Toggle **Developer mode** in the top right corner.
4. Click **Load unpacked** in the top left.
5. Select the `/dist` directory located inside this project folder.
6. Click the Extensions Puzzle Icon and pin **Nexora** to your toolbar.

### Post-Deployment Checks
- [ ] Save an active window and verify success banner.
- [ ] Ensure AI smart-suggestion triggers accurately when PM tools are open.
- [ ] Open a blank window and successfully restore a saved session.
- [ ] Test the deletion sequence.

## 7. Changelog
*Any subsequent modifications, updates, or feature injections will be strictly recorded here.*

- **[2026-04-24] v1.0.0:** 
  - Initialized Project Setup.
  - Deployed Phases 1, 2, and 3 simultaneously.
  - Implemented React + Vite + Tailwind v4 stack.
  - Verified Manifest V3 compliance and compiled into `/dist`.

---
*Note: This file serves as the definitive source of truth for the Nexora codebase and architecture. All future structural modifications must be documented here.*
