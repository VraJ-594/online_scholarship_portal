
// Unit tests for: handelemail

const pool = require("../../config/db");
const { handelemail } = require('../../controller/handelemail');
// Import necessary modules
// Mock the pool.query method
jest.mock("../../config/db", () => ({
  query: jest.fn(),
}));

describe('handelemail() handelemail method', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks before each test
    pool.query.mockReset();

    // Mock request and response objects
    req = {
      params: {
        email: '',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  // Happy Path Tests
  describe('Happy Paths', () => {
    it('should return 200 and "Email found" when email exists in the database', async () => {
      // Arrange
      req.params.email = 'test@example.com';
      pool.query.mockResolvedValueOnce({ rows: [{ email: 'test@example.com' }] });

      // Act
      await handelemail(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM osp.applicants WHERE email = $1', ['test@example.com']);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('Email found');
    });

    it('should return 404 and "Email not found" when email does not exist in the database', async () => {
      // Arrange
      req.params.email = 'nonexistent@example.com';
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Act
      await handelemail(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM osp.applicants WHERE email = $1', ['nonexistent@example.com']);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Email not found');
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    it('should return 500 and "Server error" when a database error occurs', async () => {
      // Arrange
      req.params.email = 'error@example.com';
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await handelemail(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM osp.applicants WHERE email = $1', ['error@example.com']);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Server error');
    });

    it('should handle an empty email parameter gracefully', async () => {
      // Arrange
      req.params.email = '';
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Act
      await handelemail(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM osp.applicants WHERE email = $1', ['']);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Email not found');
    });

    it('should handle a null email parameter gracefully', async () => {
      // Arrange
      req.params.email = null;
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Act
      await handelemail(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM osp.applicants WHERE email = $1', [null]);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Email not found');
    });
  });
});

// End of unit tests for: handelemail
