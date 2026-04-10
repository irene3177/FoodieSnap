import mongoose from 'mongoose';
import { UserModel } from '../models/User.model';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { isLocalAvatar } from '../middleware/upload.middleware';

const uploadDir = path.join(__dirname, '../../uploads/avatars');

async function cleanupOrphanedAvatars() {
  await mongoose.connect(config.mongoUri);
  
  // Get all users with local avatars
  const users = await UserModel.find({});
  const usedFiles = new Set<string>();
  
  for (const user of users) {
    if (user.avatar && isLocalAvatar(user.avatar)) {
      const filename = user.avatar.split('/').pop();
      if (filename) usedFiles.add(filename);
    }
  }
  
  // Delete orphaned files
  const files = fs.readdirSync(uploadDir);
  let deletedCount = 0;
  
  for (const file of files) {
    if (!usedFiles.has(file)) {
      fs.unlinkSync(path.join(uploadDir, file));
      deletedCount++;
    }
  }
  
  process.exit();
}

cleanupOrphanedAvatars();