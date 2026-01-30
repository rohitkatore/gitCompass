import mongoose from 'mongoose';

const repositorySchema = new mongoose.Schema({
  githubId: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  owner: {
    login: String,
    avatarUrl: String,
    type: String,
  },
  description: {
    type: String,
  },
  htmlUrl: {
    type: String,
  },
  homepage: {
    type: String,
  },
  language: {
    type: String,
  },
  topics: [{
    type: String,
  }],
  stars: {
    type: Number,
    default: 0,
  },
  forks: {
    type: Number,
    default: 0,
  },
  watchers: {
    type: Number,
    default: 0,
  },
  openIssuesCount: {
    type: Number,
    default: 0,
  },
  license: {
    name: String,
    spdxId: String,
  },
  defaultBranch: {
    type: String,
    default: 'main',
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
  pushedAt: {
    type: Date,
  },
  // Computed embeddings for semantic search
  embedding: {
    type: [Number],
    default: [],
  },
  // Good first issues cache
  goodFirstIssues: [{
    number: Number,
    title: String,
    labels: [String],
    createdAt: Date,
    url: String,
  }],
  // Cache metadata
  lastCached: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
repositorySchema.index({ fullName: 1 });
repositorySchema.index({ stars: -1 });
repositorySchema.index({ language: 1 });
repositorySchema.index({ topics: 1 });
repositorySchema.index({ 'owner.login': 1 });

const Repository = mongoose.model('Repository', repositorySchema);

export default Repository;
