import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  githubId: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  displayName: {
    type: String,
  },
  email: {
    type: String,
  },
  avatar: {
    type: String,
  },
  profileUrl: {
    type: String,
  },
  accessToken: {
    type: String,
  },
  bio: {
    type: String,
  },
  company: {
    type: String,
  },
  location: {
    type: String,
  },
  publicRepos: {
    type: Number,
    default: 0,
  },
  followers: {
    type: Number,
    default: 0,
  },
  following: {
    type: Number,
    default: 0,
  },
  // Extracted skills from resume
  skills: [{
    name: String,
    confidence: Number,
    category: String,
  }],
  // Resume data
  resume: {
    filename: String,
    uploadedAt: Date,
    rawText: String,
  },
  // Saved repositories
  savedRepositories: [{
    repoId: String,
    fullName: String,
    savedAt: Date,
  }],
  // Activity tracking
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for faster queries (email doesn't have unique:true so we add index)
userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);

export default User;
