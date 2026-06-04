import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  Camera,
  CheckCircle2,
  Clipboard,
  Download,
  Palette,
  Play,
  Radar,
  Send,
  Share2,
  Sparkles,
  Square,
} from 'lucide-react';

import GlassCard from '@/components/shared/GlassCard';
import PageWrapper from '@/components/shared/PageWrapper';
import PlatformIcon from '@/components/shared/PlatformIcon';
import StatusBadge from '@/components/shared/StatusBadge';
import { useApp } from '@/context/AppContext';
import { useTrendsData } from '@/data/trends';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  getCreatorAudience,
  getCreatorMediaPlatformOptions,
  getCreatorNicheLabel,
  tailorTrendsForCreator,
} from '@/lib/creatorProfile';

const GUIDED_STEPS = [
  { prompt: "Say this: I wasn't gonna post this but...", seconds: 4 },
  { prompt: "Now show what you're doing", seconds: 6 },
  { prompt: 'React and end it', seconds: 4 },
];

const POST_MEDIA_PLATFORMS = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram_reels', label: 'Instagram Reels' },
  { id: 'youtube_shorts', label: 'YouTube Shorts' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'x', label: 'X' },
  { id: 'pinterest', label: 'Pinterest' },
];

function radarPickFrom(trends) {
  return [...trends].sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0))[0] || null;
}

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

