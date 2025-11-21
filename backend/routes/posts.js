// src/routes/posts.js
import express from 'express';
import Post from '../models/Post.js';
import slugify from 'slugify';
import { authMiddleware } from '../middleware/authMiddleware.js';
const router = express.Router();

import { createPostSchema, updatePostSchema} from '../src/validation/postSchemas.js';
import { validate } from '../middleware/validate.js';
import { ensureAuthorOrAdmin } from '../middleware/permissions.js';

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


// DELETE POST
router.delete(
  "/:id",
  authMiddleware,
  ensureAuthorOrAdmin(),
  async (req, res, next) => {
    try {
      const postId = req.params.id;
      const deleted = await Post.findByIdAndDelete(postId);

      if (!deleted) {
        return res.status(404).json({ error: "Post not found" });
      }

      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

// UPDATE POST
router.patch(
  "/:id",
  authMiddleware,
  ensureAuthorOrAdmin(),
  validate(updatePostSchema),
  async (req, res, next) => {
    try {
      const postId = req.params.id;

      // load original post
      const post = await Post.findById(postId);
      if (!post) return res.status(404).json({ error: "not found" });

      const { title, summary, content, tags, status } = req.body;

      // If title changes, regenerate slug
      if (title && title !== post.title) {
        const newSlug = `${slugify(title, { lower: true, strict: true })}-${Date.now()
          .toString(36)
          .slice(-6)}`;
        post.slug = newSlug;
      }

      if (title !== undefined) post.title = title;
      if (summary !== undefined) post.summary = summary;
      if (content !== undefined) post.content = content;
      if (tags !== undefined) post.tags = tags;
      if (status !== undefined) post.status = status;

      post.updatedAt = new Date();
      await post.save();

      res.json(post);
    } catch (err) {
      next(err);
    }
  }
);
export default router;
