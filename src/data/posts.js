// Owlgorithm — Mock Posts Data

function futureDate(daysFromNow, hours, minutes) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

function pastDate(daysAgo, hours, minutes) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export const posts = [
  {
    id: 'post-001',
    platform: 'TikTok',
    caption: '5 AI tools that replaced my entire marketing stack — here\'s the workflow that saves me 12 hours/week',
    scheduledAt: futureDate(0, 14, 30),
    status: 'Scheduled',
    connectedTrend: 'AI Tool Reviews & Tutorials',
    enchantments: { optimizeHashtags: true, addHook: true, emojiOptimization: false, trendAlignment: true },
    media: 'image',
  },
  {
    id: 'post-002',
    platform: 'Instagram',
    caption: 'The quiet luxury kitchen makeover that cost me $200 total (swipe for the before)\n\nEvery piece is from thrift stores and estate sales. No logos. No labels. Just clean lines and warm neutrals.\n\n#quietluxury #kitchenmakeover #thriftflip #interiordesign #homeaesthetic',
    scheduledAt: futureDate(0, 18, 0),
    status: 'Scheduled',
    connectedTrend: 'Quiet Luxury Aesthetic',
    enchantments: { optimizeHashtags: true, addHook: false, emojiOptimization: true, trendAlignment: true },
    media: 'image',
  },
  {
    id: 'post-003',
    platform: 'LinkedIn',
    caption: 'I got rejected from 47 jobs before landing my dream role.\n\nHere\'s what finally clicked (and it wasn\'t my resume):\n\n1. I stopped applying to job posts and started DMing hiring managers directly\n2. I led with results, not responsibilities\n3. I treated every rejection as market feedback\n4. I built in public — shared my journey on LinkedIn\n5. The company that hired me found ME through a post that went viral\n\nThe job market rewards people who are visible, not just qualified.',
    scheduledAt: futureDate(1, 9, 0),
    status: 'Scheduled',
    connectedTrend: 'Personal Branding on LinkedIn',
    enchantments: { optimizeHashtags: false, addHook: true, emojiOptimization: false, trendAlignment: true },
    media: null,
  },
  {
    id: 'post-004',
    platform: 'YouTube',
    caption: 'ASMR Study With Me — 2 Hour Deep Focus Session (no talking, keyboard sounds only)\n\nPerfect for studying, working, or just vibing. Hit like if you made it through the full session.\n\n#asmr #studywithme #deepfocus #productivity #studysession',
    scheduledAt: futureDate(1, 12, 0),
    status: 'Draft',
    connectedTrend: 'ASMR Productivity Content',
    enchantments: { optimizeHashtags: true, addHook: false, emojiOptimization: false, trendAlignment: true },
    media: 'image',
  },
  {
    id: 'post-005',
    platform: 'Twitter/X',
    caption: 'Hot take: the best marketing strategy in 2026 is having no strategy at all.\n\nLet me explain...\n\n(thread 1/8)',
    scheduledAt: futureDate(2, 10, 30),
    status: 'Scheduled',
    connectedTrend: 'Gen Z Workplace Humor',
    enchantments: { optimizeHashtags: false, addHook: true, emojiOptimization: false, trendAlignment: false },
    media: null,
  },
  {
    id: 'post-006',
    platform: 'TikTok',
    caption: 'POV: You finally try silent walking and your anxiety has left the chat\n\nDay 1: This is weird\nDay 7: Okay I notice more things\nDay 14: I can hear my own thoughts\nDay 30: I don\'t want my AirPods back\n\n#silentwalking #mentalhealth #anxiety #mindfulness #digitaldetox',
    scheduledAt: futureDate(2, 16, 0),
    status: 'Scheduled',
    connectedTrend: 'Silent Walking Movement',
    enchantments: { optimizeHashtags: true, addHook: true, emojiOptimization: true, trendAlignment: true },
    media: 'image',
  },
  {
    id: 'post-007',
    platform: 'Instagram',
    caption: 'Behind the scenes of our product launch — spoiler: nothing went according to plan\n\nThe printer broke. The samples arrived late. Our photographer got food poisoning.\n\nBut we launched anyway. And it was our biggest day ever.\n\nPerfection is the enemy of progress.\n\n#behindthescenes #smallbusiness #entrepreneurlife #productlaunch #keepgoing',
    scheduledAt: futureDate(3, 11, 0),
    status: 'Draft',
    connectedTrend: 'Behind-the-Scenes Brand Content',
    enchantments: { optimizeHashtags: true, addHook: true, emojiOptimization: false, trendAlignment: true },
    media: 'image',
  },
  {
    id: 'post-008',
    platform: 'Pinterest',
    caption: '30 sustainable kitchen swaps that save money AND look aesthetic\n\nBeeswax wraps, bamboo utensils, glass containers, and more. Pin for later!',
    scheduledAt: futureDate(3, 15, 0),
    status: 'Scheduled',
    connectedTrend: 'Sustainable Living Content',
    enchantments: { optimizeHashtags: true, addHook: false, emojiOptimization: false, trendAlignment: true },
    media: 'image',
  },
  {
    id: 'post-009',
    platform: 'TikTok',
    caption: 'This one exercise fixed my posture in 2 weeks (gym physio approved)\n\nWall angels. 3 sets of 10. Every morning.\n\nThat\'s it. That\'s the whole secret.\n\n#posture #fitness #exercise #gymtok #backpain',
    scheduledAt: pastDate(1, 14, 0),
    status: 'Published',
    connectedTrend: 'Fitness Snack Content',
    enchantments: { optimizeHashtags: true, addHook: true, emojiOptimization: false, trendAlignment: true },
    media: 'image',
  },
  {
    id: 'post-010',
    platform: 'Instagram',
    caption: 'My AI art process from start to finish — watch a portrait evolve in 60 seconds\n\nTools used: Midjourney v7 + Photoshop + Procreate\n\nThe AI does the heavy lifting. The artist does the soul.\n\n#aiart #digitalart #midjourney #creativeprocess #artprocess',
    scheduledAt: pastDate(2, 10, 0),
    status: 'Published',
    connectedTrend: '#AIArt Renaissance',
    enchantments: { optimizeHashtags: true, addHook: false, emojiOptimization: false, trendAlignment: true },
    media: 'image',
  },
  {
    id: 'post-011',
    platform: 'YouTube',
    caption: 'I tried every AI writing tool so you don\'t have to — honest review of the top 8\n\nClaude, ChatGPT, Jasper, Copy.ai, Writesonic, Sudowrite, Notion AI, and Lex.\n\nTimestamps in the description.',
    scheduledAt: pastDate(3, 12, 0),
    status: 'Published',
    connectedTrend: 'AI Tool Reviews & Tutorials',
    enchantments: { optimizeHashtags: true, addHook: true, emojiOptimization: false, trendAlignment: true },
    media: 'image',
  },
  {
    id: 'post-012',
    platform: 'LinkedIn',
    caption: 'The framework I use to turn one piece of content into 12 posts across platforms:\n\n1. Write one long-form article (LinkedIn or blog)\n2. Pull 3 key insights for Twitter/X threads\n3. Turn each insight into a carousel slide\n4. Record a 60-second explainer for TikTok/Reels\n5. Screenshot the best comments for Stories\n6. Create a Pinterest pin with the headline\n\nOne idea. Twelve touchpoints. Zero extra creative energy.\n\nSave this for your next content day.',
    scheduledAt: pastDate(4, 9, 30),
    status: 'Published',
    connectedTrend: 'LinkedIn Carousel Templates',
    enchantments: { optimizeHashtags: false, addHook: true, emojiOptimization: false, trendAlignment: true },
    media: 'image',
  },
  {
    id: 'post-013',
    platform: 'TikTok',
    caption: 'Day in my life as a 26-year-old mushroom farmer in Vermont\n\n5am: Check grow rooms\n7am: Harvest shiitakes\n9am: Farmer\'s market prep\n12pm: Restaurant deliveries\n3pm: Inoculate new logs\n\nI left finance for this. Best decision ever.\n\n#dayinmylife #mushroom #farming #careerchange #vermont',
    scheduledAt: futureDate(5, 17, 0),
    status: 'Draft',
    connectedTrend: 'Day in My Life Vlogs',
    enchantments: { optimizeHashtags: true, addHook: true, emojiOptimization: true, trendAlignment: true },
    media: 'image',
  },
  {
    id: 'post-014',
    platform: 'Instagram',
    caption: 'My $12 thrift store jacket vs the $3,200 version from The Row.\n\nSwipe to see which is which.\n\n(Most people guess wrong)\n\n#thrifthaul #quietluxury #fashionfinds #sustainablefashion #oldmoney',
    scheduledAt: futureDate(6, 12, 0),
    status: 'Scheduled',
    connectedTrend: 'Quiet Luxury Aesthetic',
    enchantments: { optimizeHashtags: true, addHook: true, emojiOptimization: false, trendAlignment: true },
    media: 'image',
  },
  {
    id: 'post-015',
    platform: 'YouTube',
    caption: 'Why does your brain feel foggy at 2pm? The neuroscience is wild. #shorts #science #productivity',
    scheduledAt: futureDate(7, 16, 0),
    status: 'Scheduled',
    connectedTrend: 'Educational Shorts Trend',
    enchantments: { optimizeHashtags: true, addHook: true, emojiOptimization: false, trendAlignment: true },
    media: 'image',
  },
  {
    id: 'post-016',
    platform: 'TikTok',
    caption: 'Replying to @jessicawrites — here\'s why that "10x your income" guru is lying to you\n\n(green screen receipts included)\n\n#financetok #scam #greenscreen #moneytok',
    scheduledAt: futureDate(8, 15, 30),
    status: 'Draft',
    connectedTrend: 'Green Screen Explainer Clips',
    enchantments: { optimizeHashtags: true, addHook: true, emojiOptimization: false, trendAlignment: true },
    media: null,
  },
];

export default posts;
