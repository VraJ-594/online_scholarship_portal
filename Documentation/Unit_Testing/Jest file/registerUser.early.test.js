
// Unit tests for: registerUser




const { registerUser } = require('../registerUser');
const bcrypt = require("bcryptjs");
const pool = require("../../config/db");
jest.mock("../../config/generateToken");
jest.mock("bcryptjs");
jest.mock("../../config/db");

describe('registerUser() registerUser method', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };

    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('hashedPassword');
  });

  // Happy Path Tests
  describe('Happy Paths', () => {
    it('should register a new user successfully', async () => {
      // Mock database responses
      pool.query.mockResolvedValueOnce({ rows: [] }); // No existing user
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, username: 'testuser', email: 'test@example.com', role: 'user' }] });

      await registerUser(req, res);

      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      });
    });
    it('should return 400 if any field is missing', async () => {
      req.body = { username: '', email: '', password: '' };

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(JSON.stringify("Please Input all the Feilds"));
    });

    it('should return 400 if user already exists', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // User exists

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'User already exists'
      });
    });

    it('should handle database errors gracefully', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errMsg: 'Something went wrong'
      });
    });

    it('should handle bcrypt errors gracefully', async () => {
      bcrypt.genSalt.mockRejectedValueOnce(new Error('Bcrypt error'));

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errMsg: 'Something went wrong'
      });
    });
  });
});


