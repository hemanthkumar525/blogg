// models/postModel.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  coverImage: {
    public_id: { type: String, required: true },
    url: { type: String, required: true },
  },
  // You can add more fields like author, slug, tags, etc.
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Post', postSchema);