
// Unit tests for: updateUserProfile

const { updateUserProfile } = require('../../controller/getUserProfile');
const pool = require("../../config/db");
jest.mock("../../config/db", () => ({
  query: jest.fn(),
}));

describe('updateUserProfile() updateUserProfile method', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        email: 'admin@example.com',
        name: 'NewAdminName',
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  // Happy Path Tests
  describe('Happy Paths', () => {
    it('should update the username successfully when valid email and name are provided', async () => {
      // Arrange
      pool.query.mockResolvedValue({ rowCount: 1 });

      // Act
      await updateUserProfile(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE osp.users SET username = $1 WHERE email = $2',
        ['NewAdminName', 'admin@example.com']
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Username updated successfully' });
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    it('should return 400 if email is missing', async () => {
      // Arrange
      req.body.email = undefined;

      // Act
      await updateUserProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and Name are required' });
    });

    it('should return 400 if name is missing', async () => {
      // Arrange
      req.body.name = undefined;

      // Act
      await updateUserProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and Name are required' });
    });

    it('should return 404 if no user is found to update', async () => {
      // Arrange
      pool.query.mockResolvedValue({ rowCount: 0 });

      // Act
      await updateUserProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Admin user not found' });
    });

    it('should return 500 if there is a database error', async () => {
      // Arrange
      pool.query.mockRejectedValue(new Error('Database error'));

      // Act
      await updateUserProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
  });
});

// End of unit tests for: updateUserProfile
