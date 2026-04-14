import { XMLParser } from 'fast-xml-parser';

const REQUEST_HEADERS = {
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'user-agent': 'Owlgorithm/0.1 (+https://github.com/blessedconstructionems-del/owlgorithm)',
};

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
});

export async function fetchText(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 30000);

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...REQUEST_HEADERS,
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }

    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchXml(url, options = {}) {
  const xml = await fetchText(url, options);
  return xmlParser.parse(xml);
}

export function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function cleanWhitespace(value) {
  return decodeHtmlEntities(`${value || ''}`)
    .replace(/\s+/g, ' ')
    .trim();
}

export function decodeHtmlEntities(value) {
  return `${value || ''}`
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&apos;/g, '\'')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export function parseCompactNumber(value) {
  const cleaned = cleanWhitespace(value).replace(/,/g, '').replace(/\+/g, '');
  const match = cleaned.match(/([\d.]+)\s*([KMB])?/i);
  if (!match) return 0;

  const base = Number.parseFloat(match[1]);
  if (!Number.isFinite(base)) return 0;

  const suffix = (match[2] || '').toUpperCase();
  if (suffix === 'K') return Math.round(base * 1000);
  if (suffix === 'M') return Math.round(base * 1000000);
  if (suffix === 'B') return Math.round(base * 1000000000);
  return Math.round(base);
}

export function uniqueByName(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = cleanWhitespace(item?.name).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function isUsefulTopic(name) {
  const cleaned = cleanWhitespace(name);
  if (cleaned.length < 3 || cleaned.length > 140) return false;

  const lower = cleaned.toLowerCase();
  const blockedExact = new Set([
    'and more',
    'top trending',
    'top trends',
    'trending',
    'trending now',
    'trending today',
    'viral videos',
    'today trending',
    'youtube records',
    'media trends',
    'trend calendar us',
    'top viral videos',
  ]);

  if (blockedExact.has(lower)) return false;
  if (/^(today|trending|viral|latest)\b/i.test(cleaned)) return false;
  if (/^\d{1,2}\s+[A-Za-z]+$/.test(cleaned) || /^[A-Za-z]+\s+\d{1,2}$/.test(cleaned)) return false;
  if (/^(good|happy|new)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|week)$/i.test(cleaned)) return false;

  return true;
}
