// Anti-detection utilities for Bright Data scraping
// Random delays, human-like patterns

export function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function humanDelay(type = 'action') {
  const delays = {
    action: [800, 2000],
    scroll: [300, 1200],
    click: [500, 1500],
    page: [1500, 3500],
    between_platforms: [3000, 6000],
  };
  const [min, max] = delays[type] || delays.action;
  await delay(randomBetween(min, max));
}

export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
];

export function randomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1680, height: 1050 },
];

export function randomViewport() {
  return VIEWPORTS[Math.floor(Math.random() * VIEWPORTS.length)];
}
