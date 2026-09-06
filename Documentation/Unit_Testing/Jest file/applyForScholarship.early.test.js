// Unit tests for: applyForScholarship

const { applyForScholarship } = require('../applyForScholarship');
const pool = require("../../config/db");
jest.mock("../../config/db");

describe('applyForScholarship() applyForScholarship method', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        scholarship_id: 'SCH12345',
        applicant_id: 'APP67890',
        applied_date: '2023-10-01',
        status: 'pending',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  // Happy Path Tests
  describe('Happy Paths', () => {
    it('should successfully insert application and return a success message', async () => {
      // Mock the database query to resolve successfully
      pool.query.mockResolvedValueOnce({ rowCount: 1 });

      await applyForScholarship(req, res);

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([req.body.scholarship_id, req.body.applicant_id, req.body.applied_date, req.body.status])
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Application added successfully',
        scholarship_id: req.body.scholarship_id,
      });
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    it('should return 400 if any required field is missing', async () => {
      req.body.scholarship_id = null; // Simulate missing field

      await applyForScholarship(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith('Please Input all the Fields');
    });

    it('should handle database errors gracefully', async () => {
      // Mock the database query to reject with an error
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await applyForScholarship(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        errMsg: 'Internal Server Error',
        errCode: 23505,
      });
    });


    it('should handle database constraint violation (e.g., duplicate application)', async () => {
      // Simulate a unique constraint violation (e.g., the application already exists)
      const mockError = new Error('duplicate key value violates unique constraint');
      mockError.code = '23505'; // PostgreSQL error code for unique violation
      pool.query.mockRejectedValueOnce(mockError);

      await applyForScholarship(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        errMsg: 'Internal Server Error',
        errCode: 23505,
      });
    });

    it('should log the error when a constraint violation occurs', async () => {
      // Simulate a unique constraint violation (duplicate application)
      const mockError = new Error('duplicate key value violates unique constraint');
      mockError.code = '23505'; // PostgreSQL error code for unique violation
      pool.query.mockRejectedValueOnce(mockError);

      // Mock console.error
      console.error = jest.fn();

      await applyForScholarship(req, res);

      // Assert that the error is logged
      expect(console.error).toHaveBeenCalledWith('Error inserting Application:', mockError.message);
    });

    it('should return 400 for invalid scholarship_id or applicant_id format', async () => {
      req.body.scholarship_id = 'invalid-format'; // Invalid format
      req.body.applicant_id = ''; // Empty applicant ID

      await applyForScholarship(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith('Please Input all the Fields');
    });

    it('should handle missing database fields gracefully', async () => {
      // Simulate missing columns in the response (e.g., missing 'rowCount')
      pool.query.mockResolvedValueOnce({});

      await applyForScholarship(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        errMsg: 'Internal Server Error',
      });
    });
  });
});
