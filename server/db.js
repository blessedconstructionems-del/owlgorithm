import path from 'path';
import crypto from 'crypto';
import Database from 'better-sqlite3';
import { ensureDir, getRuntimeDataDir } from '../config/env.js';

const DATA_DIR = ensureDir(getRuntimeDataDir());
const DB_PATH = path.join(DATA_DIR, 'owlgorithm.db');
const DEFAULT_ENVIRONMENT = 'gradient:aurora';

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    environment TEXT NOT NULL DEFAULT '${DEFAULT_ENVIRONMENT}',
    sidebar_collapsed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT
  );

  CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);
`);

const userColumns = new Set(db.prepare('PRAGMA table_info(users)').all().map((column) => column.name));
if (!userColumns.has('email_verified_at')) {
  db.exec('ALTER TABLE users ADD COLUMN email_verified_at TEXT');
}

db.exec(`
  CREATE TABLE IF NOT EXISTS account_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    email_snapshot TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    consumed_at TEXT
  );

  CREATE INDEX IF NOT EXISTS account_tokens_lookup_idx
    ON account_tokens(type, token_hash, expires_at);
  CREATE INDEX IF NOT EXISTS account_tokens_user_type_idx
    ON account_tokens(user_id, type);
`);

function avatarForName(name) {
  return `${name || 'O'}`.trim().charAt(0).toUpperCase() || 'O';
}

function serializeAuthState(row) {
  if (!row) return null;

  return {
    user: {
      id: row.user_id,
      email: row.email,
      name: row.name,
      avatar: avatarForName(row.name),
      emailVerified: Boolean(row.email_verified_at),
      emailVerifiedAt: row.email_verified_at || null,
      createdAt: row.user_created_at,
      updatedAt: row.user_updated_at,
    },
    preferences: {
      environment: row.environment || DEFAULT_ENVIRONMENT,
      sidebarCollapsed: Boolean(row.sidebar_collapsed),
    },
  };
}

const authStateSelect = `
  SELECT
    users.id AS user_id,
    users.email,
    users.name,
    users.email_verified_at,
    users.created_at AS user_created_at,
    users.updated_at AS user_updated_at,
    user_preferences.environment,
    user_preferences.sidebar_collapsed
  FROM users
  LEFT JOIN user_preferences ON user_preferences.user_id = users.id
`;

const getUserByIdStmt = db.prepare(`${authStateSelect} WHERE users.id = ?`);
const getUserByEmailRowStmt = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE');
const getUserRecordByIdStmt = db.prepare('SELECT * FROM users WHERE id = ?');
const getAuthStateBySessionIdStmt = db.prepare(`
  ${authStateSelect}
  INNER JOIN sessions ON sessions.user_id = users.id
  WHERE sessions.id = ? AND sessions.expires_at > ?
`);
const insertUserStmt = db.prepare(`
  INSERT INTO users (id, email, name, password_hash, email_verified_at, created_at, updated_at)
  VALUES (@id, @email, @name, @passwordHash, @emailVerifiedAt, @createdAt, @updatedAt)
`);
const insertPreferencesStmt = db.prepare(`
  INSERT INTO user_preferences (user_id, environment, sidebar_collapsed, created_at, updated_at)
  VALUES (@userId, @environment, @sidebarCollapsed, @createdAt, @updatedAt)
`);
const insertSessionStmt = db.prepare(`
  INSERT INTO sessions (id, user_id, created_at, expires_at, last_seen_at, ip_address, user_agent)
  VALUES (@id, @userId, @createdAt, @expiresAt, @lastSeenAt, @ipAddress, @userAgent)
`);
const insertAccountTokenStmt = db.prepare(`
  INSERT INTO account_tokens (id, user_id, type, token_hash, email_snapshot, created_at, expires_at, consumed_at)
  VALUES (@id, @userId, @type, @tokenHash, @emailSnapshot, @createdAt, @expiresAt, NULL)
`);
const deleteSessionStmt = db.prepare('DELETE FROM sessions WHERE id = ?');
const deleteSessionsByUserIdStmt = db.prepare('DELETE FROM sessions WHERE user_id = ?');
const deleteUserStmt = db.prepare('DELETE FROM users WHERE id = ?');
const deleteExpiredSessionsStmt = db.prepare('DELETE FROM sessions WHERE expires_at <= ?');
const deleteExpiredAccountTokensStmt = db.prepare('DELETE FROM account_tokens WHERE expires_at <= ? OR consumed_at IS NOT NULL');
const touchSessionStmt = db.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?');
const getActiveAccountTokenStmt = db.prepare(`
  SELECT *
  FROM account_tokens
  WHERE type = ? AND token_hash = ? AND expires_at > ? AND consumed_at IS NULL
`);
const consumeAccountTokenStmt = db.prepare(`
  UPDATE account_tokens
  SET consumed_at = @consumedAt
  WHERE id = @id AND consumed_at IS NULL
`);
const deleteAccountTokensByUserAndTypeStmt = db.prepare('DELETE FROM account_tokens WHERE user_id = ? AND type = ?');
const updateUserProfileStmt = db.prepare(`
  UPDATE users
  SET
    name = @name,
    email = @email,
    email_verified_at = CASE
      WHEN lower(email) <> lower(@email) THEN NULL
      ELSE email_verified_at
    END,
    updated_at = @updatedAt
  WHERE id = @userId
`);
const updateUserPasswordStmt = db.prepare(`
  UPDATE users
  SET password_hash = @passwordHash, updated_at = @updatedAt
  WHERE id = @userId
