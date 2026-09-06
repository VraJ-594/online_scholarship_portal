
// Unit tests for: getUserProfile
const pool = require("../../config/db");
const { getUserProfile } = require('../../controller/getUserProfile');
// Import necessary modules
// Mock the pool.query method
jest.mock("../../config/db", () => ({
  query: jest.fn(),
}));

describe('getUserProfile() getUserProfile method', () => {
  let req, res;

  beforeEach(() => {
    // Set up mock request and response objects
    req = {
      query: {
        email: 'admin@example.com',
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  // Happy Path Tests
  describe('Happy Paths', () => {
    it('should return user profile when admin user is found', async () => {
      // Arrange: Mock the database response
      pool.query.mockResolvedValue({
        rows: [{ email: 'admin@example.com', username: 'adminUser' }],
      });

      // Act: Call the function
      await getUserProfile(req, res);

      // Assert: Check the response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ email: 'admin@example.com', username: 'adminUser' });
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    it('should return 404 when admin user is not found', async () => {
      // Arrange: Mock the database response
      pool.query.mockResolvedValue({ rows: [] });

      // Act: Call the function
      await getUserProfile(req, res);

      // Assert: Check the response
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Admin user not found' });
    });

    it('should return 500 on database error', async () => {
      // Arrange: Mock the database to throw an error
      pool.query.mockRejectedValue(new Error('Database error'));

      // Act: Call the function
      await getUserProfile(req, res);

      // Assert: Check the response
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });

    it('should handle missing email query parameter gracefully', async () => {
      // Arrange: Remove email from query
      req.query.email = undefined;

      // Act: Call the function
      await getUserProfile(req, res);

      // Assert: Check the response
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Admin user not found' });
    });
  });
});

// End of unit tests for: getUserProfile
