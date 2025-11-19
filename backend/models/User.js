import mongoose from 'mongoose'; 


const UserSchema = new mongoose.Schema({
  name: { type: String, default: 'Anonymous' },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  bio: { type: String },
  avatarUrl: { type: String },
  role: { type: String, enum: ['reader', 'author', 'admin'], default: 'author' },
  isVerified: { type: Boolean, default: false },
//   createdAt: { type: Date, default: Date.now } // we will be using timestamps 
},{
    timestamps: true 
});

export default mongoose.model('User',UserSchema); 