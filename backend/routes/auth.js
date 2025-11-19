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
