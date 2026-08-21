#!/usr/bin/env bun
/**
 * ER - Universal Emoji Remover CLI for Windows & Cross-Platform
 * ─────────────────────────────────────────────────────────────────────────────
 * Detects and deletes Unicode emojis, skin tones, ZWJ sequences, and emoji
 * variation selectors while strictly preserving UI arrows (◀, ▶, ▲, ▼), multiplication/close
 * marks (✕, ✖), checkmarks (✓), standard punctuation, Arabic/CJK scripts, and code syntax.
 *
 * Usage:
 *   er <file>
 *   er <file1> <file2> ...
 *   er .                        (processes current workspace recursively)
 *   er src/                     (processes all text files in src/ recursively)
 *   er src/ -d                  (dry run: preview matches without writing)
 */

import fs from 'node:fs';
import path from 'node:path';

// Precise Emoji Regex:
// Targets real emojis, pictographs, flags, variation selectors, and compound sequences.
// Strictly protects UI navigation marks: ◀, ▶, ▲, ▼, ✕, ✖, ✓, ✔
const EMOJI_REGEX = /(?:(?![\u25C0\u25B6\u25B2\u25BC\u2713-\u2716])\p{Extended_Pictographic}|[\u{1F300}-\u{1FAFF}]|[\u{1F1E6}-\u{1F1FF}]{2})(?:[\uFE0E\uFE0F])?(?:[\u{1F3FB}-\u{1F3FF}])?(?:\u200D(?:(?![\u25C0\u25B6\u25B2\u25BC\u2713-\u2716])\p{Extended_Pictographic}|[\u{1F300}-\u{1FAFF}])(?:[\uFE0E\uFE0F])?(?:[\u{1F3FB}-\u{1F3FF}])?)*[ \t]?/gu;

// Directories to skip automatically
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.turbo',
  'coverage',
  '.agents',
  '.session-memory',
  '.system_generated'
]);

// Binary file extensions to skip automatically
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg',
  '.mp4', '.webm', '.mp3', '.wav', '.ogg',
  '.pdf', '.zip', '.tar', '.gz', '.7z', '.rar',
  '.exe', '.dll', '.bin', '.iso', '.obj', '.fbx', '.gltf', '.glb',
  '.wasm', '.lock', '.woff', '.woff2', '.ttf', '.eot', '.otf'
]);

// Parse CLI Arguments
const args = process.argv.slice(2);
let isDryRun = false;
let isVerbose = false;
const targetPaths: string[] = [];

for (const arg of args) {
  const lower = arg.toLowerCase();
  if (lower === '-d' || lower === '--dry-run') {
    isDryRun = true;
  } else if (lower === '-v' || lower === '--verbose') {
    isVerbose = true;
  } else if (lower === '-h' || lower === '--help' || lower === 'h' || lower === 'help') {
    printHelp();
    process.exit(0);
  } else if (lower === '--version' || lower === 'version') {
    console.log('er (Emoji Remover) v1.0.0');
    process.exit(0);
  } else if (!arg.startsWith('-')) {
    targetPaths.push(arg);
  }
}

if (targetPaths.length === 0) {
  printHelp();
  process.exit(1);
}

function printHelp() {
  console.log(`
\x1b[1m\x1b[36mER (Emoji Remover)\x1b[0m — \x1b[90mUniversal Emoji Detector & Purger CLI\x1b[0m
\x1b[90mScans, detects, and safely deletes Unicode emojis while preserving code & UI syntax.\x1b[0m

\x1b[1mUSAGE:\x1b[0m
  er [options] <files-or-directories...>

\x1b[1mEXAMPLES:\x1b[0m
  \x1b[32mer index.html\x1b[0m                  # Process a single file
  \x1b[32mer src/\x1b[0m                        # Process entire folder recursively
  \x1b[32mer .\x1b[0m                           # Process current workspace / all project files
  \x1b[32mer src/ -d\x1b[0m                     # Dry-run: preview detected emojis without editing
  \x1b[32mer . -v\x1b[0m                        # Verbose: show matched emojis line-by-line
  \x1b[32mer file1.md file2.js\x1b[0m          # Process multiple specific files

\x1b[1mOPTIONS:\x1b[0m
  -d, --dry-run                  Preview matches without writing any changes to disk
  -v, --verbose                  Show detailed sample of matched emojis per file
  -h, --help                     Display this help menu
  --version                      Display tool version
`);
}

