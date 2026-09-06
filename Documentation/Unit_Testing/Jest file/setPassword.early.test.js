
// Unit tests for: setPassword




const { setPassword } = require('../resetPass');
const bcrypt = require("bcryptjs");
const pool = require("../../config/db");
jest.mock("bcryptjs");
jest.mock("../../config/db");

describe('setPassword() setPassword method', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        email: 'test@example.com',
        otp: '123456',
        newPassword: 'newSecurePassword123'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('Happy Paths', () => {
    it('should update the password successfully when valid email, OTP, and new password are provided', async () => {
      // Mocking database response for valid OTP
      pool.query.mockResolvedValueOnce({
        rows: [{ otp: 'hashedOTP', created_at: new Date() }]
      });

      // Mocking bcrypt comparison and hashing
      bcrypt.compareSync.mockReturnValue(true);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedNewPassword');

      // Mocking successful password update
      pool.query.mockResolvedValueOnce();

      await setPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Password updated successfully' });
    });
  });

  describe('Edge Cases', () => {
    it('should return 400 if email, OTP, or new password is missing', async () => {
      req.body = {}; // Empty request body

      await setPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email, OTP, and new password are required' });
    });

    it('should return 400 if OTP is invalid', async () => {
      // Mocking database response for invalid OTP
      pool.query.mockResolvedValueOnce({
        rows: [{ otp: 'hashedOTP', created_at: new Date() }]
      });

      bcrypt.compareSync.mockReturnValue(false); // OTP does not match

      await setPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid OTP' });
    });

    it('should return 400 if OTP has expired', async () => {
      // Mocking database response for expired OTP
      const expiredDate = new Date(Date.now() - 700000); // More than 10 minutes ago
      pool.query.mockResolvedValueOnce({
        rows: [{ otp: 'hashedOTP', created_at: expiredDate }]
      });

      await setPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Request Has been expired' });
    });

    it('should return 400 if no OTP record is found for the email', async () => {
      // Mocking database response for no OTP record
      pool.query.mockResolvedValueOnce({ rows: [] });

      await setPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired OTP' });
    });

    it('should return 500 if there is an internal server error', async () => {
      // Mocking a database error
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await setPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });
});

// End of unit tests for: setPassword
