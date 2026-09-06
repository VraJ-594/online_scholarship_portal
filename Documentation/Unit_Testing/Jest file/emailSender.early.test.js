const { emailSender } = require('../resetPass');
const bcrypt = require("bcryptjs");
const pool = require("../../config/db");
const nodemailer = require("nodemailer");

jest.mock("bcryptjs");
jest.mock("../../config/db");
jest.mock("nodemailer");

describe('emailSender() emailSender method', () => {
  let req, res, sendMailMock;

  beforeEach(() => {
    req = { body: { email: 'test@example.com' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the nodemailer `sendMail` method
    sendMailMock = jest.fn().mockResolvedValueOnce({ messageId: '12345' });
    nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });
  });

  describe('Happy Paths', () => {
    it('should send an OTP email when the email exists in the database', async () => {
      // Mock database response
      pool.query.mockResolvedValueOnce({ rows: [{ email: 'test@example.com' }] });
      bcrypt.genSalt.mockResolvedValueOnce('salt');
      bcrypt.hash.mockResolvedValueOnce('hashedOTP');

      // Call the function to be tested
      await emailSender(req, res);

      // Check if the `sendMail` was called
      expect(sendMailMock).toHaveBeenCalled();

      // Check if the database queries were called correctly
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM osp.users WHERE email = $1',
        ['test@example.com']
      );
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO osp.forgot_pass (email, otp, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (email) DO UPDATE SET otp = $2, created_at = NOW()',
        ['test@example.com', 'hashedOTP']
      );

      // Check if the response is correct
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'OTP generated and sent to your email. Please check your inbox.',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should return 400 if email is not provided', async () => {
      req.body.email = null;

      await emailSender(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email is required' });
    });

    it('should return 404 if email does not exist in the database', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await emailSender(req, res);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM osp.users WHERE email = $1',
        ['test@example.com']
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email not found' });
    });

    it('should return 500 if there is an error sending the email', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ email: 'test@example.com' }] });
      bcrypt.genSalt.mockResolvedValueOnce('salt');
      bcrypt.hash.mockResolvedValueOnce('hashedOTP');
      sendMailMock.mockRejectedValueOnce(new Error('Email error'));

      await emailSender(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error sending the OTP email. Please try again later.',
        emailError: expect.any(Error),
      });
    });

    it('should return 500 if there is an internal server error', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await emailSender(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });
});
