const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const AB_TEST_STORAGE_KEY = 'owlgorithm:ab-tests';

const METRIC_LABELS = {
  engagement: 'Engagement Rate',
  clickRate: 'Click Rate',
  impressions: 'Impressions',
};

const METRIC_FIELD_BY_LABEL = {
  'Engagement Rate': 'engagement',
  'Click Rate': 'clickRate',
  Reach: 'impressions',
  Impressions: 'impressions',
};

const PRIMARY_METRIC_BY_TEST_TYPE = {
  Caption: 'clickRate',
  Hook: 'engagement',
  Hashtags: 'engagement',
  Thumbnail: 'clickRate',
  'Posting Time': 'engagement',
  Format: 'engagement',
};

function parseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function startOfDay(value) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function toIsoDate(value) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(value, days) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getMetricKey(test) {
  if (test.goalMetric && METRIC_LABELS[test.goalMetric]) {
    return test.goalMetric;
  }

  return (
    METRIC_FIELD_BY_LABEL[test.goalMetric] ||
    PRIMARY_METRIC_BY_TEST_TYPE[test.testType] ||
    'clickRate'
  );
}

function getVariantMetric(variant, metricKey) {
  return toNumber(variant?.[metricKey]);
}

function getLeadingVariant(aValue, bValue) {
  if (aValue === bValue) return null;
  return aValue > bValue ? 'A' : 'B';
}

function getLift(aValue, bValue) {
  const leader = Math.max(aValue, bValue);
  const lagging = Math.min(aValue, bValue);
  if (leader <= 0) return 0;
  const denominator = lagging > 0 ? lagging : leader;
  return ((leader - lagging) / denominator) * 100;
}

function daysBetween(start, end) {
  return Math.round((startOfDay(end) - startOfDay(start)) / MS_PER_DAY);
}

function formatShortDate(value) {
  const date = parseLocalDate(value);
  if (!date) return 'Unscheduled';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getTimelineProgress(test, now) {
  const start = parseLocalDate(test.startDate);
  const end = parseLocalDate(test.endDate);
  if (!start || !end) return 0;

  const totalDays = Math.max(1, daysBetween(start, end) + 1);
  const elapsedDays = clamp(daysBetween(start, now) + 1, 0, totalDays);
  return Math.round((elapsedDays / totalDays) * 100);
}

function getDaysRemaining(test, now) {
  const end = parseLocalDate(test.endDate);
  if (!end) return null;
  return Math.max(0, daysBetween(now, end));
}

function deriveStatus(test, now) {
  const status = typeof test.status === 'string' ? test.status.toLowerCase() : '';
  const start = parseLocalDate(test.startDate);
  const end = parseLocalDate(test.endDate);
  const confidence = toNumber(test.significance);
  const hasWinner = Boolean(test.winner);
  const hasTraffic =
    getVariantMetric(test.variantA, 'impressions') > 0 ||
    getVariantMetric(test.variantB, 'impressions') > 0;

  if (status === 'draft' && !start) return 'Draft';
  if (start && start > now) return 'Scheduled';
  if (!hasTraffic && !start) return 'Draft';

  if (end && now > end) {
    if (hasWinner || confidence >= 95) return 'Completed';
    return 'Review';
  }

  if (status === 'completed') return 'Completed';
  if (status === 'draft') return 'Draft';
  if (status === 'running' && (!start || start <= now)) return 'Running';
  if (!hasTraffic) return 'Scheduled';
  return 'Running';
}

function getHealthLabel(derivedStatus, confidence) {
  if (derivedStatus === 'Review') return 'Decision overdue';
  if (derivedStatus === 'Completed') return confidence >= 95 ? 'Winner locked' : 'Archived';
  if (derivedStatus === 'Draft') return 'Needs launch';
  if (derivedStatus === 'Scheduled') return 'Queued';
  if (confidence >= 95) return 'Decision ready';
  if (confidence >= 80) return 'Promising signal';
  return 'Learning';
}

function getRecommendation({ test, derivedStatus, confidence, leadingVariant, metricLabel, metricLift }) {
  const metricName = metricLabel.toLowerCase();
  const startLabel = formatShortDate(test.startDate);
  const endLabel = formatShortDate(test.endDate);

  if (derivedStatus === 'Review') {
    return {
      priority: 100,
      tone: 'amber',
      label: 'Needs Decision',
      title: 'End date passed without a winner',
      body: `${test.name} ended on ${endLabel}. ${leadingVariant ? `Variant ${leadingVariant} is ahead by ${metricLift}% on ${metricName}.` : `The result is still too close to call on ${metricName}.`} Close the loop before more traffic leaks into an expired experiment.`,
      action: 'Freeze traffic and make a decision',
    };
  }

  if (derivedStatus === 'Running' && leadingVariant && confidence >= 85) {
    return {
      priority: 90,
      tone: 'emerald',
      label: 'Scale Soon',
      title: `Variant ${leadingVariant} is pulling away`,
      body: `${test.name} is showing a ${metricLift}% lift on ${metricName} with ${confidence}% confidence. Keep the split balanced until it clears 95%, then ship the winner into future posts.`,
      action: 'Monitor to 95% confidence',
    };
  }

  if (derivedStatus === 'Running') {
    return {
      priority: 78,
      tone: 'blue',
      label: 'Keep Learning',
      title: 'Signal is still forming',
      body: `${test.name} is live, but the evidence is still noisy. Stay focused on ${metricName} and avoid calling it early.`,
      action: 'Let the test mature',
    };
  }

  if (derivedStatus === 'Scheduled') {
    return {
      priority: 68,
      tone: 'blue',
      label: 'Queued',
      title: 'Experiment is scheduled',
      body: `${test.name} is lined up to start on ${startLabel}. Make sure the audience split and creative slots are ready before launch.`,
      action: 'Confirm launch setup',
    };
  }

  if (derivedStatus === 'Draft') {
    return {
      priority: 72,
      tone: 'purple',
      label: 'Ready to Launch',
      title: 'Draft still has no traffic',
      body: `${test.name} has a solid hypothesis but no live data yet. Launch it and give it a full window before judging the result.`,
      action: 'Launch the draft',
    };
  }

  return {
    priority: 60,
    tone: 'emerald',
    label: 'Ship Winner',
    title: `Promote Variant ${test.winner || leadingVariant || 'A'}`,
    body: `${test.name} finished with a ${metricLift}% lift on ${metricName}. Roll the winning pattern into future posts and archive the losing creative.`,
    action: 'Apply the winner',
  };
}

export function getMetricLabel(metricKey) {
  return METRIC_LABELS[metricKey] || 'Click Rate';
}

export function loadAbTests(seed = []) {
  if (typeof window === 'undefined') return seed;

  try {
    const raw = window.localStorage.getItem(AB_TEST_STORAGE_KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : seed;
  } catch {
    return seed;
  }
}

export function persistAbTests(tests) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(AB_TEST_STORAGE_KEY, JSON.stringify(tests));
  } catch {
    // Storage unavailable, degrade gracefully.
  }
}

