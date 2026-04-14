import SignalMark from '@/components/shared/SignalMark';
import heroImage from '@/assets/hero.png';

export default function AuthShell({ title, description, children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060910]">
      <img
        src={heroImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.14),transparent_38%),linear-gradient(180deg,rgba(6,9,16,0.62),rgba(6,9,16,0.92))]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-xl space-y-5">
            <SignalMark className="h-14 w-14" />
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Owlgorithm</p>
            <h1 className="text-4xl font-semibold text-white sm:text-5xl">{title}</h1>
            <p className="max-w-lg text-base text-gray-300 sm:text-lg">{description}</p>
            <div className="flex flex-wrap gap-6 text-sm text-gray-400">
              <span>Secure cookie sessions</span>
              <span>Email verification</span>
              <span>Password recovery</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0f1219]/86 p-6 shadow-2xl shadow-black/60 backdrop-blur-xl sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
