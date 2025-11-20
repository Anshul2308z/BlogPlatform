// Revise this code flow atleast once

// src/routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { createAccessToken, createRefreshToken, verifyRefreshToken, hashToken } from '../utils/tokens.js';
import RefreshToken from '../models/RefreshToken.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || 'nb_refresh';
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

// cookie options
function cookieOptions() {
  const secure = process.env.NODE_ENV === 'production';
  const maxAgeMs = (() => {
    // parse like '30d' to ms; simple fallback
    const re = /^(\d+)([smhd])$/i;
    const m = String(REFRESH_EXPIRES).match(re);
    if (m) {
      const val = Number(m[1]); const unit = m[2].toLowerCase();
      if (unit === 's') return val * 1000;
      if (unit === 'm') return val * 60 * 1000;
      if (unit === 'h') return val * 60 * 60 * 1000;
      if (unit === 'd') return val * 24 * 60 * 60 * 1000;
    }
    return 30 * 24 * 60 * 60 * 1000;
  })();

  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(maxAgeMs / 1000) // expressed in seconds for cookie serialization in Express: res.cookie uses ms or options. maxAge in ms? express uses maxAge in milliseconds OR expires; but to be safe set `maxAge` in ms below when calling res.cookie
  };
}

// helper to send tokens: sets refresh cookie, returns access token in body
async function sendTokens(res, user, { ip = '', userAgent = '' } = {}) {
  const accessToken = createAccessToken({ id: user._id, email: user.email, role: user.role });
  const { raw: refreshRaw, expiresAt } = await createRefreshToken(user._id, { ip, userAgent });

  // set httpOnly cookie with refresh token; set maxAge in ms
  const secure = process.env.NODE_ENV === 'production';
  const maxAgeMs = new Date(expiresAt).getTime() - Date.now();
  res.cookie(REFRESH_COOKIE_NAME, refreshRaw, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeMs
  });

  return { accessToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } };
}

/**
 * POST /api/auth/signup
 * creates a user, issues tokens (access in body, refresh in cookie)
 */
router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name || 'Anonymous', email, passwordHash: hash });

    const tokens = await sendTokens(res, user, { ip: req.ip, userAgent: req.get('User-Agent') || '' });
    res.status(201).json(tokens);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * issues tokens
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    const tokens = await sendTokens(res, user, { ip: req.ip, userAgent: req.get('User-Agent') || '' });
    res.json(tokens);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/refresh
 * rotate refresh token -> issue new access token (+ optional new refresh cookie)
 * expects refresh token in httpOnly cookie `nb_refresh`
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const raw = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
    if (!raw) return res.status(401).json({ error: 'no refresh token provided' });

    const doc = await verifyRefreshToken(raw);
    if (!doc) return res.status(401).json({ error: 'invalid or expired refresh token' });

    // all good -> rotate: remove old token, create new one
    await RefreshToken.deleteOne({ _id: doc._id });

    const user = await User.findById(doc.user);
    if (!user) return res.status(401).json({ error: 'user no longer exists' });

    const tokens = await sendTokens(res, user, { ip: req.ip, userAgent: req.get('User-Agent') || '' });
    // return new access token
    res.json(tokens);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout
 * revoke refresh token (cookie) and clear cookie
 */
router.post('/logout', async (req, res, next) => {
  try {
    const raw = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
    if (raw) {
      const tokenHash = hashToken(raw);
      await RefreshToken.deleteOne({ tokenHash });
    }
    // clear cookie
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;


/*
// src/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// signup
router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "email and password required" });
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ error: "email already in use" });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash: hash });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "15m" });
    res
      .status(201)
      .json({
        user: { id: user._id, email: user.email, name: user.name },
        token,
      });
  } catch (err) {
    next(err);
  }
});

// login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "email and password required" });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "invalid credentials" });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "15m" });
    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    next(err);
  }
});

export default router;

*/