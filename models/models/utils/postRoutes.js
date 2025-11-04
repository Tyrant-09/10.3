const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFile } = require('../utils/s3Upload');
const Post = require('../models/Post');
const { protect } = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const imageUrl = req.file ? await uploadFile(req.file) : null;
    const post = await Post.create({
      caption: req.body.caption,
      imageUrl,
      author: req.user._id
    });
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', async (req, res) => {
  const posts = await Post.find().populate('author', 'username profilePic');
  res.json(posts);
});

router.post('/:id/like', protect, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (post.likes.includes(req.user._id)) {
    post.likes.pull(req.user._id);
  } else {
    post.likes.push(req.user._id);
  }
  await post.save();
  res.json(post);
});

router.post('/:id/comment', protect, async (req, res) => {
  const post = await Post.findById(req.params.id);
  post.comments.push({ user: req.user._id, text: req.body.text });
  await post.save();
  res.json(post);
});

module.exports = router;
