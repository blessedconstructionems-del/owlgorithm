// Owlgorithm — Mock Night Watch Reports (7 Days)

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export const nightWatchReports = [
  {
    date: daysAgo(0),
    emergingTrends: [
      { name: 'AI Cooking Assistants', momentum: 28, platform: 'TikTok' },
      { name: '#OfficeASMR', momentum: 22, platform: 'YouTube' },
      { name: 'Micro-Journaling Reels', momentum: 19, platform: 'Instagram' },
    ],
    viralTrends: [
      { name: 'AI Tool Reviews & Tutorials', momentum: 93, platform: 'YouTube' },
      { name: '#AIArt Renaissance', momentum: 89, platform: 'TikTok' },
      { name: 'Educational Shorts Trend', momentum: 88, platform: 'YouTube' },
    ],
    decliningTrends: [
      { name: 'Faceless Motivation Channels', recommendation: 'Pivot to educational content or add personal storytelling. Algorithm is actively deprioritizing this format.' },
      { name: 'Generic Unboxing Videos', recommendation: 'Shift to "honest review" or "expectation vs reality" framing. Pure unboxing fatigue is setting in.' },
    ],
    opportunities: [
      { title: 'Silent Walking + Lo-fi Audio mashup', description: 'Combine the silent walking trend with lo-fi productivity audio for a unique wellness content angle. No one is doing this yet.', actionLabel: 'Create Content' },
      { title: 'LinkedIn carousel on AI tools', description: 'AI tool content is peaking on video platforms but underdeveloped on LinkedIn. Carousel format + AI tips = high opportunity.', actionLabel: 'Draft Carousel' },
      { title: 'Cross-post Reddit AMA to TikTok', description: 'Your upcoming AMA could generate 5+ viral clips if you record your answers as short-form video.', actionLabel: 'Plan AMA' },
    ],
  },
  {
    date: daysAgo(1),
    emergingTrends: [
      { name: 'Sleep Optimization Content', momentum: 31, platform: 'TikTok' },
      { name: 'Minimalist Desk Setups', momentum: 26, platform: 'YouTube' },
      { name: '#PlantParent Revival', momentum: 18, platform: 'Instagram' },
    ],
    viralTrends: [
      { name: 'Gen Z Workplace Humor', momentum: 84, platform: 'TikTok' },
      { name: 'LinkedIn Carousel Templates', momentum: 82, platform: 'LinkedIn' },
      { name: 'Podcast Clips Strategy', momentum: 79, platform: 'YouTube' },
    ],
    decliningTrends: [
      { name: 'NFT Art Showcases', recommendation: 'NFT interest has dropped 78% from peak. Avoid unless you can tie it to a broader digital art narrative.' },
      { name: 'Crypto Trading Tutorials', recommendation: 'Audience fatigue is high. Only pursue if you have verifiable results and a regulatory-compliant approach.' },
    ],
    opportunities: [
      { title: 'Workplace humor on LinkedIn', description: 'Gen Z workplace humor is dominating TikTok but barely present on LinkedIn. Early mover opportunity with high engagement potential.', actionLabel: 'Draft Post' },
      { title: 'Sleep science educational short', description: 'Sleep content is emerging fast. A neuroscience explainer on sleep cycles could ride both the education and wellness waves.', actionLabel: 'Create Script' },
    ],
  },
  {
    date: daysAgo(2),
    emergingTrends: [
      { name: 'Side Hustle Transparency', momentum: 34, platform: 'TikTok' },
      { name: 'Digital Nomad Budget Breakdowns', momentum: 24, platform: 'YouTube' },
      { name: '#MealPrepMonday', momentum: 21, platform: 'Instagram' },
    ],
    viralTrends: [
      { name: 'AI Tool Reviews & Tutorials', momentum: 91, platform: 'TikTok' },
      { name: 'Behind-the-Scenes Brand Content', momentum: 74, platform: 'Instagram' },
      { name: 'Personal Branding on LinkedIn', momentum: 77, platform: 'LinkedIn' },
    ],
    decliningTrends: [
      { name: 'Dance Challenge Duets', recommendation: 'Format fatigue has set in. Only participate if the audio is massively viral AND you can add a unique twist.' },
      { name: 'Clickbait Storytime', recommendation: 'Platforms are throttling exaggerated storytime content. Switch to authentic micro-storytelling for better reach.' },
    ],
    opportunities: [
      { title: 'Side hustle income breakdown', description: 'Transparency content about real income numbers is surging. Share an honest monthly breakdown for high engagement.', actionLabel: 'Create Content' },
      { title: 'BTS content series', description: 'Your behind-the-scenes posts consistently outperform polished content by 2x. Consider making this a weekly series.', actionLabel: 'Plan Series' },
    ],
  },
  {
    date: daysAgo(3),
    emergingTrends: [
      { name: 'Dopamine Menu Planning', momentum: 27, platform: 'TikTok' },
      { name: 'AI-Assisted Music Production', momentum: 20, platform: 'YouTube' },
      { name: 'Book Aesthetic Flat Lays', momentum: 17, platform: 'Pinterest' },
    ],
    viralTrends: [
      { name: 'Quiet Luxury Aesthetic', momentum: 71, platform: 'Instagram' },
      { name: 'Fitness Snack Content', momentum: 72, platform: 'TikTok' },
      { name: 'Micro-Storytelling Reels', momentum: 73, platform: 'Instagram' },
    ],
    decliningTrends: [
      { name: 'Get Ready With Me (standard)', recommendation: 'GRWM is oversaturated in its basic form. Only works now with a storytelling hook or niche angle (e.g., "GRWM for a job interview I\'m terrified of").' },
      { name: 'Aesthetic Room Tours', recommendation: 'Room tour engagement is down 35%. Pivot to "room transformation" or "before/after" format for renewed interest.' },
    ],
    opportunities: [
      { title: 'Dopamine menu content', description: 'The dopamine menu concept is brand new and resonates with the wellness audience. Create an explainer to be a first mover.', actionLabel: 'Research Topic' },
      { title: 'Fitness snack carousel', description: 'Single-exercise content is booming. A carousel of "5 exercises you can do at your desk" would perform well on Instagram.', actionLabel: 'Design Carousel' },
    ],
  },
  {
    date: daysAgo(4),
    emergingTrends: [
      { name: 'Slow Morning Routines', momentum: 32, platform: 'YouTube' },
      { name: '#GroceryHaul Budget Edition', momentum: 25, platform: 'TikTok' },
      { name: 'Pet Content x Productivity', momentum: 15, platform: 'Instagram' },
    ],
    viralTrends: [
      { name: 'AI Voice & Avatar Content', momentum: 48, platform: 'TikTok' },
      { name: 'Thread-Style Storytelling', momentum: 56, platform: 'Twitter/X' },
      { name: 'Newsletter Growth on Social', momentum: 60, platform: 'LinkedIn' },
    ],
    decliningTrends: [
      { name: 'TikTok Shop Hauls', recommendation: 'TikTok Shop content is seeing diminishing returns as audiences grow skeptical of paid promotions. Disclose clearly or avoid.' },
      { name: 'Hot Take Reaction Videos', recommendation: 'Engagement is down as audiences tire of outrage-bait. Pivot to constructive commentary or expert analysis.' },
    ],
    opportunities: [
      { title: 'Newsletter growth thread', description: 'Share your newsletter growth story as a Twitter/X thread. The newsletter trend is emerging and your real numbers make compelling content.', actionLabel: 'Write Thread' },
      { title: 'Budget grocery haul TikTok', description: 'Budget content is surging with inflation concerns. A "$50 week of meals" video could reach a massive audience.', actionLabel: 'Plan Video' },
    ],
  },
  {
    date: daysAgo(5),
    emergingTrends: [
      { name: 'Analog Productivity Tools', momentum: 29, platform: 'Instagram' },
      { name: '#CoffeeShopWorking', momentum: 23, platform: 'TikTok' },
      { name: 'Couples Finance Content', momentum: 16, platform: 'YouTube' },
    ],
    viralTrends: [
      { name: 'POV Storytelling Format', momentum: 76, platform: 'TikTok' },
      { name: 'Sustainable Living Content', momentum: 58, platform: 'Instagram' },
      { name: 'Lo-fi Productivity Audio', momentum: 67, platform: 'YouTube' },
    ],
    decliningTrends: [
      { name: 'Hustle Culture Glorification', recommendation: 'The backlash against hustle culture is strong. Content celebrating overwork is being actively criticized. Pivot to work-life balance messaging.' },
      { name: 'Viral Prank Content', recommendation: 'Platform policies are increasingly penalizing prank content. Risk-reward ratio is poor. Focus on positive engagement formats.' },
    ],
    opportunities: [
      { title: 'Analog vs digital productivity', description: 'There\'s growing interest in paper planners and analog tools as a counter to screen fatigue. Compare analog vs digital productivity in a reel.', actionLabel: 'Script Video' },
      { title: 'Lo-fi study stream', description: 'Lo-fi audio content has high watch time. Consider a Sunday evening live study stream to build community and recurring viewership.', actionLabel: 'Schedule Stream' },
    ],
  },
  {
    date: daysAgo(6),
    emergingTrends: [
      { name: 'AI Fashion Styling', momentum: 22, platform: 'Instagram' },
      { name: 'Sourdough Renaissance 2.0', momentum: 19, platform: 'TikTok' },
      { name: '#RemoteWorkSetup', momentum: 30, platform: 'LinkedIn' },
    ],
    viralTrends: [
      { name: '#BookTok Recommendations', momentum: 68, platform: 'TikTok' },
      { name: 'Duet/Stitch Commentary', momentum: 70, platform: 'TikTok' },
      { name: 'Nostalgia Marketing (90s/2000s)', momentum: 65, platform: 'TikTok' },
    ],
    decliningTrends: [
      { name: 'Minimalist Extreme Decluttering', recommendation: 'Extreme minimalism content peaked. Audiences now prefer "practical minimalism" — decluttering that feels achievable, not austere.' },
      { name: 'Dropshipping Tutorials', recommendation: 'Dropshipping content credibility is at an all-time low. Audience trust has eroded due to scam associations.' },
    ],
    opportunities: [
      { title: '90s/2000s nostalgia reel', description: 'Nostalgia content is trending and your audience skews 25-34 — the perfect demo. Create a "things only 90s kids understand" reel.', actionLabel: 'Create Reel' },
      { title: 'Expert stitch on trending claim', description: 'A viral finance claim is circulating that you could debunk with data. Stitch format + green screen = high engagement.', actionLabel: 'Record Stitch' },
      { title: 'BookTok recommendation post', description: 'Share your top business book with a cinematic book reveal. BookTok is mature but business books are underrepresented.', actionLabel: 'Film Review' },
    ],
  },
];

export default nightWatchReports;
