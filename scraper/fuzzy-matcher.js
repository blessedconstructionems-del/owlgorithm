// Cross-platform fuzzy trend matcher
// Merges the same trend appearing on different platforms under different names

export function fuzzyMatch(trends) {
  const groups = [];

  for (const trend of trends) {
    const keywords = extractKeywords(trend.name);
    let bestMatch = null;
    let bestScore = 0;

    for (const group of groups) {
      const score = computeSimilarity(keywords, group.keywords, trend, group);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = group;
      }
    }

    if (bestMatch && bestScore >= 0.7) {
      bestMatch.items.push(trend);
      bestMatch.keywords = mergeKeywords(bestMatch.keywords, keywords);
    } else {
      groups.push({
        keywords,
        items: [trend],
        name: trend.name, // Use first seen name
      });
    }
  }

  return groups;
}

function extractKeywords(name) {
  return name
    .toLowerCase()
    .replace(/[#@]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2)
    .filter(w => !STOP_WORDS.has(w));
}

function mergeKeywords(existing, incoming) {
  const set = new Set([...existing, ...incoming]);
  return [...set];
}

function computeSimilarity(kw1, kw2, trend1, group) {
  if (kw1.length === 0 || kw2.length === 0) return 0;

  // 1. Keyword overlap (Jaccard-ish)
  const set1 = new Set(kw1);
  const set2 = new Set(kw2);
  const intersection = [...set1].filter(w => set2.has(w)).length;
  const union = new Set([...set1, ...set2]).size;
  const keywordScore = intersection / union;

  // 2. Exact hashtag match bonus
  const name1 = trend1.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const name2 = group.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const exactBonus = name1 === name2 ? 0.3 : 0;

  // 3. Temporal proximity — trends within 48h
  const t1 = new Date(trend1.scrapedAt).getTime();
  const groupTimes = group.items.map(i => new Date(i.scrapedAt).getTime());
  const closest = Math.min(...groupTimes.map(t => Math.abs(t - t1)));
  const hoursDiff = closest / (1000 * 60 * 60);
  const temporalScore = hoursDiff <= 48 ? 1.0 : hoursDiff <= 168 ? 0.5 : 0.1;

  // Weighted combination
  return (keywordScore * 0.5) + (exactBonus) + (temporalScore * 0.2);
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'must', 'need',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'and', 'or', 'but', 'not', 'so', 'if', 'then', 'than', 'that',
  'this', 'these', 'those', 'it', 'its', 'my', 'your', 'his', 'her',
  'how', 'what', 'when', 'where', 'who', 'why', 'which',
  'new', 'top', 'best', 'most', 'just', 'now', 'today', 'vs',
]);
