import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import SignalMark from '@/components/shared/SignalMark';

const ROUTE_LABELS = {
  '/': 'Dashboard',
  '/trends': 'Trend Discovery',
  '/scheduler': 'Content Scheduler',
  '/analytics': 'Analytics',
  '/ab-testing': 'A/B Testing',
  '/leaderboard': 'Leaderboard',
  '/truth-radar': 'Truth Radar',
  '/strategy': 'Strategy Hub',
  '/night-watch': 'Night Watch',
  '/platforms': 'Connected Platforms',
  '/wellness': 'Creator Wellness',
  '/settings': 'Settings',
};

const AI_RESPONSES = [
  "Based on your analytics, Reels are outperforming static posts by 34%. I'd recommend shifting more content to short-form video this week.",
  "I found 3 emerging trends in your niche: #SustainableLiving is gaining momentum on Instagram, Lo-fi study beats are trending on YouTube, and carousel templates are hot on LinkedIn.",
  "Here's a caption idea for your next post: 'The secret to growing your audience isn't posting more\u2014it's posting smarter. Here are 5 trends to watch this week \uD83D\uDCC8'",
  "Your best performing content last week was posted on Tuesday at 10am. Consider scheduling your next high-priority post for that time slot.",
  "I've analyzed your competitors' top posts this week. Video content with text overlays is dominating engagement. Want me to draft some hook ideas?",
  "Your follower growth rate is up 12% this week. The #AITools content series is resonating well\u2014I'd suggest doubling down on that theme.",
  "Hot take: Threads engagement is spiking for tech creators right now. Cross-posting your Instagram carousels there could give you a quick boost.",
  "I noticed your engagement drops on Fridays. Consider moving your high-effort posts to Tues\u2013Thurs and using Fridays for lighter, behind-the-scenes content.",
];

const QUICK_ACTIONS = [
  'Find trends',
  'Write a caption',
  'Analyze my stats',
  'Content ideas',
];

const WELCOME_MESSAGES = [
  {
    id: 'welcome-1',
    role: 'ai',
    text: 'Trend desk online. I can help you spot momentum shifts, shape creative angles, and prioritize what to ship next.',
  },
  {
    id: 'welcome-2',
    role: 'ai',
    text: 'Ask for live trend direction, caption options, or a fast read on your current performance.',
  },
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-gray-500"
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <SignalMark className="mr-2 mt-1 h-7 w-7 shrink-0 rounded-full" />
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'rounded-br-md bg-gradient-to-r from-blue-600 to-blue-500 text-white'
            : 'rounded-bl-md bg-[#151a25] text-gray-300'
        )}
      >
        {message.text}
      </div>
    </motion.div>
  );
}

export default function OwlgorithmChat() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(WELCOME_MESSAGES);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [responseIndex, setResponseIndex] = useState(0);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const currentPage =
    ROUTE_LABELS[location.pathname] ||
    Object.entries(ROUTE_LABELS).find(
      ([route]) => route !== '/' && location.pathname.startsWith(route)
    )?.[1] ||
    'Owlgorithm';

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing, scrollToBottom]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const sendMessage = useCallback(
    (text) => {
      const trimmed = text.trim();
      if (!trimmed || typing) return;

      const userMsg = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: trimmed,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setTyping(true);

      const aiText = AI_RESPONSES[responseIndex % AI_RESPONSES.length];
      setResponseIndex((prev) => prev + 1);

      setTimeout(() => {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: `ai-${Date.now()}`, role: 'ai', text: aiText },
        ]);
      }, 1500);
    },
    [typing, responseIndex]
  );

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage]
  );

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-[88px] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-2xl shadow-lg shadow-blue-500/25 transition-shadow hover:shadow-xl hover:shadow-blue-500/30 md:bottom-8 md:right-8"
            aria-label="Open Owlgorithm chat"
          >
            <SignalMark className="h-9 w-9 rounded-full border-white/15 bg-[linear-gradient(160deg,rgba(10,18,34,0.96),rgba(12,74,110,0.9))]" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-50 flex h-full w-full flex-col overflow-hidden border-white/[0.06] bg-[#0a0d14] shadow-2xl sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[500px] sm:w-[400px] sm:rounded-2xl sm:border md:bottom-8 md:right-8"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0f1219] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <SignalMark className="h-9 w-9 rounded-full" />
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Owlgorithm
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-gray-500">Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-gray-300"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto px-4 py-4 scrollbar-none"
            >
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {typing && (
                <div className="flex items-start">
                  <SignalMark className="mr-2 mt-1 h-7 w-7 shrink-0 rounded-full" />
                  <div className="rounded-2xl rounded-bl-md bg-[#151a25]">
                    <TypingIndicator />
                  </div>
                </div>
              )}
            </div>

            {/* Quick action chips */}
            <div className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-2 scrollbar-none">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  onClick={() => sendMessage(action)}
                  disabled={typing}
                  className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400 disabled:opacity-40"
                >
                  {action}
                </button>
              ))}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex shrink-0 items-center gap-2 border-t border-white/[0.06] px-4 py-3"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for a trend, angle, or next move..."
                disabled={typing}
                className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none transition-colors focus:border-blue-500/40 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || typing}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white transition-opacity hover:opacity-90 disabled:opacity-30"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </form>

            {/* Context badge */}
            <div className="shrink-0 border-t border-white/[0.04] bg-[#0A0E14] px-4 py-1.5 text-center text-[10px] text-gray-600">
              Viewing: {currentPage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
