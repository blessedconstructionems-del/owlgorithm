import nodemailer from 'nodemailer';

function normalizeBasePath(basePath) {
  const trimmed = `${basePath || '/'}`.trim();
  if (!trimmed || trimmed === '/') return '/';
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}/`;
}

function getEmailConfig() {
  const smtpPort = parseInt(process.env.OWLGORITHM_SMTP_PORT || '587', 10);

  return {
    basePath: normalizeBasePath(process.env.OWLGORITHM_BASE_PATH || '/'),
    publicUrl: `${process.env.OWLGORITHM_PUBLIC_URL || ''}`.trim().replace(/\/+$/g, ''),
    emailFrom: `${process.env.OWLGORITHM_EMAIL_FROM || ''}`.trim(),
    smtpHost: `${process.env.OWLGORITHM_SMTP_HOST || ''}`.trim(),
    smtpPort,
    smtpUser: `${process.env.OWLGORITHM_SMTP_USER || ''}`.trim(),
    smtpPassword: `${process.env.OWLGORITHM_SMTP_PASSWORD || ''}`.trim(),
    smtpSecure: `${process.env.OWLGORITHM_SMTP_SECURE || ''}`.trim().toLowerCase() === 'true' || smtpPort === 465,
  };
}

let cachedTransportSignature = null;
let cachedTransporter = null;

function withBasePath(pathname, basePath) {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (basePath === '/') return normalized;
  return `${basePath.slice(0, -1)}${normalized}`;
}

function getRequestOrigin(req, config) {
  if (config.publicUrl) return config.publicUrl;

  const forwardedProto = `${req.headers['x-forwarded-proto'] || ''}`.split(',')[0].trim();
  const proto = forwardedProto || (req.socket.encrypted ? 'https' : 'http');
  const host = `${req.headers['x-forwarded-host'] || req.headers.host || '127.0.0.1:3847'}`.split(',')[0].trim();
  return `${proto}://${host}`.replace(/\/+$/g, '');
}

function getTransporter(config) {
  if (!config.smtpHost || !config.emailFrom) return null;

  const signature = JSON.stringify([
    config.smtpHost,
    config.smtpPort,
    config.smtpUser,
    config.smtpPassword,
    config.smtpSecure,
    config.emailFrom,
  ]);

  if (cachedTransporter && cachedTransportSignature === signature) {
    return cachedTransporter;
  }

  cachedTransportSignature = signature;
  cachedTransporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: config.smtpUser ? { user: config.smtpUser, pass: config.smtpPassword } : undefined,
  });

  return cachedTransporter;
}

export function emailDeliveryConfigured() {
  const config = getEmailConfig();
  return Boolean(getTransporter(config) && config.emailFrom && config.publicUrl);
}

export function getEmailReadiness() {
  const config = getEmailConfig();
  return {
    publicUrlConfigured: Boolean(config.publicUrl),
    emailFromConfigured: Boolean(config.emailFrom),
    smtpConfigured: Boolean(config.smtpHost),
    deliveryConfigured: Boolean(getTransporter(config) && config.emailFrom && config.publicUrl),
  };
}

export function buildAppUrl(req, pathname) {
  const config = getEmailConfig();
  return `${getRequestOrigin(req, config)}${withBasePath(pathname, config.basePath)}`;
}

async function sendMail({ req, to, subject, text, html, previewPath }) {
  const config = getEmailConfig();
  const previewUrl = buildAppUrl(req, previewPath);
  const transport = getTransporter(config);

  if (!transport || !config.publicUrl) {
    if (process.env.NODE_ENV === 'production') {
      const error = new Error('Email delivery is not configured.');
      error.code = 'email_unavailable';
      throw error;
    }

    console.log(`[Email Preview] ${subject} -> ${to}: ${previewUrl}`);
    return { delivered: false, previewUrl };
  }

  await transport.sendMail({
    from: config.emailFrom,
    to,
    subject,
    text,
    html,
  });

  return { delivered: true, previewUrl: null };
}

export async function sendVerificationEmail({ req, email, name, token }) {
  const linkPath = `/auth/verify-email?token=${encodeURIComponent(token)}`;
  const url = buildAppUrl(req, linkPath);
  const subject = 'Verify your Owlgorithm account';
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const text = [
    greeting,
    '',
    'Verify your email address to finish setting up your Owlgorithm account.',
    url,
    '',
    'This link expires in 24 hours.',
  ].join('\n');
  const html = `
    <p>${greeting}</p>
    <p>Verify your email address to finish setting up your Owlgorithm account.</p>
    <p><a href="${url}">Verify your email</a></p>
    <p>This link expires in 24 hours.</p>
  `;

  return sendMail({
    req,
    to: email,
    subject,
    text,
    html,
    previewPath: linkPath,
  });
}

export async function sendPasswordResetEmail({ req, email, name, token }) {
  const linkPath = `/auth/reset-password?token=${encodeURIComponent(token)}`;
  const url = buildAppUrl(req, linkPath);
  const subject = 'Reset your Owlgorithm password';
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const text = [
    greeting,
    '',
    'Use the link below to reset your Owlgorithm password.',
    url,
    '',
    'This link expires in 1 hour.',
  ].join('\n');
  const html = `
    <p>${greeting}</p>
    <p>Use the link below to reset your Owlgorithm password.</p>
    <p><a href="${url}">Reset your password</a></p>
    <p>This link expires in 1 hour.</p>
  `;

  return sendMail({
    req,
    to: email,
    subject,
    text,
    html,
    previewPath: linkPath,
  });
}
