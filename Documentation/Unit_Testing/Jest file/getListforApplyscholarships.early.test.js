// Unit tests for: getListforApplyscholarships

const { getListforApplyscholarships } = require('../getListforApplyScholarships');
const pool = require("../../config/db");
jest.mock("../../config/db");

describe('getListforApplyscholarships() getListforApplyscholarships method', () => {
  let req, res;

  beforeEach(() => {
    req = {}; // Mock request object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }; // Mock response object
  });

  // Happy Path Tests
  describe('Happy Path', () => {
    it('should return a list of scholarships when the query is successful', async () => {
      // Arrange
      const mockRows = [
        { scholarship_id: 1, scholarship_name: 'Scholarship A', end_date: '2023-12-31', amount: 1000 },
        { scholarship_id: 2, scholarship_name: 'Scholarship B', end_date: '2024-01-15', amount: 1500 },
      ];
      pool.query.mockResolvedValue({ rows: mockRows });

      // Act
      await getListforApplyscholarships(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRows);
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    it('should handle an empty list of scholarships', async () => {
      // Arrange
      pool.query.mockResolvedValue({ rows: [] });

      // Act
      await getListforApplyscholarships(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should handle database query errors gracefully', async () => {
      // Arrange
      const mockError = new Error('Database error');
      pool.query.mockRejectedValue(mockError);

      // Act
      await getListforApplyscholarships(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ errMsg: 'Internal Server Error' });
    });

    it('should handle database connection issues', async () => {
      // Simulate a database connection error
      const mockError = new Error('Connection error');
      pool.query.mockRejectedValue(mockError);

      // Act
      await getListforApplyscholarships(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ errMsg: 'Internal Server Error' });
    });

    it('should log the error when there is a database issue', async () => {
      // Simulate a database query error
      const mockError = new Error('Database query failed');
      pool.query.mockRejectedValue(mockError);

      // Mock console.error
      console.error = jest.fn();

      await getListforApplyscholarships(req, res);

      // Assert that the error is logged
      expect(console.error).toHaveBeenCalledWith("Error getting scholarship list:", mockError);
    });

    it('should return 500 if there is a malformed query', async () => {
      // Simulate a situation where the query is malformed
      pool.query.mockRejectedValueOnce(new Error('syntax error at or near "FROM"'));

      await getListforApplyscholarships(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ errMsg: 'Internal Server Error' });
    });
  });
});

