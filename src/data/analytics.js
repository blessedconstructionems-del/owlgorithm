// Owlgorithm — Mock Analytics Data

function generateDailyData() {
  const data = [];
  const now = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayOfWeek = d.getDay();
    const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1;
    const trendMultiplier = 1 + (90 - i) * 0.005;
    const noise = () => 0.8 + Math.random() * 0.4;

    data.push({
      date: d.toISOString().split('T')[0],
      reach: Math.round(4200 * weekendMultiplier * trendMultiplier * noise()),
      engagement: Math.round(380 * weekendMultiplier * trendMultiplier * noise()),
      impressions: Math.round(8500 * weekendMultiplier * trendMultiplier * noise()),
      followers: Math.round(12 * trendMultiplier * noise()),
      posts: Math.floor(Math.random() * 3) + 1,
    });
  }
  return data;
}

export const dailyData = generateDailyData();

export const platformData = [
  { platform: 'TikTok', reach: 128400, engagement: 14200, followers: 24800, avgEngagement: 6.8, color: '#00f2ea' },
  { platform: 'Instagram', reach: 96700, engagement: 8900, followers: 18200, avgEngagement: 4.2, color: '#E4405F' },
  { platform: 'YouTube', reach: 72300, engagement: 5600, followers: 12400, avgEngagement: 3.1, color: '#FF0000' },
  { platform: 'LinkedIn', reach: 34200, engagement: 3800, followers: 8600, avgEngagement: 5.7, color: '#0077B5' },
  { platform: 'Twitter/X', reach: 28900, engagement: 2100, followers: 6300, avgEngagement: 3.9, color: '#1DA1F2' },
  { platform: 'Pinterest', reach: 18600, engagement: 1400, followers: 4100, avgEngagement: 2.8, color: '#BD081C' },
  { platform: 'Reddit', reach: 12400, engagement: 1800, followers: 2800, avgEngagement: 7.2, color: '#FF4500' },
];

export const topPosts = [
  { id: 'tp-1', platform: 'TikTok', caption: '5 AI tools that replaced my entire marketing stack', reach: 284000, engagement: 32400, engagementRate: 11.4, trend: '#AIArt Renaissance', date: '2026-03-28' },
  { id: 'tp-2', platform: 'Instagram', caption: 'Quiet luxury home office — no logos, pure function', reach: 156000, engagement: 18700, engagementRate: 12.0, trend: 'Quiet Luxury Aesthetic', date: '2026-03-26' },
  { id: 'tp-3', platform: 'TikTok', caption: 'POV: Your therapist tells you to try silent walking', reach: 142000, engagement: 21300, engagementRate: 15.0, trend: 'Silent Walking', date: '2026-03-25' },
  { id: 'tp-4', platform: 'YouTube', caption: 'Full breakdown: How I built a $10k/mo AI business', reach: 98000, engagement: 8200, engagementRate: 8.4, trend: 'AI Tool Reviews', date: '2026-03-24' },
  { id: 'tp-5', platform: 'LinkedIn', caption: "I got rejected 47 times — here's the framework", reach: 87000, engagement: 9400, engagementRate: 10.8, trend: 'Personal Branding', date: '2026-03-23' },
  { id: 'tp-6', platform: 'TikTok', caption: 'This one exercise fixed my posture in 2 weeks', reach: 76000, engagement: 11200, engagementRate: 14.7, trend: 'Fitness Snacks', date: '2026-03-22' },
  { id: 'tp-7', platform: 'Instagram', caption: 'Behind the scenes of our candle making process', reach: 64000, engagement: 7800, engagementRate: 12.2, trend: 'BTS Brand Content', date: '2026-03-21' },
  { id: 'tp-8', platform: 'Twitter/X', caption: 'Thread: 500 viral tweets analyzed — 7 patterns', reach: 52000, engagement: 4300, engagementRate: 8.3, trend: 'Thread Storytelling', date: '2026-03-20' },
  { id: 'tp-9', platform: 'YouTube', caption: 'ASMR study session — 2 hours of deep focus', reach: 48000, engagement: 3600, engagementRate: 7.5, trend: 'ASMR Productivity', date: '2026-03-19' },
  { id: 'tp-10', platform: 'Instagram', caption: 'Micro-story: She quit her 6-figure job for pottery', reach: 43000, engagement: 6100, engagementRate: 14.2, trend: 'Micro-Storytelling', date: '2026-03-18' },
];

export const demographics = {
  ageGroups: [
    { range: '13-17', percentage: 8 },
    { range: '18-24', percentage: 32 },
    { range: '25-34', percentage: 38 },
    { range: '35-44', percentage: 14 },
    { range: '45-54', percentage: 5 },
    { range: '55+', percentage: 3 },
  ],
  countries: [
    { name: 'United States', percentage: 42 },
    { name: 'United Kingdom', percentage: 14 },
    { name: 'Canada', percentage: 9 },
    { name: 'Australia', percentage: 7 },
    { name: 'Germany', percentage: 5 },
    { name: 'India', percentage: 4 },
    { name: 'Brazil', percentage: 3 },
    { name: 'Other', percentage: 16 },
  ],
  gender: [
    { type: 'Female', percentage: 54 },
    { type: 'Male', percentage: 38 },
    { type: 'Other', percentage: 8 },
  ],
};

export const contentTypePerformance = [
  { type: 'Reels', avgReach: 18400, avgEngagement: 2100 },
  { type: 'Stories', avgReach: 6200, avgEngagement: 890 },
  { type: 'Posts', avgReach: 8900, avgEngagement: 720 },
  { type: 'Carousels', avgReach: 12600, avgEngagement: 1540 },
  { type: 'Shorts', avgReach: 22100, avgEngagement: 2800 },
];

// 7 rows (Mon-Sun) x 24 columns (hours 0-23), values 0-100
function generateHeatmapData() {
  const data = [];
  const peakHours = [9, 10, 11, 12, 13, 19, 20, 21];
  const goodHours = [8, 14, 15, 18, 22];
  const peakDays = [1, 2, 3]; // Tue, Wed, Thu

  for (let day = 0; day < 7; day++) {
    const row = [];
    for (let hour = 0; hour < 24; hour++) {
      let base = 10;
      if (peakHours.includes(hour)) base += 50;
      else if (goodHours.includes(hour)) base += 25;

      if (peakDays.includes(day)) base += 15;
      else if (day === 0 || day === 4) base += 5;

      base += Math.round((Math.random() - 0.5) * 16);
      row.push(Math.max(0, Math.min(100, base)));
    }
    data.push(row);
  }
  return data;
}

export const heatmapData = generateHeatmapData();
