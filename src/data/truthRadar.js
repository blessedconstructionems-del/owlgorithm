// Owlgorithm — Mock Truth Radar Data

export const claims = [
  {
    id: 1,
    claim: 'NASA confirms asteroid will pass dangerously close to Earth in April 2026',
    source: 'ScienceDaily',
    credibilityScore: 82,
    status: 'Verified',
    platforms: ['Twitter/X', 'Reddit', 'Facebook'],
    analysis:
      'NASA\'s Planetary Defense Coordination Office confirmed asteroid 2024 YR4 will pass within 0.002 AU of Earth on April 22, 2026. While the trajectory is close by astronomical standards, it poses no impact risk. The "dangerously close" framing is sensationalized but the core claim is factually accurate based on JPL orbital data.',
    date: '2026-03-28',
  },
  {
    id: 2,
    claim: 'New study proves coffee causes cancer in 90% of daily drinkers',
    source: 'HealthBuzz Blog',
    credibilityScore: 8,
    status: 'False',
    platforms: ['Facebook', 'TikTok', 'Instagram'],
    analysis:
      'This claim is entirely fabricated. No peer-reviewed study supports this assertion. The WHO\'s International Agency for Research on Cancer (IARC) removed coffee from the "possibly carcinogenic" list in 2016. Multiple meta-analyses show moderate coffee consumption is associated with reduced mortality. The source blog has no medical credentials.',
    date: '2026-03-30',
  },
  {
    id: 3,
    claim: 'Apple is acquiring OpenAI for $350 billion',
    source: 'TechRumors.io',
    credibilityScore: 15,
    status: 'False',
    platforms: ['Twitter/X', 'LinkedIn', 'Reddit'],
    analysis:
      'Neither Apple nor OpenAI have announced or confirmed any acquisition discussions. The source article cites unnamed "industry insiders" with no verifiable details. Apple\'s current AI strategy centers on on-device processing and existing partnerships. The rumored price would exceed Apple\'s largest-ever acquisition by over 100x.',
    date: '2026-03-29',
  },
  {
    id: 4,
    claim: 'EU bans all single-use plastics starting January 2027',
    source: 'EuroNews',
    credibilityScore: 64,
    status: 'Misleading',
    platforms: ['Twitter/X', 'Facebook', 'Instagram'],
    analysis:
      'The EU has expanded its Single-Use Plastics Directive, but it does not constitute a blanket ban on "all" single-use plastics. The new regulation targets specific categories including food packaging, beverage containers, and plastic bags, with exemptions for medical devices and essential packaging. The timeline is also phased, not a hard January 2027 cutoff.',
    date: '2026-03-27',
  },
  {
    id: 5,
    claim: 'SpaceX Starship completes first successful orbital flight with payload delivery',
    source: 'SpaceNews',
    credibilityScore: 95,
    status: 'Verified',
    platforms: ['Twitter/X', 'YouTube', 'Reddit'],
    analysis:
      'SpaceX confirmed Starship\'s IFT-7 mission achieved full orbital insertion and successfully deployed 10 Starlink V3 satellites. The mission was livestreamed with telemetry data publicly available. Multiple independent tracking stations confirmed orbital parameters. Both stages were recovered successfully.',
    date: '2026-03-31',
  },
  {
    id: 6,
    claim: 'Drinking lemon water on an empty stomach cures diabetes',
    source: 'NaturalCures365',
    credibilityScore: 3,
    status: 'False',
    platforms: ['Facebook', 'TikTok', 'Pinterest'],
    analysis:
      'There is no scientific evidence that lemon water cures diabetes. Type 1 diabetes is an autoimmune condition requiring insulin therapy, and Type 2 diabetes requires comprehensive medical management. While staying hydrated is beneficial, this claim is dangerous medical misinformation that could lead people to forgo proven treatments.',
    date: '2026-03-26',
  },
  {
    id: 7,
    claim: 'Global average temperature in 2025 was 1.6C above pre-industrial levels',
    source: 'World Meteorological Organization',
    credibilityScore: 97,
    status: 'Verified',
    platforms: ['Twitter/X', 'LinkedIn', 'Reddit'],
    analysis:
      'The WMO\'s annual State of the Global Climate report confirms the 2025 global mean temperature was 1.55-1.62C above pre-industrial baseline (1850-1900). This is corroborated by independent datasets from NASA GISS, NOAA, Copernicus/ECMWF, and the UK Met Office. The figure represents a new record high.',
    date: '2026-03-25',
  },
  {
    id: 8,
    claim: 'TikTok algorithm deliberately promotes self-harm content to teenagers',
    source: 'The Guardian',
    credibilityScore: 58,
    status: 'Unverified',
    platforms: ['Twitter/X', 'Reddit', 'YouTube'],
    analysis:
      'The Guardian\'s investigation found that new accounts listing age as 13-17 were served increasingly negative content within hours of engagement. However, the methodology has been questioned by independent researchers. TikTok disputes the findings, citing updated content moderation policies. Internal documents from ongoing litigation may clarify, but definitive proof of deliberate targeting remains unconfirmed.',
    date: '2026-03-24',
  },
  {
    id: 9,
    claim: 'Instagram is removing the ability to share Reels to Stories starting April 2026',
    source: '@socialmediaupdates (Instagram account)',
    credibilityScore: 22,
    status: 'Misleading',
    platforms: ['Instagram', 'TikTok', 'Twitter/X'],
    analysis:
      'Instagram confirmed it is testing a redesigned sharing flow in select markets, but the feature is not being removed. The test consolidates sharing options into a single menu rather than eliminating Story sharing. The original claim was posted by an unverified fan account and misinterpreted a screenshot from the limited beta. Meta\'s official communications team has denied any plans to remove the feature.',
    date: '2026-03-23',
  },
  {
    id: 10,
    claim: 'LinkedIn will start paying creators directly through a new Partner Program in Q2 2026',
    source: 'The Information',
    credibilityScore: 74,
    status: 'Unverified',
    platforms: ['LinkedIn', 'Twitter/X'],
    analysis:
      'The Information reported, citing two sources familiar with the matter, that LinkedIn is developing a creator monetization program set to launch mid-2026. LinkedIn has not officially confirmed the program but has made public statements about "investing in creator tools." The report aligns with LinkedIn\'s recent hiring of creator economy executives and expansion of newsletter features. Plausible but unconfirmed pending official announcement.',
    date: '2026-03-22',
  },
];

export default claims;