// Check if a buffer appears to be binary
function isBinaryFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  if (BINARY_EXTENSIONS.has(ext)) return true;

  try {
    const buffer = Buffer.alloc(512);
    const fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
    fs.closeSync(fd);

    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) return true;
    }
  } catch {
    return false;
  }
  return false;
}

// Collect all target files recursively
function collectFiles(inputPath: string): string[] {
  const resolved = path.resolve(inputPath);
  if (!fs.existsSync(resolved)) {
    console.warn(`\x1b[33m[!] Path not found:\x1b[0m ${inputPath}`);
    return [];
  }

  const stat = fs.statSync(resolved);
  if (stat.isFile()) {
    return isBinaryFile(resolved) ? [] : [resolved];
  }

  if (stat.isDirectory()) {
    const baseName = path.basename(resolved);
    if (IGNORED_DIRS.has(baseName)) return [];

    const results: string[] = [];
    const entries = fs.readdirSync(resolved, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.env') {
        if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) continue;
      }
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          results.push(...collectFiles(path.join(resolved, entry.name)));
        }
      } else if (entry.isFile()) {
        const fullPath = path.join(resolved, entry.name);
        if (!isBinaryFile(fullPath)) {
          results.push(fullPath);
        }
      }
    }
    return results;
  }

  return [];
}

// Main Execution
let totalFilesScanned = 0;
let totalFilesModified = 0;
let totalEmojisRemoved = 0;

const allFiles = new Set<string>();

for (const target of targetPaths) {
  const files = collectFiles(target);
  for (const f of files) allFiles.add(f);
}

if (allFiles.size === 0) {
  console.log('\x1b[33mNo text files found to process.\x1b[0m');
  process.exit(0);
}

console.log(`\x1b[36m[er]\x1b[0m Scanning \x1b[1m${allFiles.size}\x1b[0m files${isDryRun ? ' \x1b[33m(DRY RUN)\x1b[0m' : ''}...`);

for (const filePath of allFiles) {
  totalFilesScanned++;
  try {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    const matches = originalContent.match(EMOJI_REGEX);

    if (!matches || matches.length === 0) continue;

    const emojiCount = matches.length;
    totalEmojisRemoved += emojiCount;
    totalFilesModified++;

    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`\x1b[32m✔\x1b[0m \x1b[1m${relativePath}\x1b[0m \x1b[90m— ${isDryRun ? 'found' : 'removed'} ${emojiCount} emoji${emojiCount > 1 ? 's' : ''}\x1b[0m`);

    if (isVerbose) {
      const sample = matches.slice(0, 5).map(m => m.trim()).join(' ');
      console.log(`   \x1b[90mFound: ${sample}${matches.length > 5 ? '...' : ''}\x1b[0m`);
    }

    if (!isDryRun) {
      const cleaned = originalContent.replace(EMOJI_REGEX, '');
      fs.writeFileSync(filePath, cleaned, 'utf8');
    }
  } catch (err: any) {
    console.error(`\x1b[31m[x] Error processing ${filePath}:\x1b[0m`, err?.message || err);
  }
}

console.log(`\n\x1b[1m\x1b[36m[er SUMMARY]\x1b[0m`);
console.log(`  Scanned:  ${totalFilesScanned} files`);
console.log(`  Modified: ${totalFilesModified} files`);
console.log(`  Emojis:   ${totalEmojisRemoved} ${isDryRun ? 'detected' : 'deleted'}`);
if (isDryRun && totalEmojisRemoved > 0) {
  console.log(`\x1b[33m  Run without -d to apply changes.\x1b[0m\n`);
}
