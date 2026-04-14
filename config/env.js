import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(__dirname, '..');

const ENV_FILES = ['.env.local', '.env'];
let envLoaded = false;

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) return null;

  const key = trimmed.slice(0, eqIdx).trim();
  const rawValue = trimmed.slice(eqIdx + 1).trim();
  const value = rawValue.replace(/^['"]|['"]$/g, '');

  return { key, value };
}

export function loadProjectEnv() {
  if (envLoaded) return;

  for (const fileName of ENV_FILES) {
    const envPath = path.join(projectRoot, fileName);
    if (!fs.existsSync(envPath)) continue;

    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const parsed = parseEnvLine(line);
      if (!parsed) continue;

      if (!process.env[parsed.key]) {
        process.env[parsed.key] = parsed.value;
      }
    }
  }

  envLoaded = true;
}

export function getRuntimeDataDir() {
  const configured = `${process.env.OWLGORITHM_DATA_DIR || ''}`.trim();
  if (!configured) {
    return path.join(projectRoot, 'server', 'data');
  }

  return path.isAbsolute(configured)
    ? configured
    : path.join(projectRoot, configured);
}

export function getScraperCacheDir() {
  const configuredDataDir = `${process.env.OWLGORITHM_DATA_DIR || ''}`.trim();
  if (configuredDataDir) {
    const dataDir = path.isAbsolute(configuredDataDir)
      ? configuredDataDir
      : path.join(projectRoot, configuredDataDir);
    return path.join(dataDir, 'cache');
  }

  return path.join(projectRoot, 'scraper', 'cache');
}

export function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

loadProjectEnv();
