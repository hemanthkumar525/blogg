// utils/multer.js
const multer = require('multer');

// We use memoryStorage because we're going to upload the buffer directly to Cloudinary
// and don't need to save it to disk first.
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

module.exports = upload;