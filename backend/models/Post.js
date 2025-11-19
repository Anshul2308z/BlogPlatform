// src/models/Post.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const PostSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  summary: String,
  content: String,
  contentType: { type: String, enum: ['html', 'markdown'], default: 'html' },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [{ type: String, index: true }],
  featuredImage: String,
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  publishedAt: Date,
  views: { type: Number, default: 0 }
},{
    timestamps: true 
});
PostSchema.index({ title: 'text', content: 'text', tags: 'text' }); // ...

export default mongoose.model('Post', PostSchema);
