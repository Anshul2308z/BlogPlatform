import mongoose from 'mongoose';

const RefreshTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true }, // hash of the token
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index via mongoose? we'll manage expiration explicitly
  ip: String,
  userAgent: String
});

export default mongoose.model('RefreshToken', RefreshTokenSchema); 