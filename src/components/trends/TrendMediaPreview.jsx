import { Link } from 'react-router-dom';
import { ExternalLink, Image as ImageIcon, Newspaper, Play, Video, WandSparkles } from 'lucide-react';

import PlatformIcon from '@/components/shared/PlatformIcon';
import { cn } from '@/lib/utils';
import { getTrendMedia } from '@/lib/trendMedia';

const MODE_COPY = {
  video: {
    label: 'Playable source',
    icon: Video,
  },
  image: {
    label: 'Source image',
    icon: ImageIcon,
  },
  headline: {
    label: 'Headline card',
    icon: Newspaper,
  },
};

function MediaBadge({ media }) {
  const copy = MODE_COPY[media.kind] || MODE_COPY.headline;
  const Icon = copy.icon;

  return (
    <span className={cn('trend-media-badge', `trend-media-badge-${media.kind}`)}>
      <Icon size={13} />
      {copy.label}
    </span>
  );
}

function MediaMeta({ media }) {
  return (
    <div className="trend-media-meta">
      <span>
        <PlatformIcon platform={media.platform} size={16} />
        {media.platform}
      </span>
      {media.metricLabel ? <span>{media.metricLabel}</span> : null}
      {media.publisher ? <span>{media.publisher}</span> : null}
    </div>
  );
}

function SourceLink({ media, compact }) {
  if (!media.sourceUrl) return null;

  return (
    <a
      className={cn('trend-media-source-link', compact && 'trend-media-source-link-compact')}
      href={media.sourceUrl}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
    >
      Open source
      <ExternalLink size={14} />
    </a>
  );
}

function studioPlatformFor(media) {
  if (media.platformKey === 'youtube') return 'youtube_shorts';
  if (media.platformKey === 'instagram') return 'instagram_reels';
  if (media.platformKey === 'twitter') return 'x';
  if (media.platformKey === 'pinterest') return 'pinterest';
  if (media.platformKey === 'linkedin') return 'linkedin';
  return 'tiktok';
}

function creatorStudioPath(trend, media) {
  const params = new URLSearchParams({
    trend: trend.id,
    type: 'video',
    platform: studioPlatformFor(media),
    autoplan: '1',
  });

  if (media.imageUrl) params.set('sourceImageUrl', media.imageUrl);
  if (media.sourceUrl) params.set('sourceUrl', media.sourceUrl);

  return `/media?${params.toString()}`;
}

function CreatorStudioLink({ trend, media, compact }) {
  if (!trend?.id) return null;

  return (
    <Link
      className={cn('trend-media-source-link trend-media-studio-link', compact && 'trend-media-source-link-compact')}
      to={creatorStudioPath(trend, media)}
      onClick={(event) => event.stopPropagation()}
    >
      {compact ? 'Use for video' : 'Use elements for video'}
      <WandSparkles size={14} />
    </Link>
  );
}

export default function TrendMediaPreview({
  trend,
  eyebrow = 'Top Media Signal',
  compact = false,
  className,
}) {
  const media = getTrendMedia(trend);
  if (!media) return null;

  const displayTitle = trend?.name || media.title;

  return (
    <article className={cn('trend-media-preview', compact && 'trend-media-preview-compact', className)}>
      <div className="trend-media-frame">
        {media.kind === 'video' && media.videoUrl ? (
          <video
            controls
            playsInline
            preload="metadata"
            poster={media.imageUrl || undefined}
            src={media.videoUrl}
            className="trend-media-asset"
          />
        ) : null}

        {media.kind === 'video' && !media.videoUrl && media.embedUrl ? (
          <iframe
            title={`${displayTitle} source video`}
            src={media.embedUrl}
            className="trend-media-asset"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : null}

        {media.kind !== 'video' && media.imageUrl ? (
          <img
            src={media.imageUrl}
            alt={displayTitle}
            loading="lazy"
            className="trend-media-asset"
          />
        ) : null}

        {media.kind === 'headline' && !media.imageUrl ? (
          <div className="trend-media-headline-card" aria-label={`${displayTitle} headline card`}>
            <div className="trend-media-headline-orbit" aria-hidden="true" />
            <div>
              <span>{media.platform}</span>
              <strong>{displayTitle}</strong>
            </div>
          </div>
        ) : null}

        <div className="trend-media-overlay">
          <MediaBadge media={media} />
          {media.kind === 'video' ? (
            <span className="trend-media-play-indicator" aria-hidden="true">
              <Play size={14} fill="currentColor" />
            </span>
          ) : null}
        </div>
      </div>

      <div className="trend-media-copy">
        <div>
          <p className="trend-media-eyebrow">{eyebrow}</p>
          <h3>{displayTitle}</h3>
        </div>
        <MediaMeta media={media} />
        {media.description && !compact ? <p>{media.description}</p> : null}
        <div className="trend-media-actions">
          <CreatorStudioLink trend={trend} media={media} compact={compact} />
          <SourceLink media={media} compact={compact} />
        </div>
      </div>
    </article>
  );
}
