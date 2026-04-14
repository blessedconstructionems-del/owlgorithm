import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import TrendSignalChat from '@/components/shared/TrendSignalChat';
import { useApp } from '@/context/AppContext';

const GRADIENT_MAP = {
  'gradient:aurora': 'linear-gradient(135deg, #081018 0%, #10283c 50%, #123652 100%)',
  'gradient:nebula': 'linear-gradient(135deg, #170729 0%, #231349 50%, #0f1128 100%)',
  'gradient:midnight': 'linear-gradient(135deg, #060910 0%, #101a2f 50%, #060910 100%)',
  'gradient:ember': 'linear-gradient(135deg, #1b0c0f 0%, #32161c 50%, #18080a 100%)',
};

export default function AppLayout() {
  const { environment } = useApp();
  const isVideo = environment?.endsWith('.mp4') || environment?.endsWith('.webm');
  const isGradient = environment?.startsWith('gradient:');
  const gradientStyle = isGradient ? GRADIENT_MAP[environment] || GRADIENT_MAP['gradient:aurora'] : null;
  const videoSrc = isVideo ? `${import.meta.env.BASE_URL}${environment.replace(/^\/+/, '')}` : null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#060910] text-gray-200">
      {isVideo ? (
        <video
          key={environment}
          autoPlay
          loop
          muted
          playsInline
          className="fixed inset-0 z-0 h-full w-full object-cover"
          src={videoSrc}
        />
      ) : (
        <div
          className="fixed inset-0 z-0"
          style={{ background: gradientStyle || GRADIENT_MAP['gradient:aurora'] }}
        />
      )}
      <div className={`fixed inset-0 z-0 ${isVideo ? 'bg-[#060910]/70 backdrop-blur-[2px]' : 'bg-[#060910]/35'}`} />

      <Sidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-24 md:pb-6">
          <div className="mx-auto max-w-[1400px] px-3 py-4 sm:px-8 sm:py-6 lg:px-10">
            <Outlet />
          </div>
        </main>
      </div>
      <TrendSignalChat />
    </div>
  );
}
