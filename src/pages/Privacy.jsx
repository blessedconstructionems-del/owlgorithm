import { Link } from 'react-router-dom';

function LegalSection({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="space-y-3 text-sm leading-6 text-gray-300">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#060910] px-4 py-10 text-gray-200 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-8 rounded-2xl border border-white/8 bg-[#0f1219]/92 p-6 shadow-2xl shadow-black/60 sm:p-8">
        <div className="space-y-3">
          <Link to="/auth" className="text-sm text-cyan-300 hover:text-cyan-200">Back</Link>
          <h1 className="text-3xl font-semibold text-white">Privacy Policy</h1>
          <p className="text-sm text-gray-400">Effective April 14, 2026.</p>
        </div>

        <LegalSection title="What we collect">
          <p>Owlgorithm stores the account details you provide at signup, including your name, email address, encrypted password, and your saved workspace settings.</p>
          <p>We also keep session records, one-time verification and password-reset tokens, IP addresses, and user-agent strings for account security, sign-in tracking, and abuse prevention.</p>
        </LegalSection>

        <LegalSection title="How we use it">
          <p>Your account data is used to authenticate you, keep your settings attached to your account, and operate the trend dashboard.</p>
          <p>Your email address is also used to send verification and password-recovery messages you request through the service.</p>
          <p>Security and operational logs are used to detect suspicious sign-in patterns, rate-limit abuse, and maintain the service.</p>
        </LegalSection>

        <LegalSection title="What we do not sell">
          <p>Owlgorithm does not sell your personal information.</p>
        </LegalSection>

        <LegalSection title="Retention and deletion">
          <p>Your account data stays in the service until you delete your account. When you delete your account from Settings, the account record, saved settings, and active sessions are removed from the application database.</p>
        </LegalSection>

        <LegalSection title="Contact">
          <p>For privacy requests, support the address you publish for the service before launch and keep it monitored.</p>
        </LegalSection>
      </div>
    </div>
  );
}
