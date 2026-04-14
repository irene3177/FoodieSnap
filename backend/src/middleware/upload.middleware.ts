import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';

cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
  secure: true
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  } as any
});

// File filter
const fileFilter = (_req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.'), false);
  }
};

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
}).single('avatar');

// Helper to check if avatar is stored on Cloudinary
export const isCloudinaryAvatar = (avatarUrl: string | undefined): boolean => {
  if (!avatarUrl) return false;
  return avatarUrl.includes('cloudinary.com');
};

// Helper to delete old avatar from Cloudinary
export const deleteOldAvatarFromCloudinary = async (avatarUrl: string | undefined) => {
  if (!avatarUrl || !isCloudinaryAvatar(avatarUrl)) {
    return;
  }

  try {
    // Extract public ID from Cloudinary URL
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/avatars/filename.jpg
    const parts = avatarUrl.split('/');
    const filenameWithExt = parts.pop();
    const filename = filenameWithExt?.split('.')[0];
    const folder = parts.pop();
    
    if (filename && folder) {
      const publicId = `${folder}/${filename}`;
      await cloudinary.uploader.destroy(publicId);
      console.log(`Deleted avatar: ${publicId}`);
    }
  } catch (error) {
    console.error('Error deleting old avatar from Cloudinary:', error);
  }
};



// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';

// // Ensure upload directory exists
// const uploadDir = path.join(__dirname, '../../uploads/avatars');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// // Configure storage
// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (_req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const ext = path.extname(file.originalname);
//     cb(null, `avatar-${uniqueSuffix}${ext}`);
//   }
// });

// // File filter
// const fileFilter = (_req: any, file: any, cb: any) => {
//   const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.'), false);
//   }
// };

// export const uploadAvatar = multer({
//   storage,
//   fileFilter,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB limit
//   }
// }).single('avatar');

// // Helper to check if avatar is stored on our server
// export const isLocalAvatar = (avatarUrl: string | undefined): boolean => {
//   if (!avatarUrl) return false;
//   return avatarUrl.includes('/uploads/avatars/');
// };

// // Helper to delete old avatar file (only if it is local)
// export const deleteOldAvatarIfLocal = (avatarUrl: string | undefined) => {
//   if (!avatarUrl || !isLocalAvatar(avatarUrl)) {
//     // Skipping deletion
//     return;
//   }

//   try {
//     // Extract filename from URL
//     const filename = avatarUrl.split('/').pop();
//     if (!filename) return;

//     const filePath = path.join(uploadDir, filename);
//     if (fs.existsSync(filePath)) {
//       fs.unlinkSync(filePath);
//     }
//   } catch (error) {
//     console.error('Error deleting old avatar:', error);
//   }
// };