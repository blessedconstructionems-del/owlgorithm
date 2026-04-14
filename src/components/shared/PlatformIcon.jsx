import { memo } from 'react';

const PLATFORM_COLORS = {
  google: '#4285F4',
  tiktok: '#00f2ea',
  instagram: '#E4405F',
  youtube: '#FF0000',
  twitter: '#1DA1F2',
  linkedin: '#0077B5',
  facebook: '#1877F2',
  reddit: '#FF4500',
  pinterest: '#BD081C',
};

const PLATFORM_LABELS = {
  google: 'Google',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  twitter: 'Twitter/X',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  reddit: 'Reddit',
  pinterest: 'Pinterest',
};

const PLATFORM_ALIASES = {
  'twitter/x': 'twitter',
};

const PlatformIcon = memo(function PlatformIcon({ platform, size = 24 }) {
  const rawKey = platform?.toLowerCase() ?? '';
  const key = PLATFORM_ALIASES[rawKey] || rawKey;
  const color = PLATFORM_COLORS[key] || '#6b7280';
  const label = PLATFORM_LABELS[key] || platform || '?';
  const initial = label.charAt(0).toUpperCase();
  const fontSize = Math.max(10, Math.round(size * 0.45));

  return (
    <div
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize,
        lineHeight: 1,
      }}
      title={label}
      aria-label={label}
    >
      <span className="font-bold leading-none text-white">{initial}</span>
    </div>
  );
});

export default PlatformIcon;
