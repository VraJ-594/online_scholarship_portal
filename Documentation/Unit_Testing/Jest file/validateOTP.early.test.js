
// Unit tests for: validateOTP




const { validateOTP } = require('../resetPass');
const bcrypt = require("bcryptjs");
const pool = require("../../config/db");
jest.mock("../../config/db");
jest.mock("bcryptjs");

describe('validateOTP() validateOTP method', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        email: 'test@example.com',
        otp: '123456',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('Happy Paths', () => {
    it('should validate OTP successfully when OTP is correct and not expired', async () => {
      // Arrange
      const hashedOTP = 'hashedOTP';
      const createdAt = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      pool.query.mockResolvedValueOnce({
        rows: [{ otp: hashedOTP, created_at: createdAt }],
      });
      bcrypt.compareSync.mockReturnValueOnce(true);

      // Act
      await validateOTP(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ valid: true, message: 'OTP is valid' });
    });
  });

  describe('Edge Cases', () => {
    it('should return "Wrong OTP" when no OTP is found for the email', async () => {
      // Arrange
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Act
      await validateOTP(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ valid: false, message: 'Wrong OTP' });
    });

    it('should return "OTP has expired" when OTP is older than 10 minutes', async () => {
      // Arrange
      const hashedOTP = 'hashedOTP';
      const createdAt = new Date(Date.now() - 11 * 60 * 1000); // 11 minutes ago
      pool.query.mockResolvedValueOnce({
        rows: [{ otp: hashedOTP, created_at: createdAt }],
      });

      // Act
      await validateOTP(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ valid: false, message: 'OTP has expired' });
    });

    it('should return "Invalid OTP" when OTP does not match', async () => {
      // Arrange
      const hashedOTP = 'hashedOTP';
      const createdAt = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      pool.query.mockResolvedValueOnce({
        rows: [{ otp: hashedOTP, created_at: createdAt }],
      });
      bcrypt.compareSync.mockReturnValueOnce(false);

      // Act
      await validateOTP(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ valid: false, message: 'Invalid OTP' });
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await validateOTP(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ valid: false, message: 'Internal server error' });
    });
  });
});

// End of unit tests for: validateOTP
