// Unit tests for: getAppliedScholarships

const { getAppliedScholarships } = require('../getAppliedScholarships');
const pool = require("../../config/db");
jest.mock("../../config/db");

describe('getAppliedScholarships() getAppliedScholarships method', () => {
  let req, res;

  beforeEach(() => {
    req = {
      headers: {
        email: 'test@example.com',
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Happy Path Tests
  describe('Happy Paths', () => {
    it('should return a list of scholarships for a valid email', async () => {
      // Arrange
      const mockRows = [
        {
          scholarship_id: 1,
          scholarship_name: 'Scholarship A',
          amount: 1000,
          applied_date: '2023-01-01',
          status: 'approved',
          applicant_id: 1,
          end_date: '2023-12-31',
        },
      ];
      pool.query.mockResolvedValue({ rows: mockRows });

      // Act
      await getAppliedScholarships(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [req.headers.email]);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRows);
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    it('should handle no scholarships found for the given email', async () => {
      // Arrange
      pool.query.mockResolvedValue({ rows: [] });

      // Act
      await getAppliedScholarships(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [req.headers.email]);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should handle database query errors gracefully', async () => {
      // Arrange
      const mockError = new Error('Database error');
      pool.query.mockRejectedValue(mockError);

      // Act
      await getAppliedScholarships(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [req.headers.email]);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ errMsg: 'Internal Server Error' });
    });

    it('should handle missing email in headers', async () => {
      // Arrange
      req.headers.email = undefined;

      // Act
      await getAppliedScholarships(req, res);

      // Assert
      expect(pool.query).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ errMsg: 'Internal Server Error' });
    });

   

    it('should handle database connection issues gracefully', async () => {
      // Simulate a connection issue
      const mockError = new Error('Database connection error');
      pool.query.mockRejectedValue(mockError);

      // Act
      await getAppliedScholarships(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [req.headers.email]);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ errMsg: 'Internal Server Error' });
    });

    it('should handle a malformed SQL query gracefully', async () => {
      // Simulate a situation where the query is malformed
      pool.query.mockRejectedValueOnce(new Error('syntax error at or near "FROM"'));

      // Act
      await getAppliedScholarships(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [req.headers.email]);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ errMsg: 'Internal Server Error' });
    });
  });
});

// End of unit tests for: getAppliedScholarships
