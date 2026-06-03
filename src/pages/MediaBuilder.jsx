import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  Camera,
  CheckCircle2,
  Clipboard,
  Download,
  ExternalLink,
  Globe2,
  Image as ImageIcon,
  MessageCircle,
  Play,
  Radar,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
  Square,
  Video,
  WandSparkles,
} from 'lucide-react';

import GlassCard from '@/components/shared/GlassCard';
import PageWrapper from '@/components/shared/PageWrapper';
import StatusBadge from '@/components/shared/StatusBadge';
import PlatformIcon from '@/components/shared/PlatformIcon';
import { apiRequest } from '@/lib/api';
import { appRedirectUrl, openHostedSocialConnect } from '@/lib/nativeBridge';
import { cn } from '@/lib/utils';
import { useTrendsData } from '@/data/trends';

const DEFAULT_PLATFORMS = [
  { id: 'tiktok', label: 'TikTok', mobileLabel: 'TikTok', aspectRatio: '9:16', duration: 8 },
  { id: 'instagram_reels', label: 'Instagram Reels', mobileLabel: 'Reels', aspectRatio: '9:16', duration: 8 },
  { id: 'youtube_shorts', label: 'YouTube Shorts', mobileLabel: 'Shorts', aspectRatio: '9:16', duration: 8 },
  { id: 'instagram_feed', label: 'Instagram Feed', mobileLabel: 'Feed', aspectRatio: '1:1', duration: 6 },
  { id: 'linkedin', label: 'LinkedIn', mobileLabel: 'LinkedIn', aspectRatio: '4:3', duration: 6 },
  { id: 'x', label: 'X', mobileLabel: 'X', aspectRatio: '16:9', duration: 6 },
  { id: 'pinterest', label: 'Pinterest', mobileLabel: 'Pins', aspectRatio: '2:3', duration: 6 },
];

const DEFAULT_SOCIAL_PLATFORMS = [
  { id: 'tiktok', label: 'TikTok', supports: ['video', 'image'], defaultFor: ['video', 'image'], targetConfigured: true, connected: false },
  { id: 'instagram', label: 'Instagram', supports: ['video', 'image'], defaultFor: ['video', 'image'], targetConfigured: true, connected: false },
  { id: 'youtube', label: 'YouTube', supports: ['video'], defaultFor: ['video'], targetConfigured: true, connected: false },
  { id: 'linkedin', label: 'LinkedIn', supports: ['video', 'image', 'text'], defaultFor: ['video', 'image', 'text'], targetConfigured: true, connected: false },
  { id: 'facebook', label: 'Facebook', supports: ['video', 'image', 'text'], defaultFor: ['video', 'image', 'text'], targetConfigured: true, connected: false },
  { id: 'x', label: 'X', supports: ['video', 'image', 'text'], defaultFor: ['video', 'image', 'text'], targetConfigured: true, connected: false },
  { id: 'threads', label: 'Threads', supports: ['video', 'image', 'text'], defaultFor: ['video', 'image', 'text'], targetConfigured: true, connected: false },
  { id: 'pinterest', label: 'Pinterest', supports: ['video', 'image'], defaultFor: ['video', 'image'], targetConfigured: false, requiredTargetEnv: 'OWLGORITHM_SOCIAL_PINTEREST_BOARD_ID', connected: false },
  { id: 'reddit', label: 'Reddit', supports: ['video', 'image', 'text'], defaultFor: ['video', 'image', 'text'], targetConfigured: false, requiredTargetEnv: 'OWLGORITHM_SOCIAL_REDDIT_SUBREDDIT', connected: false },
  { id: 'bluesky', label: 'Bluesky', supports: ['video', 'image', 'text'], defaultFor: ['video', 'image', 'text'], targetConfigured: true, connected: false },
  { id: 'google_business', label: 'Google Business', supports: ['video', 'image', 'text'], defaultFor: ['video', 'image', 'text'], targetConfigured: true, connected: false },
];

const DEFAULT_STYLES = [
  { id: 'ugc', label: 'authentic phone-shot UGC, natural light, clear subject, creator-led' },
  { id: 'clean', label: 'clean editorial social creative, crisp contrast, strong visual hierarchy' },
  { id: 'cinematic', label: 'cinematic lighting, premium campaign look, atmospheric but readable' },
  { id: 'product', label: 'product-focused composition, practical demonstration, commerce-ready' },
  { id: 'explainer', label: 'simple explainer visual, clear sequence, beginner-friendly framing' },
];

const GUIDED_STEPS = [
  { prompt: "Say this: I wasn't gonna post this but...", seconds: 4 },
  { prompt: "Now show what you're doing", seconds: 6 },
  { prompt: 'React and end it', seconds: 4 },
];

const DEFAULT_FORM = {
  type: 'video',
  trendId: '',
  customConcept: '',
  platform: 'tiktok',
  style: 'ugc',
  audience: 'beginners who want practical, low-pressure social media ideas',
  truthNote: '',
  callToAction: 'follow for the next update',
  sourceImageUrl: '',
  duration: 8,
  resolution: '480p',
};

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!ok) throw new Error('Clipboard is not available in this browser.');
}

function downloadFile(filename, type, content) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function icsDate(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function supportedRecorderType() {
  if (typeof window === 'undefined' || !window.MediaRecorder) return '';
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  return candidates.find((type) => window.MediaRecorder.isTypeSupported(type)) || '';
}

function defaultSocialPlatformIds(platforms, assetType) {
  return platforms
    .filter((platform) => platform.defaultFor?.includes(assetType))
    .filter((platform) => !platform.requiredTargetEnv || platform.targetConfigured)
    .filter((platform) => platform.connected === true)
    .map((platform) => platform.id);
}

function accountLabel(account) {
  if (!account) return null;
  return account.displayName || account.username || account.pageName || account.pageId || 'Connected';
}

function radarPickFrom(trends) {
  return [...trends].sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0))[0] || null;
}

