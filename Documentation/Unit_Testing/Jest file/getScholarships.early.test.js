// Unit tests for: getScholarships
const { getScholarships } = require('../getScholarships');
const pool = require("../../config/db");

// Mock the DB module
jest.mock("../../config/db", () => ({
  query: jest.fn(),
}));

describe('getScholarships() getScholarships method', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  // Happy Path Tests
  describe('Happy Paths', () => {
    it('should return a list of scholarships with applicants count', async () => {
      // Arrange: Mock the database response
      const mockRows = [
        { scholarship_id: 1, scholarship_name: 'Scholarship A', amount: 1000, end_date: '2023-12-31', applicants_count: 10 },
        { scholarship_id: 2, scholarship_name: 'Scholarship B', amount: 2000, end_date: '2023-11-30', applicants_count: 5 },
      ];
      pool.query.mockResolvedValue({ rows: mockRows });

      // Act: Call the function
      await getScholarships(req, res);

      // Assert: Check if the response is correct
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRows);
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    it('should handle an empty scholarships list', async () => {
      // Arrange: Mock the database response with an empty array
      pool.query.mockResolvedValue({ rows: [] });

      // Act: Call the function
      await getScholarships(req, res);

      // Assert: Check if the response is correct
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange: Mock the database to throw an error
      const mockError = new Error('Database connection error');
      pool.query.mockRejectedValue(mockError);

      // Act: Call the function
      await getScholarships(req, res);

      // Assert: Check if the error is handled correctly
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ errMsg: 'Internal Server Error' });
    });

    it('should handle an invalid SQL query gracefully', async () => {
      // Arrange: Mock the database to throw an error for an invalid SQL query
      const mockError = new Error('Invalid SQL query');
      pool.query.mockRejectedValue(mockError);

      // Act: Call the function
      await getScholarships(req, res);

      // Assert: Check if the error is handled correctly
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ errMsg: 'Internal Server Error' });
    });

    it('should return an empty array if there are no scholarships in the database', async () => {
      // Arrange: Mock the database response with an empty array (no scholarships)
      pool.query.mockResolvedValue({ rows: [] });

      // Act: Call the function
      await getScholarships(req, res);

      // Assert: Check if the response is correct
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should handle malformed data in the database', async () => {
      // Arrange: Mock the database response with malformed data (e.g., missing `applicants_count`)
      const mockRows = [
        { scholarship_id: 1, scholarship_name: 'Scholarship A', amount: 1000, end_date: '2023-12-31' },
        { scholarship_id: 2, scholarship_name: 'Scholarship B', amount: 2000, end_date: '2023-11-30' }
      ];
      pool.query.mockResolvedValue({ rows: mockRows });

      // Act: Call the function
      await getScholarships(req, res);

      // Assert: Check if the response is correct even with missing fields
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRows);
    });


    it('should handle a large number of scholarships in the database', async () => {
      // Arrange: Mock the database response with a large dataset
      const mockRows = Array(1000).fill({
        scholarship_id: 1,
        scholarship_name: 'Scholarship A',
        amount: 1000,
        end_date: '2023-12-31',
        applicants_count: 10,
      });
      pool.query.mockResolvedValue({ rows: mockRows });

      // Act: Call the function
      await getScholarships(req, res);

      // Assert: Check if the response is correct
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRows);
    });

    it('should log when the function is entered and when an error occurs', async () => {
      // Arrange: Mock the database response to throw an error
      const mockError = new Error('Database connection error');
      pool.query.mockRejectedValue(mockError);

      // Mock console.log and console.error
      console.log = jest.fn();
      console.error = jest.fn();

      // Act: Call the function
      await getScholarships(req, res);

      // Assert: Check if the logs are correct
      expect(console.log).toHaveBeenCalledWith('Reached getScholarships');
      expect(console.error).toHaveBeenCalledWith('Error getting scholarship list:', mockError);
    });
  });
});
