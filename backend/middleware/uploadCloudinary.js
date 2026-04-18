const multer = require('multer');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'sportsamigo/profile';
const MAX_IMAGE_SIZE_BYTES = Number(process.env.MAX_PROFILE_IMAGE_BYTES || 5 * 1024 * 1024);

const allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

function assertCloudinaryConfigured() {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  }
}

function buildLocalFallbackStorage() {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../public/uploads/profile');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname || '') || '.jpg';
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const userId = req?.session?.user?._id || 'anonymous';
      cb(null, `profile-${userId}-${uniqueSuffix}${extension}`);
    }
  });
}

function buildStorage() {
  // Local fallback allows coding rollout before website credentials are configured.
  return buildLocalFallbackStorage();
}

const uploadLocal = multer({
  storage: buildStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES
  },
  fileFilter: (req, file, cb) => {
    const mime = String(file.mimetype || '').toLowerCase();
    const isImage = mime.startsWith('image/');

    if (!isImage) {
      return cb(new Error('Only image files are allowed'));
    }

    cb(null, true);
  }
});

const uploadCloud = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES
  },
  fileFilter: (req, file, cb) => {
    const mime = String(file.mimetype || '').toLowerCase();
    const isImage = mime.startsWith('image/');

    if (!isImage) {
      return cb(new Error('Only image files are allowed'));
    }

    cb(null, true);
  }
});

function uploadBufferToCloudinary(req, file) {
  assertCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const ext = (file.originalname || '').split('.').pop().toLowerCase();
    const fallbackFormat = ext && allowedFormats.includes(ext) ? ext : 'jpg';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_FOLDER,
        resource_type: 'image',
        format: fallbackFormat,
        public_id: `profile-${req?.session?.user?._id || 'anonymous'}-${Date.now()}`
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
}

function createSingleUploader(fieldName) {
  return (req, res, next) => {
    const middleware = isCloudinaryConfigured()
      ? uploadCloud.single(fieldName)
      : uploadLocal.single(fieldName);

    middleware(req, res, async (err) => {
      if (err) {
        return next(err);
      }

      if (!req.file || !isCloudinaryConfigured()) {
        return next();
      }

      try {
        const uploaded = await uploadBufferToCloudinary(req, req.file);
        req.file.secure_url = uploaded.secure_url;
        req.file.public_id = uploaded.public_id;
        req.file.path = uploaded.secure_url;
        return next();
      } catch (uploadErr) {
        return next(uploadErr);
      }
    });
  };
}

const uploadProfileImage = createSingleUploader('profile_image');
const uploadPhoto = createSingleUploader('photo');

module.exports = {
  upload: uploadLocal,
  uploadProfileImage,
  uploadPhoto,
  CLOUDINARY_FOLDER,
  MAX_IMAGE_SIZE_BYTES
};