async function copyText(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  fallbackCopy(text);
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

function buildFallbackPlan(trend, creatorProfile) {
  const trendName = trend?.name || 'beginner posting confidence';
  const niche = getCreatorNicheLabel(creatorProfile);
  return {
    trendName,
    caption: [
      `I wasn't gonna post this, but ${trendName} is the easiest ${niche} angle to start with today.`,
      '',
      'Keep it simple. Show the real moment, say the first sentence, and post before you overthink it.',
      '',
      'follow for the next update',
    ].join('\n'),
    hashtags: ['#contentideas', '#socialmedia', '#creatortips'],
  };
}

export default function PostNow() {
  const { creatorProfile } = useApp();
  const { trends, status: trendsStatus, error: trendsError } = useTrendsData(true);
  const tailoredTrends = useMemo(
    () => tailorTrendsForCreator(trends, creatorProfile),
    [creatorProfile, trends],
  );
  const radarPick = useMemo(() => radarPickFrom(tailoredTrends), [tailoredTrends]);
  const defaultPlatform = useMemo(
    () => getCreatorMediaPlatformOptions(creatorProfile, POST_MEDIA_PLATFORMS)[0] || POST_MEDIA_PLATFORMS[0],
    [creatorProfile],
  );

  const [started, setStarted] = useState(false);
  const [plan, setPlan] = useState(null);
  const [planError, setPlanError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);
  const [postResult, setPostResult] = useState(null);

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

  const activePlan = plan || buildFallbackPlan(radarPick, creatorProfile);
  const captionPackage = [
    activePlan.caption,
    (activePlan.hashtags || []).join(' '),
  ].filter(Boolean).join('\n\n');
  const opportunityLabel = radarPick?.opportunityScore >= 70 ? 'Strong' : 'Good';
  const trendLabel = radarPick ? 'Going up' : trendsStatus === 'ready' ? 'Ready' : 'Checking';
  const trendDetail = radarPick ? radarPick.name : 'No live radar pick yet';
  const bestTimeLabel = 'Within 1 hour';

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      setBusy('plan');
      try {
        const data = await apiRequest('/api/media/plan', {
          method: 'POST',
          json: {
            type: 'video',
            trendId: radarPick?.id || '',
            customConcept: radarPick ? '' : 'beginner posting confidence',
            platform: defaultPlatform.id,
            style: 'ugc',
            audience: getCreatorAudience(creatorProfile),
            truthNote: 'Avoid guarantees, fake urgency, and unsupported performance claims.',
            callToAction: 'follow for the next update',
            duration: 8,
            resolution: '480p',
          },
        });
        if (!cancelled) {
          setPlan(data.plan);
          setPlanError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setPlan(buildFallbackPlan(radarPick, creatorProfile));
          setPlanError(loadError.message);
        }
      } finally {
        if (!cancelled) setBusy(null);
      }
    }

    loadPlan();
    return () => {
      cancelled = true;
    };
  }, [creatorProfile, defaultPlatform.id, radarPick]);

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
    const file = new File([recordingBlob], `owlgorithm-post-now.${extension}`, { type: recordingBlob.type });
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

  function clearTimers() {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }

  async function openCamera() {
    setRecorderError(null);
    setRecorderMessage(null);

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setRecorderError('Camera recording is not supported in this browser.');
      return null;
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
      return nextStream;
    } catch (cameraError) {
      setRecorderError(cameraError.message);
      return null;
    }
  }

  async function handleStart() {
    setStarted(true);
    setPostResult(null);
    await openCamera();
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
    let activeStream = streamRef.current;
    if (!activeStream) {
      activeStream = await openCamera();
      if (!activeStream) return;
    }

    const mimeType = supportedRecorderType();
    chunksRef.current = [];
    clearTimers();
    setRecorderError(null);
    setRecorderMessage(null);
    setRecordingBlob(null);
    setPostResult(null);
    if (recordingUrlRef.current) {
      URL.revokeObjectURL(recordingUrlRef.current);
      recordingUrlRef.current = null;
      setRecordingUrl(null);
    }

    try {
      const recorder = new MediaRecorder(activeStream, mimeType ? { mimeType } : undefined);
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
        setRecorderMessage('Auto clean complete. The guided clip is ready to post.');
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

  async function handleCopyCaption() {
    try {
      await copyText(captionPackage);
      setNotice('Caption and hashtags copied.');
    } catch (copyError) {
      setNotice(copyError.message);
    }
  }

  function downloadRecording() {
    if (!recordingBlob) return;
    const extension = recordingBlob.type.includes('mp4') ? 'mp4' : 'webm';
    downloadFile(`owlgorithm-post-now.${extension}`, recordingBlob.type, recordingBlob);
    setNotice('Recording downloaded.');
  }

  async function handlePostNow() {
    if (!recordingBlob) {
      setNotice('Record the guided clip first.');
      return;
    }

    const extension = recordingBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const file = new File([recordingBlob], `owlgorithm-post-now.${extension}`, { type: recordingBlob.type });

    try {
      await copyText(captionPackage);
      if (shareSupported) {
        await navigator.share({
          files: [file],
          title: activePlan.trendName || 'Owlgorithm post',
          text: captionPackage,
        });
        setPostResult('shared');
        setNotice('Post sheet opened. Caption is copied.');
        return;
      }

      downloadRecording();
      setPostResult('downloaded');
      setNotice('This browser cannot open the social share sheet. Caption copied and recording downloaded.');
    } catch (shareError) {
      if (shareError.name !== 'AbortError') {
        setNotice(shareError.message);
      }
    }
  }

  async function handleBestTime() {
    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 15 * 60 * 1000);
    const summary = `Post ${activePlan.trendName || 'Owlgorithm content'}`;
    const content = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Owlgorithm//Post Now//EN',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@owlgorithm`,
      `DTSTAMP:${icsDate(new Date())}`,
      `DTSTART:${icsDate(start)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${summary}`,
      'DESCRIPTION:Post Now best-time reminder. Caption is saved in Owlgorithm.',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    try {
      await copyText(captionPackage);
      downloadFile('owlgorithm-post-now-best-time.ics', 'text/calendar;charset=utf-8', content);
      setPostResult('scheduled');
      setNotice('Best-time reminder saved. Caption and hashtags copied.');
    } catch (bestTimeError) {
      setNotice(bestTimeError.message);
    }
  }

  return (
    <PageWrapper className="space-y-6">
      <GlassCard hover={false} accent="emerald" className="overflow-hidden">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={radarPick ? 'active' : trendsStatus} />
              <StatusBadge status={cameraOpen ? 'active' : 'idle'} />
              {recordingUrl ? <StatusBadge status="completed" /> : null}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">You're ready to post.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">
              Follow the prompts, record the short clip, and post without writing or guessing.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
            <button
              onClick={handleStart}
              disabled={cameraOpen}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-5 py-3 text-sm font-bold text-emerald-100 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Play size={17} />
              Start (I'll walk you through it)
            </button>
            <Link
              to="/media"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white no-underline transition-colors hover:bg-white/[0.07] hover:no-underline"
            >
              <Palette size={17} />
              Creator Studio Pro
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            { label: 'Opportunity Score', value: opportunityLabel, detail: radarPick ? `Score ${radarPick.opportunityScore || 0}` : 'Beginner-safe path' },
            { label: 'Trend', value: trendLabel, detail: trendDetail },
            { label: 'Best Time', value: bestTimeLabel, detail: 'Reminder uses the next hour' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500">{item.label}</p>
              <p className="mt-1 text-lg font-bold text-white">{item.value}</p>
              <p className="mt-1 truncate text-xs text-gray-500">{item.detail}</p>
            </div>
          ))}
        </div>

        {trendsError || planError || notice ? (
          <div className={cn(
            'mt-5 rounded-xl border px-4 py-3 text-sm leading-relaxed',
            trendsError || planError
              ? 'border-amber-500/20 bg-amber-500/10 text-amber-100'
              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
          )}>
            {notice || trendsError || planError}
          </div>
        ) : null}
      </GlassCard>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <GlassCard hover={false} accent="blue" className="min-w-0 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <Camera size={18} className="text-blue-300" />
                Guided Recording
              </h2>
              <p className="mt-1 text-sm text-gray-500">The app times each step and stops automatically.</p>
            </div>
            {recording ? <StatusBadge status="running" /> : recordingUrl ? <StatusBadge status="completed" /> : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(220px,0.45fr)]">
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-black/50">
              {cameraOpen ? (
                <div className="relative aspect-[9/16] max-h-[640px] w-full bg-black sm:aspect-video">
                  <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                  <div className="absolute inset-x-3 top-3 rounded-xl border border-white/10 bg-black/65 px-4 py-3 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-300">Step {stepIndex + 1} of {GUIDED_STEPS.length}</p>
                    <p className="mt-1 text-base font-bold text-white">{GUIDED_STEPS[stepIndex]?.prompt}</p>
                  </div>
                  {countdown ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-7xl font-black text-white">
                      {countdown}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex min-h-[340px] flex-col items-center justify-center px-5 py-10 text-center">
                  <Camera size={30} className="text-gray-500" />
                  <p className="mt-3 text-sm font-bold text-white">{started ? 'Camera permission needed' : 'Tap start to open camera'}</p>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
                    The recording stays local in the browser until you share or download it.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {GUIDED_STEPS.map((step, index) => (
                <div
                  key={step.prompt}
                  className={cn(
                    'rounded-xl border px-4 py-3',
                    index === stepIndex && cameraOpen
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-white/[0.08] bg-white/[0.03]',
                  )}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Step {index + 1}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{step.prompt}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <button
              onClick={startGuidedRecording}
              disabled={recording || countdown}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Play size={16} />
              Record
            </button>
            <button
              onClick={stopRecording}
              disabled={!recording}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Square size={16} />
              Stop
            </button>
            <button
              onClick={stopCamera}
              disabled={!cameraOpen}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Camera size={16} />
              Close
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
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <CheckCircle2 size={16} className="text-emerald-300" />
                Clean clip ready
              </div>
              <video controls playsInline src={recordingUrl} className="max-h-[520px] w-full rounded-xl border border-white/[0.08] bg-black" />
            </div>
          ) : null}
        </GlassCard>

        <div className="min-w-0 space-y-6">
          <GlassCard hover={false} accent="purple" className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                  <Sparkles size={18} className="text-purple-300" />
                  Filled For You
                </h2>
                <p className="mt-1 text-sm text-gray-500">Caption and hashtags are ready before the user types anything.</p>
              </div>
              {busy === 'plan' ? <StatusBadge status="loading" /> : <StatusBadge status="ready" />}
            </div>

            {radarPick ? (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <StatusBadge status={radarPick.saturation || 'active'} />
                  <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-xs font-semibold text-gray-300">
                    Opportunity {radarPick.opportunityScore || 0}
                  </span>
                </div>
                <p className="text-sm font-bold text-white">{radarPick.name}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(radarPick.platforms || []).slice(0, 5).map((platform) => (
                    <PlatformIcon key={platform} platform={platform} size={20} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <Radar size={16} className="text-gray-500" />
                  Radar pick pending
                </div>
                <p className="text-sm leading-relaxed text-gray-500">
                  The flow still works as a beginner confidence post until the live scraper returns a stronger trend.
                </p>
              </div>
            )}

            <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Caption</p>
              <pre className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-300">{captionPackage}</pre>
            </div>

            <button
              onClick={handleCopyCaption}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.07]"
            >
              <Clipboard size={16} />
              Copy caption
            </button>
          </GlassCard>

          <GlassCard hover={false} accent="emerald" className="space-y-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <Send size={18} className="text-emerald-300" />
                Post
              </h2>
              <p className="mt-1 text-sm text-gray-500">One action now, or a best-time reminder for later.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={handlePostNow}
                disabled={!recordingBlob}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-bold text-emerald-100 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Share2 size={16} />
                Post Now
              </button>
              <button
                onClick={handleBestTime}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.07]"
              >
                <CalendarClock size={16} />
                Post at Best Time
              </button>
            </div>

            {recordingBlob ? (
              <button
                onClick={downloadRecording}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.07]"
              >
                <Download size={16} />
                Download recording
              </button>
            ) : null}

            {postResult ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                You did it right. Posted at a good time, performance can be tracked from the connected channel, and Owlgorithm will prompt you again when it is time.
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-gray-500">
                On mobile, Post Now opens the native share sheet. On desktop browsers without file sharing, it copies the caption and downloads the clip.
              </p>
            )}
          </GlassCard>
        </div>
      </div>
    </PageWrapper>
  );
}
