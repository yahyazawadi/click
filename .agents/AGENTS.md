# Project Guide & Agent Instructions

This repository workspace contains two interconnected projects with multiple deployment pipelines, Cloudflare Workers, and Cloudflare Pages services.

---

## 1. Directory Paths & Repositories

### Root Project: Click Hub / Portfolio
- **Local Absolute Path**: `C:\Users\CLICK\.gemini\antigravity-ide\scratch\yahya-click`
- **Git Remote**: `https://github.com/yahyazawadi/click.git`
- **Branch**: `main`
- **Live Domains**:
  - `https://yahya.click`
  - `https://m.yahya.click`
  - `https://meet.yahya.click`

### Core Web App: Paper Notes (Morazla & Camillia)
- **Local Absolute Path**: `C:\Users\CLICK\.gemini\antigravity-ide\scratch\yahya-click\paper-notes`
- **Git Remote**: `https://github.com/yahyazawadi/camillia.git`
- **Branch**: `main`

---

## 2. Local Development

To run and test the Paper Notes application on localhost:

```powershell
# Navigate to the paper-notes app directory
cd C:\Users\CLICK\.gemini\antigravity-ide\scratch\yahya-click\paper-notes

# Install dependencies (if needed)
npm install

# Start development server
npm run dev -- --port 5180
```
- **Local Dev URL**: `http://localhost:5180`

---

## 3. Cloudflare Account & Serverless Workers

- **Cloudflare Account ID**: `fe19d3afc8180ebd5792c34afb1f85af`

### Worker 1: Paper Notes API & R2 Storage Worker
- **Name**: `morazla-paper-notes`
- **Live Worker URL**: `https://morazla-paper-notes.super-yahyaaa.workers.dev`
- **Source Code**: `paper-notes/src/worker.js`
- **Configuration**: `paper-notes/wrangler.jsonc`
- **Cloudflare R2 Bucket**: `morazla-paper-notes` (Bound as `NOTES_BUCKET`)
- **Key API Endpoints**:
  - `GET https://morazla-paper-notes.super-yahyaaa.workers.dev/api/notes?recipient=morazla` (or `recipient=camillia`)
  - `POST https://morazla-paper-notes.super-yahyaaa.workers.dev/api/notes`
  - `GET https://morazla-paper-notes.super-yahyaaa.workers.dev/api/videos/:filename`
  - `DELETE https://morazla-paper-notes.super-yahyaaa.workers.dev/api/notes/:id`
  - `PATCH https://morazla-paper-notes.super-yahyaaa.workers.dev/api/notes/:id/read`
  - `POST https://morazla-paper-notes.super-yahyaaa.workers.dev/api/auth/verify`
  - `GET https://morazla-paper-notes.super-yahyaaa.workers.dev/api/stats`
- **Admin Access Passcodes**:
  - `camilia666`
  - `camillia666`
  - `lordmora`
  - `morazla2026`
- **Deployment Command**:
  ```powershell
  cd C:\Users\CLICK\.gemini\antigravity-ide\scratch\yahya-click\paper-notes
  $env:CLOUDFLARE_ACCOUNT_ID="fe19d3afc8180ebd5792c34afb1f85af"
  npx wrangler deploy
  ```

---

### Worker 2: Yahya Click Redirect & Social Meta Worker
- **Name**: `yahya-click-redirect`
- **Source Code**: `redirect-worker/worker.js`
- **Configuration**: `redirect-worker/wrangler.toml`
- **Target Destination**: `https://meet.google.com/buc-xsur-fik`
- **Live Routes & Custom Domains**:
  - `https://m.yahya.click`
  - `https://meet.yahya.click`
  - `https://yahya.click/m*`
  - `https://yahya.click/meet*`
- **Deployment Command**:
  ```powershell
  cd C:\Users\CLICK\.gemini\antigravity-ide\scratch\yahya-click\redirect-worker
  $env:CLOUDFLARE_ACCOUNT_ID="fe19d3afc8180ebd5792c34afb1f85af"
  npx wrangler deploy
  ```

---

## 4. Cloudflare Pages Deployment Matrix

Build the static distribution bundle first:
```powershell
cd C:\Users\CLICK\.gemini\antigravity-ide\scratch\yahya-click\paper-notes
npm run build
$env:CLOUDFLARE_ACCOUNT_ID="fe19d3afc8180ebd5792c34afb1f85af"
```

Then deploy to the desired live projects:

#### 1. Morazla Production Site
- **Live URL**: `https://morazla.pages.dev`
- **Command**:
  ```powershell
  npx wrangler pages deploy dist --project-name=morazla
  ```

#### 2. To-Camillia Primary Production Site
- **Live URL**: `https://to-camillia.pages.dev`
- **Command**:
  ```powershell
  npx wrangler pages deploy dist --project-name=to-camillia
  ```

#### 3. Camillia Notes Secondary Domain
- **Live URL**: `https://camillia-notes.pages.dev`
- **Command**:
  ```powershell
  npx wrangler pages deploy dist --project-name=camillia-notes
  ```

#### 4. Camillia Legacy Domain
- **Live URL**: `https://camillia-cyb.pages.dev`
- **Command**:
  ```powershell
  npx wrangler pages deploy dist --project-name=camillia
  ```

---

## 5. Git Source Control Workflow

### In `paper-notes` (`yahyazawadi/camillia`):
```powershell
cd C:\Users\CLICK\.gemini\antigravity-ide\scratch\yahya-click\paper-notes
git add .
git commit -m "feat/fix: description of changes"
git push origin main
```

### In root (`yahyazawadi/click`):
```powershell
cd C:\Users\CLICK\.gemini\antigravity-ide\scratch\yahya-click
git add .
git commit -m "chore: description of changes"
git push origin main
```

---

## 6. Key Architecture & Features

- **Parchment Aesthetics & Shaders**: Warm, vintage editorial paper style, wax seals, real-time dynamic blur filters.
- **Interactive Doodle Canvas (`DoodleCanvas.jsx`)**:
  - High-DPI canvas drawing with undo stack, brush width, and color selector.
  - WebM video recording via `MediaRecorder` + `canvas.captureStream(30)`.
  - Injected EBML duration metadata using `fix-webm-duration` to guarantee exact seekable video playback.
- **Envelope Modal & Custom Video Player (`InboxVault.jsx`)**:
  - Segmented pill switcher: `[ Video / فيديو ]` and `[ Drawing / الرسمة ]`.
  - Minimalist custom player without bulky browser video controls.
  - Native seeking/scrubbing timeline slider with exact millisecond resolution.
- **Dual Support**: Full Arabic (`dir="rtl"`) and English (`dir="ltr"`) typography and i18n dictionary.

---

## 7. Strict Agent Rules

1. **Protect Visual & Feature Quality**: Never break or remove working shaders, 3D origami folds, or paper aesthetic elements.
2. **Local Testing First**: Always test and verify features on `http://localhost:5180` before making commits or deployments.
3. **Explicit Deployment Permission**: Never push to remote or deploy to Cloudflare unless explicitly requested by the user.
