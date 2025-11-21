// src/routes/posts.js
import express from 'express';
import Post from '../models/Post.js';
import slugify from 'slugify';
import { authMiddleware } from '../middleware/authMiddleware.js';
const router = express.Router();

import { createPostSchema } from '../src/validation/postSchemas.js';
import { validate } from '../middleware/validate.js';

// create post (no auth check yet)
router.post('/', authMiddleware, validate(createPostSchema),async (req, res, next) => {
  try {
    const { title, content, tags = [], summary } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const slug = `${slugify(title, { lower: true, strict: true })}-${Date.now().toString(36).slice(-6)}`;
    const post = await Post.create({
      title,
      slug,
      content,
      summary,
      tags,
      author: req.user.id 
    });
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

// list posts (simple)
router.get('/', async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).limit(20);
    res.json(posts);
  } catch (err) {
    next(err);
  }
});

// get by slug
router.get('/:slug', async (req, res, next) => {
  try {
    const p = await Post.findOne({ slug: req.params.slug }).populate('author', 'name email');
    if (!p) return res.status(404).json({ error: 'not found' });
    res.json(p);
  } catch (err) {
    next(err);
  }
});

export default router;
