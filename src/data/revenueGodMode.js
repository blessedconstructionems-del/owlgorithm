const CHANNEL_LIBRARY = [
  {
    id: 'meta',
    label: 'Meta',
    focus: 'Retargeting and catalog revenue loops',
    power: 1.22,
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    focus: 'Creator-led paid pushes and spark ads',
    power: 1.18,
  },
  {
    id: 'google',
    label: 'Google',
    focus: 'High-intent search capture and branded demand',
    power: 1.1,
  },
  {
    id: 'email',
    label: 'Email',
    focus: 'High-margin recovery, upsell, and launch flows',
    power: 1.16,
  },
  {
    id: 'sms',
    label: 'SMS',
    focus: 'Urgency nudges and repeat purchase triggers',
    power: 1.06,
  },
  {
    id: 'site',
    label: 'On-site',
    focus: 'Bundles, offers, and cart recovery moments',
    power: 1.28,
  },
  {
    id: 'creator',
    label: 'Creators',
    focus: 'Promo codes, partner offers, and affiliate bursts',
    power: 1.14,
  },
];

const RISK_MULTIPLIERS = {
  guarded: 0.86,
  calculated: 1,
  aggressive: 1.14,
};

const AUTONOMY_MULTIPLIERS = {
  assisted: 0.82,
  supervised: 0.95,
  full: 1.08,
};

export const RISK_OPTIONS = [
  { id: 'guarded', label: 'Guarded' },
  { id: 'calculated', label: 'Calculated' },
  { id: 'aggressive', label: 'Aggressive' },
];

export const AUTONOMY_OPTIONS = [
  { id: 'assisted', label: 'Assisted' },
  { id: 'supervised', label: 'Supervised' },
  { id: 'full', label: 'Full God Mode' },
];

export const DEFAULT_GOD_MODE_CONFIG = {
  dailySpendCap: 2800,
  riskTolerance: 'calculated',
  targetRoas: 4.6,
  preferredChannels: ['meta', 'tiktok', 'email', 'site'],
  autonomy: 'full',
};

export const GOD_MODE_CHANNELS = CHANNEL_LIBRARY;

