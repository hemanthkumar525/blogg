// routes/postRoutes.js
const router = require('express').Router();
const Post = require('../models/postModel');
const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};


// CREATE a Post
router.post('/', upload.single('coverImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No cover image uploaded' });
    }
    
    // Upload image to Cloudinary
    // We use a stream to upload the buffer
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "blog_covers" }, // Optional: organize uploads in a folder
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const newPost = new Post({
      title: req.body.title,
      content: req.body.content,
      slug: slugify(req.body.title),
      coverImage: {
        public_id: result.public_id,
        url: result.secure_url,
      },
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ all Posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ a single Post
router.get('/:id', async (req, res) => {
   try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE a Post (Note: Image update is more complex, here we only update text)
router.put('/:id', async (req, res) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updatedPost) return res.status(404).json({ msg: 'Post not found' });
    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a Post
router.delete('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(post.coverImage.public_id);
    
    // Delete post from DB
    await post.remove();
    
    res.status(200).json({ msg: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
