
// Unit tests for: authRole




const { authRole } = require('../authUser');
const pool = require("../../config/db");
const generateToken = require("../../config/generateToken");
jest.mock("../../config/db", () => ({
  query: jest.fn(),
}));

jest.mock("../../config/generateToken", () => jest.fn());

describe('authRole() authRole method', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        email: 'test@example.com',
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
    it('should return user details and token when role matches', async () => {
      // Arrange
      const user = {
        username: 'testuser',
        email: 'test@example.com',
        pic: 'profile.jpg',
        role: 'user',
      };
      pool.query.mockResolvedValue({ rows: [user] });
      generateToken.mockReturnValue('mockToken');

      // Act
      await authRole(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        `select * from osp.users where email='${req.body.email}'`
      );
      expect(generateToken).toHaveBeenCalledWith({
        email: user.email,
        role: user.role,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        username: user.username,
        email: user.email,
        pic: user.pic,
        role: user.role,
        token: 'mockToken',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should return 401 when role does not match', async () => {
      // Arrange
      const user = {
        username: 'testuser',
        email: 'test@example.com',
        pic: 'profile.jpg',
        role: 'admin',
      };
      pool.query.mockResolvedValue({ rows: [user] });

      // Act
      await authRole(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: `You don't have a permission as ${req.body.role}`,
      });
    });

    it('should return 400 when user is not found', async () => {
      // Arrange
      pool.query.mockResolvedValue({ rows: [] });

      // Act
      await authRole(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found Please Login',
      });
    });

    it('should return 400 on database query error', async () => {
      // Arrange
      const error = new Error('Database error');
      pool.query.mockRejectedValue(error);

      // Act
      await authRole(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: error,
      });
    });
  });
});

// End of unit tests for: authRole
