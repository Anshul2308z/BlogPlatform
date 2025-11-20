import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import RefreshToken from '../models/RefreshToken.js';
import ms from 'ms'; // lightweight parser (we'll implement fallback if not installed)

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const ACCESS_TOKEN_EXPIRES = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d'; // format examples: '30d' or '2592000s'

// helper: generate random token (raw string)
export function generateRandomToken(len = 48) {
  return crypto.randomBytes(len).toString('hex');
}

// helper: hash token for storage (sha256 hex)
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// create access JWT
export function createAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
}

// parse REFRESH_EXPIRES to ms
export function parseExpiryToMs(exp) {
  // try ms package semantics (like '30d' or '15m'). If not available or fails, fallback.
  try {
    // ms package may not be installed; implement minimal parser
    if (typeof exp === 'string') {
      const re = /^(\d+)([smhd])$/i;
      const m = exp.match(re);
      if (m) {
        const val = Number(m[1]);
        const unit = m[2].toLowerCase();
        if (unit === 's') return val * 1000;
        if (unit === 'm') return val * 60 * 1000;
        if (unit === 'h') return val * 60 * 60 * 1000;
        if (unit === 'd') return val * 24 * 60 * 60 * 1000;
      }
    }
  } catch (e) {
    // ignore
  }
  // fallback to 30 days
  return 30 * 24 * 60 * 60 * 1000;
}

// create & persist refresh token, return raw token
export async function createRefreshToken(userId, { ip = '', userAgent = '' } = {}) {
  const raw = generateRandomToken(48);
  const tokenHash = hashToken(raw);
  const ttlMs = parseExpiryToMs(REFRESH_EXPIRES);
  const expiresAt = new Date(Date.now() + ttlMs);

  // upsert: store a single refresh token per user / userAgent if you prefer multiple sessions allow multiple
  const doc = new RefreshToken({
    user: userId,
    tokenHash,
    expiresAt,
    ip,
    userAgent
  });
  await doc.save();

  return { raw, expiresAt };
}

// verify incoming refresh token raw string: find hashed match
export async function verifyRefreshToken(raw) {
  if (!raw) return null;
  const tokenHash = hashToken(raw);
  const doc = await RefreshToken.findOne({ tokenHash });
  if (!doc) return null;
  if (doc.expiresAt.getTime() < Date.now()) {
    // expired - clean up
    try { await doc.remove(); } catch (e) {}
    return null;
  }
  return doc;
}

// revoke a refresh token (by raw or by DB id)
export async function revokeRefreshTokenByHashHash(tokenHash) {
  try {
    await RefreshToken.deleteOne({ tokenHash });
  } catch (e) { /* ignore */ }
}
export async function revokeRefreshTokenById(id) {
  try {
    await RefreshToken.deleteOne({ _id: id });
  } catch (e) { /* ignore */ }
}
