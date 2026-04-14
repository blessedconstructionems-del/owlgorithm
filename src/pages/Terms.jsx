import { Link } from 'react-router-dom';

function LegalSection({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="space-y-3 text-sm leading-6 text-gray-300">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#060910] px-4 py-10 text-gray-200 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-8 rounded-2xl border border-white/8 bg-[#0f1219]/92 p-6 shadow-2xl shadow-black/60 sm:p-8">
        <div className="space-y-3">
          <Link to="/auth" className="text-sm text-cyan-300 hover:text-cyan-200">Back</Link>
          <h1 className="text-3xl font-semibold text-white">Terms of Service</h1>
          <p className="text-sm text-gray-400">Effective April 14, 2026.</p>
        </div>

        <LegalSection title="Use of the service">
          <p>Owlgorithm provides access to a trend dashboard, trend exports, and account-backed workspace settings. Use the service lawfully and do not attempt to abuse sign-in flows, scrape controls, or access control boundaries.</p>
        </LegalSection>

        <LegalSection title="Accounts">
          <p>You are responsible for the accuracy of your account information, for maintaining the security of your password, and for controlling access to the email address used to verify your account.</p>
          <p>You may not share access in ways that violate your planned pricing or acceptable use rules.</p>
        </LegalSection>

        <LegalSection title="Availability">
          <p>Trend data depends on external public sources and may change, degrade, or disappear without notice. Owlgorithm may change, pause, or remove parts of the service as the product evolves.</p>
        </LegalSection>

        <LegalSection title="Termination">
          <p>You may stop using the service at any time. Owlgorithm may suspend or terminate accounts that abuse the product, attack the service, or violate these terms.</p>
        </LegalSection>

        <LegalSection title="Liability">
          <p>The service is provided on an as-available basis. Use the trend feed as an input to your decisions, not as a guarantee of future performance or platform results.</p>
        </LegalSection>
      </div>
    </div>
  );
}
