import { useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, Send, X } from 'lucide-react';

import { useApp } from '@/context/AppContext';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';

const INITIAL_MESSAGE = {
  role: 'assistant',
  text: 'Ask me about signing in, connecting socials, Creator Studio, trends, or posting.',
};

function supportPayload(messages) {
  return messages.map((message) => ({
    role: message.role,
    content: message.text,
  }));
}

export default function SupportOwl() {
  const { authStatus } = useApp();
  const [open, setOpen] = useState(false);
  const [readiness, setReadiness] = useState(null);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    apiRequest('/api/support/readiness')
      .then(setReadiness)
      .catch(() => setReadiness({ configured: false }));
  }, []);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ block: 'end' });
    }
  }, [messages, open]);

  async function handleSubmit(event) {
    event.preventDefault();

    const text = draft.trim();
    if (!text || busy) return;

    const nextMessages = [...messages, { role: 'user', text }];
    setMessages(nextMessages);
    setDraft('');
    setBusy(true);
    setError(null);

    try {
      const data = await apiRequest('/api/support/chat', {
        method: 'POST',
        json: { messages: supportPayload(nextMessages) },
      });
      setMessages((current) => [...current, { role: 'assistant', text: data.reply }]);
    } catch (supportError) {
      const message = supportError.status === 503
        ? 'Support chat is not connected yet. Add XAI_API_KEY or GROK_API_KEY in Render, then redeploy.'
        : supportError.message;
      setError(message);
      setMessages((current) => [...current, { role: 'assistant', text: message }]);
    } finally {
      setBusy(false);
    }
  }

  const online = readiness?.configured === true;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-20 right-4 z-[70] inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-cyan-400 text-[#061018] shadow-xl shadow-black/35 transition-transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-cyan-300 md:bottom-5 md:right-5"
        aria-label={open ? 'Close support chat' : 'Open support chat'}
        title={open ? 'Close support chat' : 'Open support chat'}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open ? (
        <section className="fixed inset-x-3 bottom-36 z-[70] mx-auto flex max-h-[68vh] max-w-md flex-col overflow-hidden rounded-lg border border-white/12 bg-[#0b1018]/95 shadow-2xl shadow-black/55 backdrop-blur-xl md:inset-x-auto md:bottom-20 md:right-5 md:w-[390px]">
          <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Support Owl</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {online ? 'Online' : 'Waiting on Grok env'}
                {authStatus === 'anonymous' ? ' - signed out' : ''}
              </p>
            </div>
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                online ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'bg-amber-400',
              )}
              aria-hidden="true"
            />
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  'max-w-[88%] rounded-lg px-3 py-2 text-sm leading-relaxed',
                  message.role === 'assistant'
                    ? 'border border-white/10 bg-white/[0.04] text-gray-200'
                    : 'ml-auto bg-cyan-400 text-[#061018]',
                )}
              >
                {message.text}
              </div>
            ))}
            {busy ? (
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-gray-300">
                <Loader2 size={14} className="animate-spin" />
                Thinking
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          {error ? <p className="border-t border-white/10 px-4 pt-3 text-xs leading-relaxed text-amber-200">{error}</p> : null}

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-white/10 p-3">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Message support"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/50"
            />
            <button
              type="submit"
              disabled={!draft.trim() || busy}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400 text-[#061018] transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500"
              aria-label="Send support message"
              title="Send"
            >
              <Send size={17} />
            </button>
          </form>
        </section>
      ) : null}
    </>
  );
}
