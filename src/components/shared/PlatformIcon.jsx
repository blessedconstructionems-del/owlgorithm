import { memo } from 'react';

const PLATFORM_COLORS = {
  tiktok:    '#00f2ea',
  instagram: '#E4405F',
  youtube:   '#FF0000',
  twitter:   '#1DA1F2',
  linkedin:  '#0077B5',
  facebook:  '#1877F2',
  reddit:    '#FF4500',
  pinterest: '#BD081C',
};

const PLATFORM_LABELS = {
  tiktok:    'TikTok',
  instagram: 'Instagram',
  youtube:   'YouTube',
  twitter:   'Twitter',
  linkedin:  'LinkedIn',
  facebook:  'Facebook',
  reddit:    'Reddit',
  pinterest: 'Pinterest',
};

const PlatformIcon = memo(function PlatformIcon({ platform, size = 24 }) {
  const key = platform?.toLowerCase() ?? '';
  const color = PLATFORM_COLORS[key] || '#6b7280';
  const label = PLATFORM_LABELS[key] || platform || '?';
  const initial = label.charAt(0).toUpperCase();
  const fontSize = Math.max(10, Math.round(size * 0.45));

  return (
    <div
      className="inline-flex items-center justify-center rounded-full shrink-0"
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
      <span className="font-bold text-white leading-none">{initial}</span>
    </div>
  );
});

export default PlatformIcon;
