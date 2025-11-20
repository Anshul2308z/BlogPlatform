import mongoose from 'mongoose';

const RefreshTokenSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true }, // hash of the token
  ip: String , 
  userAgent: String 
},{
    timestamps: true 
});

export default mongoose.model('RefreshToken', RefreshTokenSchema); 