function Field({ label, children, hint }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-gray-300">{label}</span>
      {children}
      {hint ? <span className="block text-xs leading-relaxed text-gray-500">{hint}</span> : null}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-blue-500/40',
        props.className,
      )}
    />
  );
}

function SelectInput(props) {
  return (
    <select
      {...props}
      className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500/40"
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className={cn(
        'min-h-[96px] w-full resize-y rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-blue-500/40',
        props.className,
      )}
    />
  );
}

function ResultBlock({ title, text, onCopy }) {
  if (!text) return null;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">{title}</p>
        <button
          onClick={() => onCopy(text, title)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-gray-200 transition-colors hover:bg-white/[0.07]"
        >
          <Clipboard size={13} />
          Copy
        </button>
      </div>
      <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-300">{text}</pre>
    </div>
  );
}

export default function MediaBuilder() {
  const [searchParams] = useSearchParams();
  const { trends, status: trendsStatus, error: trendsError } = useTrendsData(true);

  const [form, setForm] = useState(DEFAULT_FORM);
  const [readiness, setReadiness] = useState(null);
  const [readinessError, setReadinessError] = useState(null);
  const [socialReadiness, setSocialReadiness] = useState(null);
  const [socialError, setSocialError] = useState(null);
  const [socialBusy, setSocialBusy] = useState(null);
  const [socialResult, setSocialResult] = useState(null);
  const [socialPlatforms, setSocialPlatforms] = useState([]);
  const [plan, setPlan] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);
  const [studioPrompt, setStudioPrompt] = useState('');
  const [studioLog, setStudioLog] = useState([
    {
      role: 'assistant',
      text: 'Tell me what you want to post, or use the radar pick. I will choose the format, platform, hook, caption, and recording path.',
    },
  ]);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [recordingUrl, setRecordingUrl] = useState(null);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [recorderMessage, setRecorderMessage] = useState(null);
  const [recorderError, setRecorderError] = useState(null);
  const [shareSupported, setShareSupported] = useState(false);

  const videoRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timersRef = useRef([]);
  const streamRef = useRef(null);
  const recordingUrlRef = useRef(null);

  const platformOptions = readiness?.platforms?.length ? readiness.platforms : DEFAULT_PLATFORMS;
  const styleOptions = readiness?.styles?.length ? readiness.styles : DEFAULT_STYLES;
  const selectedTrend = useMemo(
    () => trends.find((trend) => trend.id === form.trendId) || null,
    [form.trendId, trends],
  );
  const selectedPlatform = platformOptions.find((platform) => platform.id === form.platform) || platformOptions[0];
  const radarPick = useMemo(() => radarPickFrom(trends), [trends]);
  const conceptReady = Boolean(selectedTrend || form.customConcept.trim());
  const activePlan = result?.plan || plan;
  const asset = result?.asset || null;
  const socialContentType = asset?.type || form.type;
  const socialPlatformOptions = useMemo(
    () => (socialReadiness?.platforms?.length ? socialReadiness.platforms : DEFAULT_SOCIAL_PLATFORMS),
    [socialReadiness],
  );
  const supportedSocialPlatforms = useMemo(
    () => socialPlatformOptions.filter((platform) => platform.supports?.includes(socialContentType)),
    [socialContentType, socialPlatformOptions],
  );
  const selectedSocialPlatformDetails = useMemo(
    () => socialPlatformOptions.filter((platform) => socialPlatforms.includes(platform.id)),
    [socialPlatformOptions, socialPlatforms],
  );
  const missingSocialTargets = selectedSocialPlatformDetails.filter((platform) => (
    platform.requiredTargetEnv && !platform.targetConfigured
  ));
  const disconnectedSocialPlatforms = selectedSocialPlatformDetails.filter((platform) => platform.connected !== true);
  const socialPublishBlocked = Boolean(
    !socialReadiness?.configured
      || !asset?.url
      || !activePlan
      || !socialPlatforms.length
      || disconnectedSocialPlatforms.length
      || missingSocialTargets.length,
  );
  const socialStatusId = socialResult?.post?.requestId || socialResult?.post?.jobId || null;

  const refreshSocialAccounts = useCallback(async () => {
    const data = await apiRequest('/api/social/accounts');
    setSocialReadiness(data);
    setSocialError(null);
    setSocialPlatforms((current) => {
      const selectableIds = new Set(
        (data.platforms || [])
          .filter((platform) => platform.connected === true)
          .filter((platform) => !platform.requiredTargetEnv || platform.targetConfigured)
          .map((platform) => platform.id),
      );
      const filtered = current.filter((id) => selectableIds.has(id));
      if (filtered.length) return filtered;
      return defaultSocialPlatformIds(data.platforms || [], DEFAULT_FORM.type);
    });
    return data;
  }, []);

  useEffect(() => {
    const trendId = searchParams.get('trend');
    if (trendId) {
      setForm((current) => ({ ...current, trendId, customConcept: '' }));
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadReadiness() {
      try {
        const data = await apiRequest('/api/media/readiness');
        if (!cancelled) {
          setReadiness(data);
          setReadinessError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setReadinessError(loadError.message);
        }
      }

      try {
        await refreshSocialAccounts();
      } catch (loadError) {
        if (!cancelled) {
          setSocialError(loadError.message);
          setSocialPlatforms((current) => (
            current.length ? current : defaultSocialPlatformIds(DEFAULT_SOCIAL_PLATFORMS, DEFAULT_FORM.type)
          ));
        }
      }
    }

    loadReadiness();
    return () => {
      cancelled = true;
    };
  }, [refreshSocialAccounts]);

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        refreshSocialAccounts().catch((refreshError) => setSocialError(refreshError.message));
      }
    }
    function handleConnectComplete() {
      refreshSocialAccounts().catch((refreshError) => setSocialError(refreshError.message));
    }
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleConnectComplete);
    window.addEventListener('owlgorithm:social-connect-complete', handleConnectComplete);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleConnectComplete);
      window.removeEventListener('owlgorithm:social-connect-complete', handleConnectComplete);
    };
  }, [refreshSocialAccounts]);

  useEffect(() => {
    setSocialPlatforms((current) => {
      const supportedIds = supportedSocialPlatforms.map((platform) => platform.id);
      const filtered = current.filter((id) => {
        const platform = socialPlatformOptions.find((item) => item.id === id);
        return supportedIds.includes(id)
          && platform?.connected === true
          && (!platform?.requiredTargetEnv || platform.targetConfigured);
      });
      if (filtered.length) return filtered;
      return defaultSocialPlatformIds(socialPlatformOptions, socialContentType);
    });
  }, [socialContentType, socialPlatformOptions, supportedSocialPlatforms]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (!recordingBlob || typeof navigator === 'undefined' || typeof File === 'undefined') {
      setShareSupported(false);
      return;
    }

    const extension = recordingBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const file = new File([recordingBlob], `owlgorithm-recording.${extension}`, { type: recordingBlob.type });
    setShareSupported(Boolean(navigator.canShare?.({ files: [file] })));
  }, [recordingBlob]);

  useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (recordingUrlRef.current) {
      URL.revokeObjectURL(recordingUrlRef.current);
    }
  }, []);

  function updateForm(key, value) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === 'platform') {
        const platform = platformOptions.find((item) => item.id === value);
        if (platform) {
          next.duration = platform.duration;
        }
      }
      if (key === 'trendId' && value) {
        next.customConcept = '';
      }
      return next;
    });
    setNotice(null);
    setError(null);
  }

  function buildPayload(source = form) {
    return {
      ...source,
      trendId: source.trendId || undefined,
      customConcept: source.trendId ? '' : source.customConcept,
      duration: Number(source.duration),
    };
  }

  function inferPlatformFromIntent(intent, trend) {
    const lowered = intent.toLowerCase();
    if (lowered.includes('youtube') || lowered.includes('short')) return 'youtube_shorts';
    if (lowered.includes('instagram') || lowered.includes('reel')) return 'instagram_reels';
    if (lowered.includes('linkedin')) return 'linkedin';
    if (lowered.includes('pinterest') || lowered.includes('pin')) return 'pinterest';
    if (lowered.includes('twitter') || lowered.includes(' x ')) return 'x';

    const trendPlatforms = (trend?.platforms || []).map((platform) => `${platform}`.toLowerCase());
    if (trendPlatforms.some((platform) => platform.includes('youtube'))) return 'youtube_shorts';
    if (trendPlatforms.some((platform) => platform.includes('instagram'))) return 'instagram_reels';
    if (trendPlatforms.some((platform) => platform.includes('linkedin'))) return 'linkedin';
    if (trendPlatforms.some((platform) => platform.includes('pinterest'))) return 'pinterest';
    if (trendPlatforms.some((platform) => platform === 'x' || platform.includes('twitter'))) return 'x';
    return 'tiktok';
  }

  function studioFormFromIntent(intent, trend = radarPick) {
    const lowered = intent.toLowerCase();
    const nextPlatformId = inferPlatformFromIntent(intent, trend);
    const nextPlatform = platformOptions.find((platform) => platform.id === nextPlatformId) || platformOptions[0];
    const wantsImage = lowered.includes('image') || lowered.includes('photo') || lowered.includes('graphic') || lowered.includes('poster');
    const style = lowered.includes('product')
      ? 'product'
      : lowered.includes('cinematic')
        ? 'cinematic'
        : lowered.includes('explain') || lowered.includes('teach')
          ? 'explainer'
          : 'ugc';

    return {
      ...form,
      type: wantsImage ? 'image' : 'video',
      trendId: trend?.id || '',
      customConcept: trend?.id ? '' : intent.trim(),
      platform: nextPlatform?.id || 'tiktok',
      style,
      audience: lowered.includes('beginner')
        ? 'beginners who want practical, low-pressure social media ideas'
        : form.audience,
      duration: nextPlatform?.duration || form.duration,
      truthNote: form.truthNote || 'Avoid guarantees, fake urgency, and unsupported performance claims.',
    };
  }

  function captionWithHashtags() {
    const caption = activePlan?.caption || '';
    const hashtags = (activePlan?.hashtags || []).join(' ');
    return [caption, hashtags].filter(Boolean).join('\n\n');
  }

  function toggleSocialPlatform(platformId) {
    const platform = socialPlatformOptions.find((item) => item.id === platformId);
    if (!platform?.supports?.includes(socialContentType)) return;
    if (platform.connected !== true) return;
    if (platform.requiredTargetEnv && !platform.targetConfigured) return;

    setSocialPlatforms((current) => (
      current.includes(platformId)
        ? current.filter((id) => id !== platformId)
        : [...current, platformId]
    ));
    setSocialError(null);
    setSocialResult(null);
  }

  async function copyText(text, label) {
    setNotice(null);
    setError(null);

    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopy(text);
      }
      setNotice(`${label} copied.`);
    } catch (copyError) {
      setError(copyError.message);
    }
  }

  async function requestPlan(nextForm = form) {
    const ready = Boolean(nextForm.trendId || nextForm.customConcept.trim());
    if (!ready) {
      setError('Choose a live trend or enter a custom concept.');
      return;
    }

    setBusy('plan');
    setError(null);
    setNotice(null);

    try {
      const data = await apiRequest('/api/media/plan', {
        method: 'POST',
        json: buildPayload(nextForm),
      });
      setPlan(data.plan);
      setResult(null);
      setNotice('Media plan created from the backend.');
    } catch (planError) {
      setError(planError.message);
    } finally {
      setBusy(null);
    }
  }

  async function handlePlan() {
    await requestPlan(form);
  }

  async function handleStudioChat(event) {
    event.preventDefault();
    const intent = studioPrompt.trim();
    const trend = selectedTrend || radarPick;
    if (!intent && !trend) {
      setError('Tell the studio what to make, or wait for Trend Radar to load a radar pick.');
      return;
    }

    const userText = intent || `Use the radar pick: ${trend.name}`;
    const nextForm = studioFormFromIntent(userText, trend);
    setForm(nextForm);
    setStudioPrompt('');
    setStudioLog((current) => [
      ...current,
      { role: 'user', text: userText },
      {
        role: 'assistant',
        text: `${nextForm.type === 'image' ? 'Image' : 'Video'} plan coming up. I picked ${platformOptions.find((platform) => platform.id === nextForm.platform)?.label || 'TikTok'}, ${nextForm.style}, and a beginner-safe hook.`,
      },
    ]);
    await requestPlan(nextForm);
  }

  async function handleGenerate() {
    if (!conceptReady) {
      setError('Choose a live trend or enter a custom concept.');
      return;
    }

    if (!readiness?.configured) {
      setError('Media generation is disabled until the private media provider credentials are configured on the backend.');
      return;
    }

    setBusy('generate');
    setError(null);
    setNotice(null);

    try {
      const data = await apiRequest('/api/media/generate', {
        method: 'POST',
        json: buildPayload(),
      });
      setPlan(data.plan);
      setResult(data);
      setNotice(data.asset?.status === 'queued'
        ? 'Video request queued. Use Check video status until the media asset is ready.'
        : 'Media asset generated.');
    } catch (generateError) {
      setError(generateError.message);
    } finally {
      setBusy(null);
    }
  }

  async function handlePollVideo() {
    if (!asset?.requestId) return;

    setBusy('poll');
    setError(null);
    setNotice(null);

    try {
      const data = await apiRequest(`/api/media/video/${encodeURIComponent(asset.requestId)}`);
      const nextAsset = {
        ...asset,
        status: data.video?.status === 'done' ? 'complete' : data.video?.status || asset.status,
        url: data.video?.url || asset.url || null,
      };
      setResult((current) => ({ ...current, asset: nextAsset, video: data.video }));
      setNotice(nextAsset.url ? 'Video is ready.' : `Video status: ${nextAsset.status}.`);
    } catch (pollError) {
      setError(pollError.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleSocialPublish(schedule = false) {
    if (!socialReadiness?.configured) {
      setSocialError('Social publishing needs UPLOAD_POST_API_KEY on the backend.');
      return;
    }
    if (!asset?.url) {
      setSocialError('Generate an image or video before publishing.');
      return;
    }
    if (!socialPlatforms.length) {
      setSocialError('Choose at least one supported social platform.');
      return;
    }
    if (missingSocialTargets.length) {
      setSocialError(`Selected platforms need backend targets: ${missingSocialTargets.map((platform) => platform.requiredTargetEnv).join(', ')}.`);
      return;
    }
    if (disconnectedSocialPlatforms.length) {
      setSocialError(`Connect these accounts before publishing: ${disconnectedSocialPlatforms.map((platform) => platform.label).join(', ')}.`);
      return;
    }

    setSocialBusy(schedule ? 'schedule' : 'post');
    setSocialError(null);
    setSocialResult(null);

    try {
      const scheduledDate = schedule ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : undefined;
      const data = await apiRequest(schedule ? '/api/social/schedule' : '/api/social/post', {
        method: 'POST',
        json: {
          assetType: socialContentType,
          mediaUrl: asset.url,
          title: activePlan?.trendName || selectedTrend?.name || 'Owlgorithm post',
          caption: captionWithHashtags(),
          description: activePlan?.caption || captionWithHashtags(),
          platforms: socialPlatforms,
          scheduledDate,
        },
      });
      setSocialResult(data);
    } catch (publishError) {
      setSocialError(publishError.message);
    } finally {
      setSocialBusy(null);
    }
  }

  async function handleSocialConnect() {
    setSocialBusy('connect');
    setSocialError(null);
    setNotice(null);

    try {
      const session = await apiRequest('/api/social/connect', {
        method: 'POST',
        json: {
          redirectUrl: appRedirectUrl('/platforms?social=connected'),
        },
      });
      const opened = openHostedSocialConnect(session.accessUrl);
      setNotice(opened === 'native' ? 'Upload-Post connect opened in the secure iOS session.' : 'Upload-Post connect opened.');
    } catch (connectError) {
      setSocialError(connectError.message);
    } finally {
      setSocialBusy(null);
    }
  }

  async function handleSocialRefresh() {
    setSocialBusy('refresh');
    setSocialError(null);
    try {
      await refreshSocialAccounts();
      setNotice('Social account status refreshed.');
    } catch (refreshError) {
      setSocialError(refreshError.message);
    } finally {
      setSocialBusy(null);
    }
  }

  async function handleSocialStatus() {
    const statusId = socialResult?.post?.requestId || socialResult?.post?.jobId;
    if (!statusId) {
      setSocialError('No social request ID is available yet.');
      return;
    }

    setSocialBusy('status');
    setSocialError(null);

    try {
      const data = await apiRequest(`/api/social/status/${encodeURIComponent(statusId)}`);
      setSocialResult((current) => ({ ...current, status: data.status }));
    } catch (statusError) {
      setSocialError(statusError.message);
    } finally {
      setSocialBusy(null);
    }
  }

  function clearTimers() {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }

  async function startCamera() {
    setRecorderError(null);
    setRecorderMessage(null);

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setRecorderError('Camera recording is not supported in this browser.');
      return;
    }

    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1920 } },
      });
      streamRef.current = nextStream;
      setStream(nextStream);
      setCameraOpen(true);
      setStepIndex(0);
      setRecorderMessage('Camera is ready.');
    } catch (cameraError) {
      setRecorderError(cameraError.message);
    }
  }

  function stopRecording() {
    clearTimers();
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
    setCountdown(null);
  }

  function stopCamera() {
    stopRecording();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    setCameraOpen(false);
    setRecording(false);
    setCountdown(null);
    setRecorderMessage('Camera closed.');
  }

  async function runCountdown() {
    for (let seconds = 3; seconds > 0; seconds -= 1) {
      setCountdown(seconds);
      await new Promise((resolve) => {
        timersRef.current.push(window.setTimeout(resolve, 1000));
      });
    }
    setCountdown(null);
  }

  async function startGuidedRecording() {
    if (!streamRef.current) {
      await startCamera();
      return;
    }

    const mimeType = supportedRecorderType();
    chunksRef.current = [];
    clearTimers();
    setRecorderError(null);
    setRecorderMessage(null);
    setRecordingBlob(null);
    if (recordingUrlRef.current) {
      URL.revokeObjectURL(recordingUrlRef.current);
      recordingUrlRef.current = null;
      setRecordingUrl(null);
    }

    try {
      const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data?.size) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blobType = mimeType || chunksRef.current[0]?.type || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: blobType });
        const url = URL.createObjectURL(blob);
        recordingUrlRef.current = url;
        setRecordingBlob(blob);
        setRecordingUrl(url);
        setRecording(false);
        setCountdown(null);
        setRecorderMessage('Guided recording is ready.');
      };

      await runCountdown();
      setStepIndex(0);
      recorder.start();
      setRecording(true);
      setRecorderMessage('Recording guided steps.');

      let elapsed = 0;
      GUIDED_STEPS.slice(0, -1).forEach((step, index) => {
        elapsed += step.seconds;
        timersRef.current.push(window.setTimeout(() => {
          setStepIndex(index + 1);
        }, elapsed * 1000));
      });

      const total = GUIDED_STEPS.reduce((sum, step) => sum + step.seconds, 0);
      timersRef.current.push(window.setTimeout(stopRecording, total * 1000));
    } catch (recordError) {
      setRecording(false);
      setRecorderError(recordError.message);
    }
  }

  function handleDownloadRecording() {
    if (!recordingBlob) return;
    const extension = recordingBlob.type.includes('mp4') ? 'mp4' : 'webm';
    downloadFile(`owlgorithm-guided-recording.${extension}`, recordingBlob.type, recordingBlob);
    setRecorderMessage('Recording downloaded.');
  }

  async function handleShareRecording() {
    if (!recordingBlob || !shareSupported) return;
    const extension = recordingBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const file = new File([recordingBlob], `owlgorithm-recording.${extension}`, { type: recordingBlob.type });

    try {
      await navigator.share({
        files: [file],
        title: 'Owlgorithm guided recording',
        text: activePlan?.caption || 'Guided recording from Owlgorithm.',
      });
      setRecorderMessage('Recording shared.');
    } catch (shareError) {
      if (shareError.name !== 'AbortError') {
        setRecorderError(shareError.message);
      }
    }
  }

  function handleBestTimeReminder() {
    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 15 * 60 * 1000);
    const summary = `Post ${activePlan?.trendName || selectedTrend?.name || form.customConcept || 'Owlgorithm content'}`;
    const content = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Owlgorithm//Creator Studio//EN',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@owlgorithm`,
      `DTSTAMP:${icsDate(new Date())}`,
      `DTSTART:${icsDate(start)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${summary}`,
      'DESCRIPTION:Owlgorithm best-time posting reminder.',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    downloadFile('owlgorithm-best-time.ics', 'text/calendar;charset=utf-8', content);
    setNotice('Best-time reminder downloaded.');
  }

  return (
    <PageWrapper className="space-y-6">
      <GlassCard hover={false} accent="purple">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={readiness?.configured ? 'active' : 'disabled'} />
              <StatusBadge status={socialReadiness?.configured ? 'active' : 'disabled'} />
              <StatusBadge status={trendsStatus === 'ready' ? 'active' : trendsStatus} />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-purple-300">
                <WandSparkles size={21} />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">Creator Studio Pro</h1>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-400">
                  Advanced image and video generation for upgraded workspaces.
                </p>
              </div>
            </div>
          </div>

          <Link
            to="/post-now"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/[0.07]"
          >
            Open Post Now
            <ArrowRight size={15} />
          </Link>
        </div>

        {!readiness?.configured ? (
          <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-100">
            Image and video generation needs private media provider credentials on the backend. Planning, captioning, guided recording, and exports still work.
          </div>
        ) : null}
        {!socialReadiness?.configured ? (
          <div className="mt-3 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm leading-relaxed text-blue-100">
            Social publishing needs UPLOAD_POST_API_KEY on the backend before Post now and Post at best time are enabled.
          </div>
        ) : null}
        {readinessError || trendsError || error || socialError || notice ? (
          <div className={cn(
            'mt-5 rounded-xl border px-4 py-3 text-sm',
            readinessError || trendsError || error || socialError
              ? 'border-red-500/20 bg-red-500/10 text-red-100'
              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
          )}>
            {readinessError || trendsError || error || socialError || notice}
          </div>
        ) : null}
      </GlassCard>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <GlassCard hover={false} accent="blue" className="min-w-0 space-y-5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <MessageCircle size={18} className="text-blue-300" />
              Studio Chat
            </h2>
            <p className="mt-1 text-sm text-gray-500">Talk naturally. The radar, trend context, and truth guardrails fill the controls for you.</p>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={radarPick ? 'active' : 'idle'} />
              <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-xs font-semibold text-gray-300">
                {radarPick ? `Radar pick: ${radarPick.name}` : 'Waiting for radar pick'}
              </span>
            </div>

            <div className="max-h-[220px] space-y-3 overflow-y-auto pr-1">
              {studioLog.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn(
                    'rounded-xl px-3 py-2 text-sm leading-relaxed',
                    message.role === 'assistant'
                      ? 'border border-blue-500/20 bg-blue-500/10 text-blue-100'
                      : 'border border-white/[0.08] bg-black/25 text-gray-200',
                  )}
                >
                  {message.text}
                </div>
              ))}
            </div>

            <form onSubmit={handleStudioChat} className="mt-4 space-y-3">
              <TextArea
                value={studioPrompt}
                onChange={(event) => setStudioPrompt(event.target.value)}
                placeholder="Example: make a quick TikTok from the strongest trend and make it sound natural"
                className="min-h-[86px]"
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="submit"
                  disabled={busy === 'plan' || (!studioPrompt.trim() && !radarPick)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/15 px-4 py-2.5 text-sm font-semibold text-blue-100 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Sparkles size={16} />
                  {busy === 'plan' ? 'Thinking...' : 'Plan it'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (radarPick) {
                      setStudioPrompt(`Use the radar pick and make a natural short video for ${radarPick.name}`);
                    }
                  }}
                  disabled={!radarPick}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Radar size={16} />
                  Use radar pick
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!conceptReady || busy === 'generate' || !readiness?.configured}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/15 px-4 py-2.5 text-sm font-semibold text-purple-100 transition-colors hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <WandSparkles size={16} />
                  {busy === 'generate' ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </form>
          </div>

          <details className="rounded-xl border border-white/[0.08] bg-black/20 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-gray-200">Advanced controls</summary>
            <div className="mt-4 space-y-5">

          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'video', label: 'Video', icon: Video },
              { value: 'image', label: 'Image', icon: ImageIcon },
            ].map((item) => {
              const Icon = item.icon;
              const active = form.type === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => updateForm('type', item.value)}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors',
                    active ? 'border-blue-500/40 bg-blue-500/15 text-blue-100' : 'border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.06]',
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <Field label="Live trend">
            <SelectInput
              value={form.trendId}
              onChange={(event) => updateForm('trendId', event.target.value)}
            >
              <option value="" className="bg-gray-950">Use custom concept</option>
              {trends.map((trend) => (
                <option key={trend.id} value={trend.id} className="bg-gray-950">
                  {trend.name}
                </option>
              ))}
            </SelectInput>
          </Field>

          {!form.trendId ? (
            <Field label="Custom concept" hint="Use this only when the idea came from the user or a source outside the current trend cache.">
              <TextInput
                value={form.customConcept}
                onChange={(event) => updateForm('customConcept', event.target.value)}
                placeholder="Example: beginner posting confidence"
              />
            </Field>
          ) : null}

          {selectedTrend ? (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={selectedTrend.saturation || 'draft'} />
                <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-xs font-semibold text-gray-300">
                  Opportunity {selectedTrend.opportunityScore ?? 0}
                </span>
              </div>
              <p className="text-sm font-semibold text-white">{selectedTrend.name}</p>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-400">{selectedTrend.description || selectedTrend.aiInsight}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(selectedTrend.platforms || []).slice(0, 5).map((platform) => (
                  <PlatformIcon key={platform} platform={platform} size={20} />
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Platform">
              <SelectInput value={form.platform} onChange={(event) => updateForm('platform', event.target.value)}>
                {platformOptions.map((platform) => (
                  <option key={platform.id} value={platform.id} className="bg-gray-950">
                    {platform.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Style">
              <SelectInput value={form.style} onChange={(event) => updateForm('style', event.target.value)}>
                {styleOptions.map((style) => (
                  <option key={style.id} value={style.id} className="bg-gray-950">
                    {style.id}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Duration">
              <TextInput
                type="number"
                min="1"
                max="15"
                value={form.duration}
                onChange={(event) => updateForm('duration', event.target.value)}
              />
            </Field>
            <Field label="Resolution">
              <SelectInput value={form.resolution} onChange={(event) => updateForm('resolution', event.target.value)}>
                <option value="480p" className="bg-gray-950">480p</option>
                <option value="720p" className="bg-gray-950">720p</option>
              </SelectInput>
            </Field>
          </div>

          {form.type === 'video' ? (
            <Field label="Image-to-video source URL" hint="Optional. Must be a public http(s) image URL if used.">
              <TextInput
                value={form.sourceImageUrl}
                onChange={(event) => updateForm('sourceImageUrl', event.target.value)}
                placeholder="https://example.com/source-frame.jpg"
              />
            </Field>
          ) : null}

          <Field label="Audience">
            <TextInput
              value={form.audience}
              onChange={(event) => updateForm('audience', event.target.value)}
            />
          </Field>

          <Field label="Truth guardrail" hint="Use this for Truth Radar notes, verified constraints, or claims to avoid.">
            <TextArea
              value={form.truthNote}
              onChange={(event) => updateForm('truthNote', event.target.value)}
              placeholder="Example: Do not claim guaranteed income or platform-specific results."
            />
          </Field>

          <Field label="Call to action">
            <TextInput
              value={form.callToAction}
              onChange={(event) => updateForm('callToAction', event.target.value)}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={handlePlan}
              disabled={!conceptReady || busy === 'plan'}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles size={16} />
              {busy === 'plan' ? 'Planning...' : 'Build plan'}
            </button>
            <button
              onClick={handleGenerate}
              disabled={!conceptReady || busy === 'generate' || !readiness?.configured}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/15 px-4 py-2.5 text-sm font-semibold text-blue-100 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <WandSparkles size={16} />
              {busy === 'generate' ? 'Generating...' : `Generate ${form.type}`}
            </button>
          </div>
            </div>
          </details>
        </GlassCard>

        <div className="min-w-0 space-y-6">
          <GlassCard hover={false} accent="purple" className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Plan and Output</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedPlatform?.label || 'Selected platform'} output uses a {selectedPlatform?.aspectRatio || '9:16'} format.
                </p>
              </div>
              {activePlan ? <StatusBadge status={asset?.status === 'complete' ? 'published' : asset?.status || 'draft'} /> : null}
            </div>

            {!activePlan ? (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-8 text-center">
                <WandSparkles size={22} className="mx-auto text-gray-500" />
                <p className="mt-3 text-sm font-semibold text-white">No plan yet</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                  Build a plan first, then generate an image or video when backend media generation is configured.
                </p>
              </div>
            ) : (
              <>
                <ResultBlock title="Prompt" text={activePlan.prompt} onCopy={copyText} />
                <ResultBlock title="Caption" text={activePlan.caption} onCopy={copyText} />
                <ResultBlock title="Hashtags" text={(activePlan.hashtags || []).join(' ')} onCopy={copyText} />

                {asset ? (
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">Generated asset</p>
                        <p className="mt-1 text-xs text-gray-500">Created by the configured media engine.</p>
                      </div>
                      {asset.url ? (
                        <a
                          href={asset.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/[0.07]"
                        >
                          Open asset
                          <ArrowRight size={14} />
                        </a>
                      ) : asset.requestId ? (
                        <button
                          onClick={handlePollVideo}
                          disabled={busy === 'poll'}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <RefreshCw size={14} className={busy === 'poll' ? 'animate-spin' : ''} />
                          Check video status
                        </button>
                      ) : null}
                    </div>

                    {asset.url && asset.type === 'image' ? (
                      <img
                        src={asset.url}
                        alt={activePlan.trendName}
                        className="max-h-[520px] w-full rounded-xl border border-white/[0.08] object-contain"
                      />
                    ) : null}
                    {asset.url && asset.type === 'video' ? (
                      <video
                        controls
                        playsInline
                        src={asset.url}
                        className="max-h-[520px] w-full rounded-xl border border-white/[0.08] bg-black"
                      />
                    ) : null}
                    {!asset.url && asset.requestId ? (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        Request ID: <span className="font-mono">{asset.requestId}</span>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={handleBestTimeReminder}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.07]"
                  >
                    <CalendarClock size={16} />
                    Save best-time reminder
                  </button>
                  <Link
                    to="/trends"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.07]"
                  >
                    Return to Trend Radar
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </>
            )}
          </GlassCard>

          <GlassCard hover={false} accent="blue" className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <Globe2 size={18} className="text-blue-300" />
                  Post Everywhere
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Publish the generated {socialContentType} to every connected channel that supports it.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSocialConnect}
                  disabled={!socialReadiness?.configured || socialBusy === 'connect'}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/15 px-3 py-2 text-xs font-semibold text-blue-100 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ExternalLink size={14} />
                  {socialBusy === 'connect' ? 'Opening...' : 'Connect'}
                </button>
                <button
                  onClick={handleSocialRefresh}
                  disabled={socialBusy === 'refresh'}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw size={14} className={socialBusy === 'refresh' ? 'animate-spin' : ''} />
                  Refresh
                </button>
                <StatusBadge status={socialReadiness?.configured ? 'active' : 'disabled'} />
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
              <div className="mb-3 grid gap-2 sm:grid-cols-3">
                {[
                  { label: 'Opportunity', value: selectedTrend?.opportunityScore >= 70 ? 'Strong' : 'Good' },
                  { label: 'Trend', value: 'Going up' },
                  { label: 'Best time', value: 'Within 1 hour' },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-white/[0.08] bg-black/20 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-gray-500">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {socialPlatformOptions.map((platform) => {
                  const supported = platform.supports?.includes(socialContentType);
                  const targetReady = !platform.requiredTargetEnv || platform.targetConfigured;
                  const connected = platform.connected === true;
                  const checked = socialPlatforms.includes(platform.id);
                  const disabled = !supported || !targetReady || !connected;
                  return (
                    <button
                      key={platform.id}
                      onClick={() => toggleSocialPlatform(platform.id)}
                      disabled={disabled}
                      className={cn(
                        'flex min-h-[54px] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-colors',
                        checked
                          ? 'border-blue-500/40 bg-blue-500/15 text-blue-100'
                          : 'border-white/[0.08] bg-white/[0.03] text-gray-300 hover:bg-white/[0.06]',
                        disabled && 'cursor-not-allowed opacity-45 hover:bg-white/[0.03]',
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <PlatformIcon platform={platform.id === 'x' ? 'twitter' : platform.id} size={24} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{platform.label}</span>
                          <span className="mt-0.5 block truncate text-[11px] text-gray-500">
                            {!supported
                              ? `No ${socialContentType} support`
                              : !connected
                                ? 'Connect first'
                                : !targetReady
                                  ? `Needs ${platform.requiredTargetEnv}`
                                  : accountLabel(platform.account) || platform.supports.join(', ')}
                          </span>
                        </span>
                      </span>
                      <span className={cn(
                        'h-4 w-4 shrink-0 rounded-full border',
                        checked ? 'border-blue-300 bg-blue-400' : 'border-white/20',
                      )} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <button
                onClick={() => handleSocialPublish(false)}
                disabled={socialPublishBlocked || socialBusy === 'post'}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/15 px-4 py-2.5 text-sm font-semibold text-blue-100 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />
                {socialBusy === 'post' ? 'Posting...' : 'Post now'}
              </button>
              <button
                onClick={() => handleSocialPublish(true)}
                disabled={socialPublishBlocked || socialBusy === 'schedule'}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CalendarClock size={16} />
                {socialBusy === 'schedule' ? 'Scheduling...' : 'Post at best time'}
              </button>
              <button
                onClick={handleSocialStatus}
                disabled={!socialStatusId || socialBusy === 'status'}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={16} className={socialBusy === 'status' ? 'animate-spin' : ''} />
                Check status
              </button>
            </div>

            {!asset?.url ? (
              <p className="text-xs leading-relaxed text-gray-500">Generate an image or video before publishing.</p>
            ) : missingSocialTargets.length ? (
              <p className="text-xs leading-relaxed text-amber-200">
                Selected platforms need backend target settings: {missingSocialTargets.map((platform) => platform.requiredTargetEnv).join(', ')}.
              </p>
            ) : disconnectedSocialPlatforms.length ? (
              <p className="text-xs leading-relaxed text-amber-200">
                Connect these accounts before publishing: {disconnectedSocialPlatforms.map((platform) => platform.label).join(', ')}.
              </p>
            ) : socialReadiness?.configured && !socialPlatforms.length ? (
              <p className="text-xs leading-relaxed text-gray-500">No connected account currently supports {socialContentType} publishing.</p>
            ) : !socialReadiness?.configured ? (
              <p className="text-xs leading-relaxed text-gray-500">Publishing stays disabled until UPLOAD_POST_API_KEY is configured server-side.</p>
            ) : null}

            {socialResult?.post ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {socialResult.post.status === 'scheduled' ? 'Scheduled' : 'Submitted'} to {socialResult.post.platforms?.length || socialPlatforms.length} channel(s).
                {socialStatusId ? <span className="ml-1 font-mono text-xs">ID: {socialStatusId}</span> : null}
              </div>
            ) : null}

            {socialResult?.status ? (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-gray-300">
                Delivery status: <span className="font-semibold text-white">{socialResult.status.status}</span>
              </div>
            ) : null}
          </GlassCard>

          <GlassCard hover={false} accent="emerald" className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <Camera size={18} className="text-emerald-300" />
                  Guided Recording
                </h2>
                <p className="mt-1 text-sm text-gray-500">Record the beginner follow-along flow with real camera capture.</p>
              </div>
              {recording ? <StatusBadge status="running" /> : recordingUrl ? <StatusBadge status="completed" /> : null}
            </div>

            <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-black/40">
              {cameraOpen ? (
                <div className="relative aspect-[9/16] max-h-[560px] w-full bg-black sm:aspect-video">
                  <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                  <div className="absolute inset-x-3 top-3 rounded-xl border border-white/10 bg-black/60 px-4 py-3 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">Step {stepIndex + 1} of {GUIDED_STEPS.length}</p>
                    <p className="mt-1 text-base font-semibold text-white">{GUIDED_STEPS[stepIndex]?.prompt}</p>
                  </div>
                  {countdown ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-7xl font-bold text-white">
                      {countdown}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex min-h-[260px] flex-col items-center justify-center px-5 py-8 text-center">
                  <Camera size={28} className="text-gray-500" />
                  <p className="mt-3 text-sm font-semibold text-white">Camera is closed</p>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
                    Open camera to record the three prompt sequence locally in the browser.
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <button
                onClick={cameraOpen ? startGuidedRecording : startCamera}
                disabled={recording || countdown}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Play size={16} />
                {cameraOpen ? 'Start guided recording' : 'Open camera'}
              </button>
              <button
                onClick={stopRecording}
                disabled={!recording}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Square size={16} />
                Stop recording
              </button>
              <button
                onClick={stopCamera}
                disabled={!cameraOpen}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Camera size={16} />
                Close camera
              </button>
            </div>

            {recorderError || recorderMessage ? (
              <div className={cn(
                'rounded-xl border px-4 py-3 text-sm',
                recorderError ? 'border-red-500/20 bg-red-500/10 text-red-100' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
              )}>
                {recorderError || recorderMessage}
              </div>
            ) : null}

            {recordingUrl ? (
              <div className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <CheckCircle2 size={16} className="text-emerald-300" />
                  Recording ready
                </div>
                <video controls playsInline src={recordingUrl} className="max-h-[520px] w-full rounded-xl border border-white/[0.08] bg-black" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={handleDownloadRecording}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.07]"
                  >
                    <Download size={16} />
                    Download recording
                  </button>
                  <button
                    onClick={handleShareRecording}
                    disabled={!shareSupported}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Share2 size={16} />
                    Share recording
                  </button>
                </div>
                {!shareSupported ? (
                  <p className="text-xs text-gray-500">File sharing is unavailable in this browser, so use Download recording.</p>
                ) : null}
              </div>
            ) : null}
          </GlassCard>
        </div>
      </div>

      <GlassCard hover={false} accent="amber">
        <div className="flex gap-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-300" />
          <p className="text-sm leading-relaxed text-gray-400">
            Publishing is Upload-Post backed and stays disabled unless the backend has UPLOAD_POST_API_KEY, the user's Upload-Post profile exists, and the selected accounts are connected.
          </p>
        </div>
      </GlassCard>
    </PageWrapper>
  );
}
