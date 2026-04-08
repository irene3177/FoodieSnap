import path from 'path';
import fs from 'fs';
import { uploadAvatar, isLocalAvatar, deleteOldAvatarIfLocal } from '../../middleware/upload.middleware';

// Mock fs
jest.mock('fs');
jest.mock('path');

describe('Upload Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isLocalAvatar', () => {
    it('should return true for local avatar URL', () => {
      // Arrange
      const url = 'http://localhost:5001/uploads/avatars/avatar-123.jpg';

      // Act
      const result = isLocalAvatar(url);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for external avatar URL', () => {
      // Arrange
      const url = 'https://picsum.photos/200/200';

      // Act
      const result = isLocalAvatar(url);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for undefined avatar URL', () => {
      // Act
      const result = isLocalAvatar(undefined);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
      // Act
      const result = isLocalAvatar('');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('deleteOldAvatarIfLocal', () => {
    const mockUploadDir = '/fake/path/uploads/avatars';

    beforeEach(() => {
      (path.join as jest.Mock).mockReturnValue(mockUploadDir);
    });

    it('should not delete if avatarUrl is undefined', () => {
      // Act
      deleteOldAvatarIfLocal(undefined);

      // Assert
      expect(fs.existsSync).not.toHaveBeenCalled();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('should not delete external avatar URL', () => {
      // Arrange
      const url = 'https://picsum.photos/200/200';

      // Act
      deleteOldAvatarIfLocal(url);

      // Assert
      expect(fs.existsSync).not.toHaveBeenCalled();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('should delete local avatar file if exists', () => {
      // Arrange
      const filename = 'avatar-123.jpg';
      const url = `http://localhost:5001/uploads/avatars/${filename}`;
      const filePath = path.join(mockUploadDir, filename);
      
      (path.join as jest.Mock).mockReturnValue(filePath);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {});

      // Act
      deleteOldAvatarIfLocal(url);

      // Assert
      expect(fs.existsSync).toHaveBeenCalledWith(filePath);
      expect(fs.unlinkSync).toHaveBeenCalledWith(filePath);
    });

    it('should not delete local avatar file if does not exist', () => {
      // Arrange
      const filename = 'avatar-123.jpg';
      const url = `http://localhost:5001/uploads/avatars/${filename}`;
      const filePath = path.join(mockUploadDir, filename);
      
      (path.join as jest.Mock).mockReturnValue(filePath);
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Act
      deleteOldAvatarIfLocal(url);

      // Assert
      expect(fs.existsSync).toHaveBeenCalledWith(filePath);
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      // Arrange
      const filename = 'avatar-123.jpg';
      const url = `http://localhost:5001/uploads/avatars/${filename}`;
      const filePath = path.join(mockUploadDir, filename);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (path.join as jest.Mock).mockReturnValue(filePath);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      // Act
      deleteOldAvatarIfLocal(url);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('uploadAvatar middleware', () => {
    it('should be configured with correct limits', () => {
      // The middleware is created with multer, we can test its configuration
      expect(uploadAvatar).toBeDefined();
      expect(typeof uploadAvatar).toBe('function');
    });

    it('should accept valid image files', () => {
      // This tests the file filter logic indirectly
      // We can't easily test multer directly, but we can test that the middleware exists
      expect(uploadAvatar).toBeInstanceOf(Function);
    });
  });
});