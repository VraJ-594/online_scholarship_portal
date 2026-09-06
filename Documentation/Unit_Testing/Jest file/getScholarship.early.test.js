
const { getScholarship } = require('../getScholarship');
const pool = require("../../config/db");
jest.mock("../../config/db");

describe('getScholarship() getScholarship method', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {
        scholarship_id: 1,
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  // Happy Path Tests
  describe('Happy Path', () => {
    it('should return scholarship data when a valid scholarship_id is provided', async () => {
      // Arrange
      const mockData = { scholarship_id: 1, name: 'Test Scholarship' };
      pool.query.mockResolvedValue({ rows: [mockData] });

      // Act
      await getScholarship(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM osp.Scholarships where scholarship_id = 1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    it('should handle no scholarship found for the given scholarship_id', async () => {
      // Arrange
      pool.query.mockResolvedValue({ rows: [] });

      // Act
      await getScholarship(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM osp.Scholarships where scholarship_id = 1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(undefined); // No data found
    });

    it('should handle database query errors gracefully', async () => {
      // Arrange
      const errorMessage = 'Database error';
      pool.query.mockRejectedValue(new Error(errorMessage));

      // Act
      await getScholarship(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM osp.Scholarships where scholarship_id = 1');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ errMsg: 'Internal Server Error' });
    });

    it('should handle invalid scholarship_id types gracefully', async () => {
      // Arrange
      req.params.scholarship_id = 'invalid_id'; // Non-numeric ID
      pool.query.mockResolvedValue({ rows: [] });

      // Act
      await getScholarship(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM osp.Scholarships where scholarship_id = invalid_id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(undefined); // No data found
    });

  });

  // Additional Edge Cases
  describe('Additional Edge Cases', () => {

    it('should return undefined if no data found for scholarship_id but no error occurs', async () => {
      // Arrange
      const scholarshipId = 999; // ID that doesn't exist
      req.params.scholarship_id = scholarshipId;
      pool.query.mockResolvedValue({ rows: [] }); // No matching scholarship

      // Act
      await getScholarship(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(`SELECT * FROM osp.Scholarships where scholarship_id = ${scholarshipId}`);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(undefined);
    });
  });

  

  // Test for logging and side effects
  describe('Logging and Error Handling', () => {
    it('should log an error message when a query fails', async () => {
      // Arrange
      const errorMessage = 'Database query failed';
      pool.query.mockRejectedValue(new Error(errorMessage));
      console.error = jest.fn(); // Mock console.error

      // Act
      await getScholarship(req, res);

      // Assert
      expect(console.error).toHaveBeenCalledWith('Error getting scholarship :', errorMessage);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ errMsg: 'Internal Server Error' });
    });
  });
});