`);
const markUserEmailVerifiedStmt = db.prepare(`
  UPDATE users
  SET email_verified_at = @emailVerifiedAt, updated_at = @updatedAt
  WHERE id = @userId
`);
const upsertPreferencesStmt = db.prepare(`
  INSERT INTO user_preferences (user_id, environment, sidebar_collapsed, created_at, updated_at)
  VALUES (@userId, @environment, @sidebarCollapsed, @createdAt, @updatedAt)
  ON CONFLICT(user_id) DO UPDATE SET
    environment = excluded.environment,
    sidebar_collapsed = excluded.sidebar_collapsed,
    updated_at = excluded.updated_at
`);

const createUserTx = db.transaction(({ email, name, passwordHash }) => {
  const now = new Date().toISOString();
  const userId = crypto.randomUUID();

  insertUserStmt.run({
    id: userId,
    email,
    name,
    passwordHash,
    emailVerifiedAt: null,
    createdAt: now,
    updatedAt: now,
  });

  insertPreferencesStmt.run({
    userId,
    environment: DEFAULT_ENVIRONMENT,
    sidebarCollapsed: 0,
    createdAt: now,
    updatedAt: now,
  });

  return userId;
});

const deleteUserTx = db.transaction((userId) => {
  deleteUserStmt.run(userId);
});

export function getUserRecordByEmail(email) {
  return getUserByEmailRowStmt.get(email.trim().toLowerCase()) || null;
}

export function getUserRecordById(userId) {
  return getUserRecordByIdStmt.get(userId) || null;
}

export function createUserAccount({ email, name, passwordHash }) {
  let userId;
  try {
    userId = createUserTx({
      email: email.trim().toLowerCase(),
      name: name.trim(),
      passwordHash,
    });
  } catch (error) {
    if (`${error.code || ''}`.startsWith('SQLITE_CONSTRAINT')) {
      const duplicate = new Error('An account with that email already exists.');
      duplicate.code = 'duplicate_email';
      throw duplicate;
    }

    throw error;
  }

  return getAuthStateByUserId(userId);
}

export function getAuthStateByUserId(userId) {
  return serializeAuthState(getUserByIdStmt.get(userId));
}

export function getAuthStateBySessionId(sessionId) {
  return serializeAuthState(getAuthStateBySessionIdStmt.get(sessionId, new Date().toISOString()));
}

export function createSessionRecord({ id, userId, expiresAt, ipAddress, userAgent }) {
  const now = new Date().toISOString();
  insertSessionStmt.run({
    id,
    userId,
    createdAt: now,
    expiresAt,
    lastSeenAt: now,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });
}

export function touchSession(sessionId) {
  touchSessionStmt.run(new Date().toISOString(), sessionId);
}

export function deleteSessionRecord(sessionId) {
  deleteSessionStmt.run(sessionId);
}

export function deleteSessionsByUserId(userId) {
  deleteSessionsByUserIdStmt.run(userId);
}

export function deleteExpiredSessions() {
  deleteExpiredSessionsStmt.run(new Date().toISOString());
}

export function deleteExpiredAccountTokens() {
  deleteExpiredAccountTokensStmt.run(new Date().toISOString());
}

export function updateUserProfile({ userId, name, email }) {
  try {
    updateUserProfileStmt.run({
      userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (`${error.code || ''}`.startsWith('SQLITE_CONSTRAINT')) {
      const duplicate = new Error('That email is already in use.');
      duplicate.code = 'duplicate_email';
      throw duplicate;
    }

    throw error;
  }

  return getAuthStateByUserId(userId);
}

export function updateUserPreferences({ userId, environment, sidebarCollapsed }) {
  const current = getAuthStateByUserId(userId);
  const now = new Date().toISOString();
  const next = {
    environment: environment ?? current?.preferences.environment ?? DEFAULT_ENVIRONMENT,
    sidebarCollapsed: sidebarCollapsed ?? current?.preferences.sidebarCollapsed ?? false,
  };

  upsertPreferencesStmt.run({
    userId,
    environment: next.environment,
    sidebarCollapsed: next.sidebarCollapsed ? 1 : 0,
    createdAt: now,
    updatedAt: now,
  });

  return getAuthStateByUserId(userId);
}

export function updateUserPassword({ userId, passwordHash }) {
  updateUserPasswordStmt.run({
    userId,
    passwordHash,
    updatedAt: new Date().toISOString(),
  });
}

export function markUserEmailVerified(userId) {
  const now = new Date().toISOString();
  markUserEmailVerifiedStmt.run({
    userId,
    emailVerifiedAt: now,
    updatedAt: now,
  });

  return getAuthStateByUserId(userId);
}

export function createAccountToken({ userId, type, tokenHash, emailSnapshot, expiresAt }) {
  insertAccountTokenStmt.run({
    id: crypto.randomUUID(),
    userId,
    type,
    tokenHash,
    emailSnapshot,
    createdAt: new Date().toISOString(),
    expiresAt,
  });
}

export function getActiveAccountToken({ type, tokenHash }) {
  return getActiveAccountTokenStmt.get(type, tokenHash, new Date().toISOString()) || null;
}

export function consumeAccountToken(tokenId) {
  consumeAccountTokenStmt.run({
    id: tokenId,
    consumedAt: new Date().toISOString(),
  });
}

export function revokeAccountTokensForUser({ userId, type }) {
  deleteAccountTokensByUserAndTypeStmt.run(userId, type);
}

export function deleteUserAccount(userId) {
  deleteUserTx(userId);
}

export { DB_PATH, DEFAULT_ENVIRONMENT };