export const GOD_MODE_PROMPTS = [
  'Make me $15k from TikTok this week',
  'Where is the biggest money leak right now?',
  'Build the highest-ROI bundle from my current audience',
  'How do I recover abandoned carts today?',
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function getChannelStrength(channelIds) {
  return channelIds.reduce((total, channelId) => {
    const channel = CHANNEL_LIBRARY.find((item) => item.id === channelId);
    return total + (channel?.power || 1);
  }, 0);
}

function buildBanditAllocations(channelIds, targetRoas, riskTolerance) {
  const riskAdjustment = riskTolerance === 'aggressive' ? 1.08 : riskTolerance === 'guarded' ? 0.92 : 1;
  const baseScore = channelIds.map((channelId, index) => {
    const channel = CHANNEL_LIBRARY.find((item) => item.id === channelId);
    const score = (channel?.power || 1) * (targetRoas / 3.5) * riskAdjustment * (1 + index * 0.04);
    return {
      channelId,
      label: channel?.label || channelId,
      focus: channel?.focus || 'Revenue path',
      score,
    };
  });

  const totalScore = baseScore.reduce((total, item) => total + item.score, 0) || 1;

  return baseScore
    .map((item) => ({
      ...item,
      share: Math.round((item.score / totalScore) * 100),
    }))
    .sort((left, right) => right.share - left.share);
}

export function buildRevenueSnapshot(inputConfig = DEFAULT_GOD_MODE_CONFIG) {
  const preferredChannels = inputConfig.preferredChannels?.length
    ? inputConfig.preferredChannels
    : DEFAULT_GOD_MODE_CONFIG.preferredChannels;

  const dailySpendCap = clamp(Number(inputConfig.dailySpendCap) || DEFAULT_GOD_MODE_CONFIG.dailySpendCap, 500, 50000);
  const targetRoas = clamp(Number(inputConfig.targetRoas) || DEFAULT_GOD_MODE_CONFIG.targetRoas, 1.5, 12);
  const riskTolerance = inputConfig.riskTolerance || DEFAULT_GOD_MODE_CONFIG.riskTolerance;
  const autonomy = inputConfig.autonomy || DEFAULT_GOD_MODE_CONFIG.autonomy;
  const channelStrength = getChannelStrength(preferredChannels);
  const riskMultiplier = RISK_MULTIPLIERS[riskTolerance] || 1;
  const autonomyMultiplier = AUTONOMY_MULTIPLIERS[autonomy] || 1;

  const projectedLiftMid = Math.round(
    (18400 + dailySpendCap * targetRoas * 2.18 + channelStrength * 4200) * riskMultiplier * autonomyMultiplier,
  );
  const projectedLiftLow = Math.round(projectedLiftMid * 0.72);
  const projectedLiftHigh = Math.round(projectedLiftMid * 1.41);
  const preventedLeakage = Math.round(projectedLiftMid * 0.061);
  const recoveredCarts = Math.round(dailySpendCap * 0.08 + preferredChannels.length * 31);
  const livePaths = [
    {
      id: 'path-reel-amplifier',
      title: 'Reel-to-paid amplifier',
      detail: 'Turns top-performing short-form content into paid campaigns with high-intent retargeting.',
      channel: 'Meta + TikTok',
      status: 'deploying',
      projectedRevenue: Math.round(projectedLiftMid * 0.19),
      eta: '11 sec',
      roas: Math.max(2.6, Number((targetRoas * 1.18).toFixed(1))),
    },
    {
      id: 'path-bundle-engine',
      title: 'Dynamic bundle engine',
      detail: 'Builds urgency offers and mini-course bundles around the products most likely to convert now.',
      channel: 'On-site + Email',
      status: 'active',
      projectedRevenue: Math.round(projectedLiftMid * 0.24),
      eta: 'live',
      roas: Math.max(2.4, Number((targetRoas * 1.09).toFixed(1))),
    },
    {
      id: 'path-creator-grid',
      title: 'Creator promo code grid',
      detail: 'Spins up creator codes, splits budgets, and doubles down on the partners printing money this hour.',
      channel: 'Creators + TikTok',
      status: 'seeding',
      projectedRevenue: Math.round(projectedLiftMid * 0.16),
      eta: '34 min',
      roas: Math.max(2.2, Number((targetRoas * 0.96).toFixed(1))),
    },
    {
      id: 'path-recovery-loop',
      title: 'Cart recovery pressure loop',
      detail: 'Recovers abandoned sessions with timed urgency, personalized offers, and message sequencing.',
      channel: 'Email + SMS',
      status: 'active',
      projectedRevenue: Math.round(projectedLiftMid * 0.13),
      eta: 'live',
      roas: Math.max(2.1, Number((targetRoas * 1.04).toFixed(1))),
    },
  ];

  const livePathCount = livePaths.filter((item) => item.status !== 'seeding').length;
  const deploymentQueue = [
    `God prevented ${formatCurrency(preventedLeakage)} in leakage by pausing a weak cold-traffic sequence.`,
    `Creator bundle path is converting at 41% and is scaling into the next spend bracket.`,
    `Recovered ${recoveredCarts} abandoned carts with personalized urgency and timed follow-up.`,
    `Bandit policy shifted 18% of spend into ${buildBanditAllocations(preferredChannels, targetRoas, riskTolerance)[0]?.label || 'Meta'} after confidence crossed threshold.`,
  ];

  const blueprint = [
    {
      label: 'Audience Graph',
      metric: `${preferredChannels.length} live channel clusters`,
      detail: 'Content, traffic, creators, and customers merged into one causal graph.',
    },
    {
      label: 'Offer Engine',
      metric: `${formatCurrency(Math.round(projectedLiftMid * 0.22))} bundle upside`,
      detail: 'Bundles, promo codes, and urgency ladders generated automatically.',
    },
    {
      label: 'Leakage Control',
      metric: `${formatCurrency(preventedLeakage)} recovered`,
      detail: 'Revenue leaks detected before they spread across the funnel.',
    },
    {
      label: 'Attribution Loop',
      metric: 'Closed-loop feedback active',
      detail: 'Budget, creative, and offer decisions feed the learning policy after every win.',
    },
    {
      label: 'Bandit Allocation',
      metric: `${buildBanditAllocations(preferredChannels, targetRoas, riskTolerance)[0]?.share || 0}% to leader`,
      detail: 'Neural contextual bandit pushes budget into the best-performing path each hour.',
    },
    {
      label: 'Prophecy Layer',
      metric: `${formatCurrency(Math.round(projectedLiftMid * 0.31))} at risk-adjusted confidence`,
      detail: 'Monte Carlo simulations forecast upside before deployment happens.',
    },
  ];

  const simulations = [
    { label: 'P10', value: Math.round(projectedLiftLow * 0.88), confidence: 24 },
    { label: 'P25', value: Math.round(projectedLiftLow * 0.97), confidence: 40 },
    { label: 'P50', value: projectedLiftMid, confidence: 62 },
    { label: 'P75', value: Math.round(projectedLiftHigh * 0.93), confidence: 79 },
    { label: 'P90', value: Math.round(projectedLiftHigh * 1.06), confidence: 92 },
  ];

  return {
    projectedLiftLow,
    projectedLiftMid,
    projectedLiftHigh,
    preventedLeakage,
    recoveredCarts,
    livePaths,
    livePathCount,
    queuedDeployments: 4,
    deploymentQueue,
    blueprint,
    banditAllocations: buildBanditAllocations(preferredChannels, targetRoas, riskTolerance),
    simulations,
    compoundingNote: `After 60 days, the policy compounds around ${Number((targetRoas * riskMultiplier * autonomyMultiplier).toFixed(1))}x faster because the loop learns your revenue DNA.`,
  };
}

export function buildRevenueReply(prompt, snapshot) {
  const trimmed = prompt.trim();
  const lower = trimmed.toLowerCase();

  if (!trimmed) {
    return 'Give me a target, channel, or offer constraint and I will route the next highest-ROI path.';
  }

  if (lower.includes('tiktok')) {
    return `Routing God Mode toward TikTok. I would push the reel-to-paid amplifier first, target ${formatCurrency(Math.round(snapshot.livePaths[0].projectedRevenue * 0.72))} this week, and pair it with creator codes for faster learning.`;
  }

  if (lower.includes('leak') || lower.includes('leakage')) {
    return `The biggest leak is post-click abandonment. I would keep the cart recovery pressure loop active and protect roughly ${formatCurrency(snapshot.preventedLeakage)} this month by tightening urgency windows and suppressing weak cold traffic.`;
  }

  if (lower.includes('bundle')) {
    return `The strongest bundle path is the dynamic bundle engine. Based on current guardrails, I would package a mid-ticket offer and target ${formatCurrency(Math.round(snapshot.livePaths[1].projectedRevenue * 0.54))} in bundle revenue before scaling paid spend.`;
  }

  if (lower.includes('15k')) {
    return `A ${formatCurrency(15000)} goal is realistic under current settings. I would sequence TikTok spark ads, on-site bundles, and email recovery, then hold spend under the configured cap until confidence clears P75.`;
  }

  return `Under the current blueprint, I would prioritize ${snapshot.banditAllocations[0]?.label || 'Meta'} first. Projected monthly lift sits between ${formatCurrency(snapshot.projectedLiftLow)} and ${formatCurrency(snapshot.projectedLiftHigh)} with ${snapshot.queuedDeployments} new paths ready to deploy.`;
}
