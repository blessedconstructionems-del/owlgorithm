#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const scanDirs = ['src', 'server', 'scraper', 'config'];
const extensions = ['.js', '.jsx'];

function walk(relativeDir) {
  const absoluteDir = path.join(root, relativeDir);
  if (!fs.existsSync(absoluteDir)) return [];

  return fs.readdirSync(absoluteDir, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) return walk(relativePath);
    return extensions.includes(path.extname(entry.name)) ? [relativePath] : [];
  });
}

const files = scanDirs.flatMap(walk);
const fileSet = new Set(files.map((file) => path.resolve(root, file)));

function pickModule(candidateBase) {
  const candidates = [
    candidateBase,
    ...extensions.map((extension) => candidateBase + extension),
    ...extensions.map((extension) => path.join(candidateBase, `index${extension}`)),
  ];

  return candidates.find((candidate) => fileSet.has(path.resolve(candidate))) || null;
}

function resolveImport(specifier, fromFile) {
  if (specifier.startsWith('@/')) {
    return pickModule(path.join(root, 'src', specifier.slice(2)));
  }

  if (specifier.startsWith('.')) {
    return pickModule(path.resolve(path.dirname(path.join(root, fromFile)), specifier));
  }

  return null;
}

function collectLocalDeps(file) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const deps = [];
  const importRe = /(?:import\s+(?:[^"'()]*?\s+from\s+)?|export\s+[^"']*?\s+from\s+|import\s*\(\s*)["']([^"']+)["']/g;
  let match = importRe.exec(text);

  while (match) {
    const resolved = resolveImport(match[1], file);
    if (resolved) deps.push(path.relative(root, resolved));
    match = importRe.exec(text);
  }

  return [...new Set(deps)];
}

const graph = new Map(files.map((file) => [file, collectLocalDeps(file)]));
const cycles = [];
const visiting = new Set();
const visited = new Set();
const stack = [];

function visit(file) {
  if (visiting.has(file)) {
    const cycleStart = stack.indexOf(file);
    cycles.push(stack.slice(cycleStart).concat(file));
    return;
  }

  if (visited.has(file)) return;

  visiting.add(file);
  stack.push(file);

  for (const dep of graph.get(file) || []) {
    visit(dep);
  }

  stack.pop();
  visiting.delete(file);
  visited.add(file);
}

for (const file of files) {
  visit(file);
}

if (cycles.length > 0) {
  console.error('Circular imports found:');
  for (const cycle of cycles) {
    console.error(` - ${cycle.join(' -> ')}`);
  }
  process.exit(1);
}

console.log(`No circular imports found across ${files.length} modules.`);
