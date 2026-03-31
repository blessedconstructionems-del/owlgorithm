import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import TrendSignalChat from '@/components/shared/TrendSignalChat';
import { useApp } from '@/context/AppContext';

const GRADIENT_MAP = {
  'gradient:aurora': 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
  'gradient:nebula': 'linear-gradient(135deg, #1a0533 0%, #2d1b69 50%, #1a0533 100%)',
  'gradient:midnight': 'linear-gradient(135deg, #0c1220 0%, #1c2940 50%, #0c1220 100%)',
  'gradient:ember': 'linear-gradient(135deg, #1a0a0a 0%, #3d1515 50%, #1a0a0a 100%)',
};

export default function AppLayout() {
  const { environment } = useApp();

  const isVideo = environment?.endsWith('.mp4') || environment?.endsWith('.webm');
  const isGradient = environment?.startsWith('gradient:');
  const gradientStyle = isGradient ? GRADIENT_MAP[environment] : null;
  const base = import.meta.env.BASE_URL;
  const videoSrc = isVideo ? `${base}${environment.replace(/^\//, '')}` : null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#060910] text-gray-200">
      {/* Video/Image/Gradient Environment Background */}
      {environment && (
        <>
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
          ) : isGradient ? (
            <div
              className="fixed inset-0 z-0"
              style={{ background: gradientStyle }}
            />
          ) : (
            <div
              className="fixed inset-0 z-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${environment})` }}
            />
          )}
          {/* Dark overlay so UI is readable */}
          <div className={`fixed inset-0 z-0 ${isVideo ? 'bg-[#060910]/70 backdrop-blur-[2px]' : 'bg-[#060910]/40'}`} />
        </>
      )}

      <Sidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-24 md:pb-6">
          <div className="mx-auto max-w-[1400px] px-5 py-6 sm:px-8 lg:px-10">
            <Outlet />
          </div>
        </main>
      </div>
      <TrendSignalChat />
    </div>
  );
}
