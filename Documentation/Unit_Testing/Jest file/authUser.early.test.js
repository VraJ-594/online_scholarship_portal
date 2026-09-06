
// Unit tests for: authUser




const { authUser } = require('../authUser');
const bcrypt = require("bcryptjs");
const pool = require("../../config/db");
const generateToken = require("../../config/generateToken");
// Mocking the generateToken function
jest.mock("../../config/generateToken", () => {
  const originalModule = jest.requireActual("../../config/generateToken");
  return {
    __esModule: true,
    ...originalModule,
    default: jest.fn(),
  };
});

// Mocking the pool.query function
jest.mock("../../config/db", () => {
  return {
    query: jest.fn(),
  };
});

// Mocking bcrypt.compare function
jest.mock("bcryptjs", () => {
  const originalModule = jest.requireActual("bcryptjs");
  return {
    __esModule: true,
    ...originalModule,
    compare: jest.fn(),
  };
});

describe('authUser() authUser method', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe('Happy Paths', () => {
    it('should authenticate user successfully and return user data with token', async () => {
      // Arrange
      pool.query.mockResolvedValue({
        rows: [
          {
            email: 'test@example.com',
            password: 'hashedPassword',
            role: 'user',
            username: 'testuser',
            pic: 'profilepic.jpg',
          },
        ],
      });

      bcrypt.compare.mockImplementation((password, hash, callback) => {
        callback(null, true);
      });

      generateToken.mockReturnValue('mockedToken');

      // Act
      await authUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        role: 'user',
        username: 'testuser',
        email: 'test@example.com',
        pic: 'profilepic.jpg',
        token: 'mockedToken',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should return 401 if user role does not match', async () => {
      // Arrange
      pool.query.mockResolvedValue({
        rows: [
          {
            email: 'test@example.com',
            password: 'hashedPassword',
            role: 'admin',
          },
        ],
      });

      // Act
      await authUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "You don't have a permission as user",
      });
    });

    it('should return 401 if password is incorrect', async () => {
      // Arrange
      pool.query.mockResolvedValue({
        rows: [
          {
            email: 'test@example.com',
            password: 'hashedPassword',
            role: 'user',
          },
        ],
      });

      bcrypt.compare.mockImplementation((password, hash, callback) => {
        callback(null, false);
      });

      // Act
      await authUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid Password',
      });
    });

    it('should return 400 if user is not found', async () => {
      // Arrange
      pool.query.mockResolvedValue({ rows: [] });

      // Act
      await authUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Login failed User not found',
      });
    });
  });
});

// End of unit tests for: authUser