export function createAbTestRecord(
  { name, platform, testType, hypothesis, variantA, variantB, split, duration, metric },
  now = new Date()
) {
  const start = startOfDay(now);
  const end = addDays(start, Math.max(duration - 1, 0));

  return {
    id: `ab-${now.getTime()}`,
    name: name.trim() || `${testType} Experiment`,
    platform,
    status: 'Running',
    testType,
    goalMetric: metric,
    hypothesis: hypothesis.trim(),
    variantA: {
      content: variantA.trim(),
      impressions: 0,
      engagement: 0,
      clickRate: 0,
    },
    variantB: {
      content: variantB.trim(),
      impressions: 0,
      engagement: 0,
      clickRate: 0,
    },
    trafficSplit: split,
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
    winner: null,
    significance: 0,
    aiInsight: hypothesis.trim()
      ? `Hypothesis: ${hypothesis.trim()}`
      : 'Fresh launch. Watch the primary metric before declaring a winner.',
  };
}

export function buildAbTestModels(tests, now = new Date()) {
  const today = startOfDay(now);

  return tests
    .map((test) => {
      const primaryMetricKey = getMetricKey(test);
      const primaryMetricLabel = getMetricLabel(primaryMetricKey);
      const variantAValue = getVariantMetric(test.variantA, primaryMetricKey);
      const variantBValue = getVariantMetric(test.variantB, primaryMetricKey);
      const leadingVariant = getLeadingVariant(variantAValue, variantBValue);
      const metricLift = Number(getLift(variantAValue, variantBValue).toFixed(1));
      const confidence = toNumber(test.significance);
      const derivedStatus = deriveStatus(test, today);
      const winningVariant =
        test.winner || (derivedStatus === 'Completed' && leadingVariant ? leadingVariant : null);
      const estimatedImpact = Math.round(metricLift * 24 + confidence + (derivedStatus === 'Review' ? 80 : 0));

      const recommendation = getRecommendation({
        test,
        derivedStatus,
        confidence,
        leadingVariant,
        metricLabel: primaryMetricLabel,
        metricLift,
      });

      return {
        ...test,
        derivedStatus,
        primaryMetricKey,
        primaryMetricLabel,
        variantAValue,
        variantBValue,
        leadingVariant,
        winningVariant,
        metricLift,
        timelineProgress: getTimelineProgress(test, today),
        daysRemaining: getDaysRemaining(test, today),
        healthLabel: getHealthLabel(derivedStatus, confidence),
        recommendation,
        estimatedImpact,
        displayStartDate: formatShortDate(test.startDate),
        displayEndDate: formatShortDate(test.endDate),
      };
    })
    .sort((left, right) => {
      const priorityGap = right.recommendation.priority - left.recommendation.priority;
      if (priorityGap !== 0) return priorityGap;
      return (right.startDate || '').localeCompare(left.startDate || '');
    });
}

export function buildAbTestSummary(models) {
  const live = models.filter((model) => model.derivedStatus === 'Running').length;
  const review = models.filter((model) => model.derivedStatus === 'Review').length;
  const drafts = models.filter((model) => model.derivedStatus === 'Draft').length;
  const completed = models.filter((model) => model.derivedStatus === 'Completed');
  const averageWinnerLift =
    completed.length > 0
      ? Number(
          (
            completed.reduce((sum, model) => sum + model.metricLift, 0) /
            completed.length
          ).toFixed(1)
        )
      : 0;

  const projectedMonthlyImpact = models
    .filter(
      (model) =>
        model.derivedStatus === 'Review' ||
        model.derivedStatus === 'Completed' ||
        model.significance >= 80
    )
    .reduce((sum, model) => sum + model.estimatedImpact, 0);

  return {
    live,
    review,
    drafts,
    completed: completed.length,
    averageWinnerLift,
    projectedMonthlyImpact,
  };
}
