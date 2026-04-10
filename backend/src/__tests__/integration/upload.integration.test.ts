import multer from 'multer';
import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { uploadAvatar, deleteOldAvatarIfLocal } from '../../middleware/upload.middleware';
import { UserModel } from '../../models/User.model';
import bcrypt from 'bcryptjs';

// Create test app with error handling
const app = express();

// Error handler for multer errors
app.use((err: any, _req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

app.post('/test-upload', uploadAvatar, (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ success: true, file: req.file });
  return;
});

describe('Upload Middleware Integration Tests', () => {

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await UserModel.create({
      username: 'testuser',
      email: 'test@test.com',
      password: hashedPassword,
      avatar: 'https://picsum.photos/200/200'
    });
  });

  afterAll(async () => {
    await UserModel.deleteMany({});
  });

  describe('File upload', () => {
    it('should reject request with no file', async () => {
      const response = await request(app)
        .post('/test-upload')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should accept valid image file', async () => {
      // Create a mock image buffer (simple PNG)
      const imageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
      
      const response = await request(app)
        .post('/test-upload')
        .attach('avatar', imageBuffer, 'test-avatar.png')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.file).toBeDefined();
      expect(response.body.file.fieldname).toBe('avatar');
    });
  });

  describe('deleteOldAvatarIfLocal', () => {
    const testUploadDir = path.join(__dirname, '../../../uploads/avatars');
    
    beforeAll(() => {
      // Ensure test directory exists
      if (!fs.existsSync(testUploadDir)) {
        fs.mkdirSync(testUploadDir, { recursive: true });
      }
    });

    afterAll(() => {
      // Clean up test files
      if (fs.existsSync(testUploadDir)) {
        const files = fs.readdirSync(testUploadDir);
        files.forEach(file => {
          if (file.startsWith('test-')) {
            fs.unlinkSync(path.join(testUploadDir, file));
          }
        });
      }
    });

    it('should delete local avatar file', () => {
      const testFileName = `test-avatar-${Date.now()}.jpg`;
      const testFilePath = path.join(testUploadDir, testFileName);
      const avatarUrl = `http://localhost:5001/uploads/avatars/${testFileName}`;
      
      // Create a dummy file
      fs.writeFileSync(testFilePath, 'test content');
      expect(fs.existsSync(testFilePath)).toBe(true);
      
      // Delete the file
      deleteOldAvatarIfLocal(avatarUrl);
      
      // File should be deleted
      expect(fs.existsSync(testFilePath)).toBe(false);
    });

    it('should not delete non-existent file', () => {
      const nonExistentFile = `test-nonexistent-${Date.now()}.jpg`;
      const avatarUrl = `http://localhost:5001/uploads/avatars/${nonExistentFile}`;
      
      // Should not throw error
      expect(() => deleteOldAvatarIfLocal(avatarUrl)).not.toThrow();
    });

    it('should not delete external URL', () => {
      const externalUrl = 'https://picsum.photos/200/200';
      
      // Should not throw error
      expect(() => deleteOldAvatarIfLocal(externalUrl)).not.toThrow();
    });
  });
});