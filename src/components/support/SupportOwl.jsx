import { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, MessageCircle, Send, Sparkles, Wifi, WifiOff, X } from 'lucide-react';

import { useApp } from '@/context/AppContext';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';

const INITIAL_MESSAGE = {
  role: 'assistant',
  text: 'I can help with account access, social connections, Creator Studio, trend decisions, and publishing failures.',
};

const QUICK_PROMPTS = [
  {
    label: 'Connect Instagram',
    text: 'Walk me through connecting Instagram with Upload-Post and tell me what could block it.',
  },
  {
    label: 'Post a trend',
    text: 'Help me turn the strongest current trend into a safe post plan.',
  },
  {
    label: 'Fix signup',
    text: 'Help me debug signup or sign-in issues for a new user.',
  },
];

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
    event?.preventDefault();

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

  function handleDraftKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  }

  function applyPrompt(prompt) {
    setDraft(prompt);
    setOpen(true);
  }

  const online = readiness?.configured === true;
  const statusLabel = online ? 'Online' : 'Needs Grok env';
  const authLabel = authStatus === 'anonymous' ? 'Signed out' : 'Workspace ready';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn('support-owl-launcher', open && 'support-owl-launcher-open')}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
        title={open ? 'Close support chat' : 'Open support chat'}
      >
        <span className="support-owl-launcher-icon">
          {open ? <X size={18} /> : <MessageCircle size={18} />}
        </span>
        <span className="support-owl-launcher-copy">
          <strong>Support Owl</strong>
          <small>{statusLabel}</small>
        </span>
      </button>

      {open ? (
        <section className="support-owl-panel" aria-label="Support Owl chat">
          <header className="support-owl-header">
            <div className="support-owl-identity">
              <span className="support-owl-mark">
                <Bot size={18} />
              </span>
              <div>
                <p>Support Owl</p>
                <span>{authLabel}</span>
              </div>
            </div>
            <div
              className={cn(
                'support-owl-status',
                online ? 'support-owl-status-online' : 'support-owl-status-waiting',
              )}
            >
              {online ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{statusLabel}</span>
            </div>
          </header>

          <div className="support-owl-context">
            <Sparkles size={15} />
            <p>
              Ask for exact product steps. I use the live backend when configured and I will say when a provider is missing.
            </p>
          </div>

          <div className="support-owl-prompts">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt.label}
                type="button"
                onClick={() => applyPrompt(prompt.text)}
              >
                {prompt.label}
              </button>
            ))}
          </div>

          <div className="support-owl-thread">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  'support-owl-message',
                  message.role === 'assistant' ? 'support-owl-message-assistant' : 'support-owl-message-user',
                )}
              >
                {message.text}
              </div>
            ))}
            {busy ? (
              <div className="support-owl-thinking">
                <Loader2 size={14} />
                Reading the backend state
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          {error ? <p className="support-owl-error">{error}</p> : null}

          <form onSubmit={handleSubmit} className="support-owl-composer">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleDraftKeyDown}
              placeholder="Ask Support Owl"
              rows={2}
            />
            <button
              type="submit"
              disabled={!draft.trim() || busy}
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
