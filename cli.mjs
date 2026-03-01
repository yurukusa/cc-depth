#!/usr/bin/env node
/**
 * cc-depth — How many turns per Claude Code session?
 * Shows the distribution of conversation depth across your sessions.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const showHelp = args.includes('--help') || args.includes('-h');
const projectsFlag = args.find(a => a.startsWith('--projects='));
const projectsFilter = projectsFlag ? projectsFlag.split('=')[1] : null;

if (showHelp) {
  console.log(`cc-depth — Conversation depth per Claude Code session

Usage:
  npx cc-depth               # All sessions
  npx cc-depth --json        # JSON output
  npx cc-depth --projects=cc-loop  # Filter by project name

Shows how many turns (user messages) occur per session.
`);
  process.exit(0);
}

// Find ~/.claude/projects directory
const claudeDir = join(homedir(), '.claude', 'projects');

function scanProjects(dir) {
  const sessions = [];
  let projectDirs;
  try {
    projectDirs = readdirSync(dir);
  } catch {
    return sessions;
  }

  for (const projDir of projectDirs) {
    if (projectsFilter && !projDir.includes(projectsFilter)) continue;
    const projPath = join(dir, projDir);
    let entries;
    try {
      entries = readdirSync(projPath);
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.endsWith('.jsonl')) continue;
      // Skip subagent files
      if (projPath.includes('/subagents/') || entry.includes('subagent')) continue;

      const filePath = join(projPath, entry);
      // Check subdirs (subagents)
      try {
        const stat = statSync(filePath);
        if (!stat.isFile()) continue;
      } catch {
        continue;
      }

      // Count "type":"user" occurrences in file
      let content;
      try {
        content = readFileSync(filePath, 'utf8');
      } catch {
        continue;
      }

      // Fast string counting — "type":"user" at top level
      // Each line is one JSON object; we count lines containing this pattern
      let turns = 0;
      let firstTimestamp = null;
      const lines = content.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        // Count user turns
        if (line.includes('"type":"user"')) {
          turns++;
        }
        // Grab first timestamp for date info
        if (!firstTimestamp && line.includes('"timestamp"')) {
          const m = line.match(/"timestamp":"([^"]+)"/);
          if (m) firstTimestamp = m[1];
        }
      }

      if (turns > 0) {
        sessions.push({
          id: entry.replace('.jsonl', ''),
          project: projDir,
          turns,
          date: firstTimestamp ? new Date(firstTimestamp) : null,
        });
      }
    }
  }

  return sessions;
}

const sessions = scanProjects(claudeDir);

if (sessions.length === 0) {
  console.error('No session files found. Make sure ~/.claude/projects/ exists.');
  process.exit(1);
}

// Sort by turns ascending for stats
const turnCounts = sessions.map(s => s.turns).sort((a, b) => a - b);
const n = turnCounts.length;
const total = turnCounts.reduce((a, b) => a + b, 0);
const median = turnCounts[Math.floor(n / 2)];
const mean = total / n;
const max = turnCounts[n - 1];
const min = turnCounts[0];

// Peak session
const peakSession = sessions.reduce((a, b) => a.turns > b.turns ? a : b);

// Distribution buckets
const buckets = [
  { label: '1',      min: 1,  max: 1,   count: 0 },
  { label: '2–5',   min: 2,  max: 5,   count: 0 },
  { label: '6–15',  min: 6,  max: 15,  count: 0 },
  { label: '16–30', min: 16, max: 30,  count: 0 },
  { label: '31–60', min: 31, max: 60,  count: 0 },
  { label: '61–100',min: 61, max: 100, count: 0 },
  { label: '101+',  min: 101, max: Infinity, count: 0 },
];

for (const t of turnCounts) {
  for (const b of buckets) {
    if (t >= b.min && t <= b.max) {
      b.count++;
      break;
    }
  }
}

// Classification
function classify(median) {
  if (median <= 3)  return { label: '💬 Quick Prompter',     desc: 'one-shot queries, fast iterations' };
  if (median <= 10) return { label: '✅ Task Completer',      desc: 'focused task sessions' };
  if (median <= 30) return { label: '🤝 Collaborative Coder', desc: 'back-and-forth workflow' };
  return                   { label: '🔄 Loop Runner',         desc: 'extended sessions or autonomous loop' };
}

const style = classify(median);

if (jsonMode) {
  console.log(JSON.stringify({
    sessions: n,
    median_turns: median,
    mean_turns: Math.round(mean),
    min_turns: min,
    max_turns: max,
    style: style.label,
    buckets: buckets.map(b => ({ range: b.label, count: b.count, pct: Math.round(b.count / n * 100) })),
    peak: { id: peakSession.id, turns: peakSession.turns, date: peakSession.date },
  }, null, 2));
  process.exit(0);
}

// Bar chart rendering
const BAR_WIDTH = 30;
const maxCount = Math.max(...buckets.map(b => b.count));

function bar(count) {
  const filled = maxCount > 0 ? Math.round((count / maxCount) * BAR_WIDTH) : 0;
  return '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled);
}

function rpad(str, len) {
  return str + ' '.repeat(Math.max(0, len - str.length));
}

console.log('cc-depth — Turns per session\n');

for (const b of buckets) {
  const label = rpad(b.label, 7);
  const countStr = String(b.count).padStart(4);
  const pct = (b.count / n * 100).toFixed(0).padStart(3);
  console.log(`  ${label}  ${bar(b.count)}  ${countStr}  (${pct}%)`);
}

console.log('\n' + '─'.repeat(57));
console.log(`  Median:  ${median} turns/session`);
console.log(`  Mean:    ${Math.round(mean)} turns/session`);
console.log(`  Peak:    ${max.toLocaleString()} turns`);
console.log(`  Style:   ${style.label}  (${style.desc})`);
console.log(`\n  Analyzed ${n} sessions`);
