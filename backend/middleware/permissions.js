import Post from "../models/Post.js";

export function ensureAuthorOrAdmin() {
  return async (req, res, next) => {
    try {
      const postId = req.params.id;
      const user = req.user;

      const post = await Post.findById(postId);
      if (!post) return res.status(404).json({ error: "Post not found" });

      const isOwner = post.author.toString() === user.id;
      const isAdmin = user.role === "admin";

      if (!isOwner && !isAdmin)
        return res.status(403).json({ error: "Forbidden" });

      req.post = post; // full object now
      next();
    } catch (err) {
      next(err);
    }
  };
}
