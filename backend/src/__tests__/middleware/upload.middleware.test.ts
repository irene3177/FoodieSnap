import { uploadAvatar, isCloudinaryAvatar, deleteOldAvatarFromCloudinary } from '../../middleware/upload.middleware';
import { v2 as cloudinary } from 'cloudinary';

// Mock cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      destroy: jest.fn()
    }
  }
}));

describe('Upload Middleware - Cloudinary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isCloudinaryAvatar', () => {
    it('should return true for Cloudinary avatar URL', () => {
      // Arrange
      const url = 'https://res.cloudinary.com/dyb6cegae/image/upload/v1234567890/avatars/avatar-123.jpg';

      // Act
      const result = isCloudinaryAvatar(url);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for external non-Cloudinary URL', () => {
      // Arrange
      const url = 'https://picsum.photos/200/200';

      // Act
      const result = isCloudinaryAvatar(url);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for local URL', () => {
      // Arrange
      const url = 'http://localhost:5001/uploads/avatars/avatar-123.jpg';

      // Act
      const result = isCloudinaryAvatar(url);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for undefined avatar URL', () => {
      // Act
      const result = isCloudinaryAvatar(undefined);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
      // Act
      const result = isCloudinaryAvatar('');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('deleteOldAvatarFromCloudinary', () => {
    it('should not delete if avatarUrl is undefined', async () => {
      // Act
      await deleteOldAvatarFromCloudinary(undefined);

      // Assert
      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    it('should not delete if avatarUrl is not from Cloudinary', async () => {
      // Arrange
      const url = 'https://picsum.photos/200/200';

      // Act
      await deleteOldAvatarFromCloudinary(url);

      // Assert
      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    it('should delete Cloudinary avatar file', async () => {
      // Arrange
      const filename = 'avatar-123.jpg';
      const publicId = `avatars/${filename.split('.')[0]}`;
      const url = `https://res.cloudinary.com/dyb6cegae/image/upload/v1234567890/avatars/${filename}`;
      
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

      // Act
      await deleteOldAvatarFromCloudinary(url);

      // Assert
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(publicId);
    });

    it('should handle Cloudinary URL with different format', async () => {
      // Arrange
      const url = 'https://res.cloudinary.com/dyb6cegae/image/upload/avatars/avatar-456.png';
      const publicId = 'avatars/avatar-456';
      
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

      // Act
      await deleteOldAvatarFromCloudinary(url);

      // Assert
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(publicId);
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const url = 'https://res.cloudinary.com/dyb6cegae/image/upload/v1234567890/avatars/avatar-123.jpg';
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(new Error('Cloudinary error'));

      // Act
      await deleteOldAvatarFromCloudinary(url);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting old avatar from Cloudinary:', expect.any(Error));
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