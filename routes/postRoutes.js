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
// CREATE a Post
router.post('/', upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'featureImage', maxCount: 1 }]), async (req, res) => {
  try {
    if (!req.files || !req.files.coverImage) {
      return res.status(400).json({ msg: 'Cover image is required' });
    }

    // Upload Cover Image
    const coverResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "blog_covers" },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      uploadStream.end(req.files.coverImage[0].buffer);
    });

    // Upload Feature Image (if provided)
    let featureResult = null;
    if (req.files.featureImage && req.files.featureImage.length > 0) {
      featureResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "blog_features" },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        uploadStream.end(req.files.featureImage[0].buffer);
      });
    }

    // Create Post
    const newPost = new Post({
      title: req.body.title,
      content: req.body.content,
      slug: slugify(req.body.title),
      coverImage: {
        public_id: coverResult.public_id,
        url: coverResult.secure_url,
      },
      featureImage: featureResult
        ? {
            public_id: featureResult.public_id,
            url: featureResult.secure_url,
          }
        : undefined,
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    console.error('Error creating post:', err);
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

// Add this route before '/:slug' to avoid conflicts
router.get('/published', async (req, res) => {
  try {
    const posts = await Post.find({ isPublished: true }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/toggle', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    
    post.isPublished = !post.isPublished; // Flip the boolean
    await post.save();
    
    res.status(200).json(post);
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
    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({ msg: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;
