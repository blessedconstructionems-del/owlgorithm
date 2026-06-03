const XAI_API_BASE_URL = 'https://api.x.ai/v1';
const DEFAULT_SUPPORT_MODEL = 'grok-4.3';
const MAX_MESSAGES = 10;
const MAX_MESSAGE_CHARS = 1600;

function envValue(...keys) {
  for (const key of keys) {
    const value = `${process.env[key] || ''}`.trim();
    if (value) return value;
  }
  return '';
}

function supportConfig() {
  const apiKey = envValue('OWLGORITHM_SUPPORT_API_KEY', 'XAI_API_KEY', 'GROK_API_KEY', 'OWLGORITHM_MEDIA_API_KEY');
  const baseUrl = envValue('OWLGORITHM_SUPPORT_API_BASE_URL', 'XAI_API_BASE_URL', 'GROK_API_BASE_URL')
    || (apiKey ? XAI_API_BASE_URL : '');
  const model = envValue('OWLGORITHM_SUPPORT_MODEL', 'XAI_SUPPORT_MODEL', 'GROK_SUPPORT_MODEL', 'XAI_MODEL', 'GROK_MODEL')
    || (apiKey ? DEFAULT_SUPPORT_MODEL : '');

  const missing = [];
  if (!apiKey) missing.push('OWLGORITHM_SUPPORT_API_KEY or XAI_API_KEY or GROK_API_KEY');
  if (!baseUrl) missing.push('OWLGORITHM_SUPPORT_API_BASE_URL or XAI_API_BASE_URL');
  if (!model) missing.push('OWLGORITHM_SUPPORT_MODEL or XAI_SUPPORT_MODEL');

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/+$/, ''),
    model,
    configured: missing.length === 0,
    missing,
  };
}

function normalizeRole(role) {
  return role === 'assistant' ? 'assistant' : 'user';
}

function normalizeMessages(body = {}) {
  const raw = Array.isArray(body.messages)
    ? body.messages
    : [{ role: 'user', content: body.message || body.prompt || '' }];

  return raw
    .map((message) => ({
      role: normalizeRole(message.role),
      content: `${message.content || message.text || ''}`.replace(/\s+/g, ' ').trim().slice(0, MAX_MESSAGE_CHARS),
    }))
    .filter((message) => message.content)
    .slice(-MAX_MESSAGES);
}

function systemPrompt(user) {
  const userName = `${user?.name || ''}`.trim();
  return [
    'You are the Owlgorithm support owl for Delphi Labs.',
    'Help users sign in, connect socials, understand trend data, create media in Creator Studio, and publish through Upload-Post.',
    'Keep answers concise and action-oriented. Use exact Owlgorithm screen names when helpful: Dashboard, Trend Radar, Creator Studio, Connect Socials, Settings.',
    'Never ask the user to paste API keys, passwords, OAuth tokens, Firebase codes, or private credentials into chat.',
    'If the request needs account-specific investigation, tell the user what screen or setting to check and keep private data out of the response.',
    userName ? `The signed-in user is ${userName}.` : 'The user may be signed out.',
  ].join(' ');
}

export function getSupportReadiness() {
  const config = supportConfig();
  return {
    configured: config.configured,
    missing: config.missing,
    provider: 'xai',
    model: config.model || null,
  };
}

export async function createSupportReply({ body, user = null }) {
  const config = supportConfig();
  if (!config.configured) {
    const error = new Error(`Support chat is not configured. Missing: ${config.missing.join(', ')}.`);
    error.code = 'support_unavailable';
    throw error;
  }

  const messages = normalizeMessages(body);
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    const error = new Error('Send a support message first.');
    error.code = 'invalid_support_request';
    throw error;
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.25,
      max_tokens: 600,
      messages: [
        { role: 'system', content: systemPrompt(user) },
        ...messages,
      ],
    }),
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof data === 'object' && data?.error?.message
      ? data.error.message
      : typeof data === 'object' && data?.error
        ? data.error
        : `Support provider request failed with HTTP ${response.status}`;
    const error = new Error(message);
    error.code = 'support_provider_error';
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  const reply = data?.choices?.[0]?.message?.content || data?.output_text || data?.message || '';
  if (!reply) {
    const error = new Error('Support provider response did not include a reply.');
    error.code = 'support_provider_error';
    error.payload = data;
    throw error;
  }

  return {
    reply,
    provider: 'xai',
    model: config.model,
  };
}
