
// Unit tests for: getApplicantId

const { getApplicantId } = require('../getApplicantId');
const pool = require("../../config/db");
jest.mock("../../config/db");

describe('getApplicantId() getApplicantId method', () => {
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

  describe('Happy Paths', () => {
    it('should return applicant ID when email is found in the database', async () => {
      // Arrange: Mock the database response
      const mockResponse = { applicant_id: 123 };
      pool.query.mockResolvedValue({ rows: [mockResponse] });

      // Act: Call the function
      await getApplicantId(req, res);

      // Assert: Check if the response is correct
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ applicant: mockResponse });
    });
  });

  describe('Edge Cases', () => {
    it('should return 500 error when database query fails', async () => {
      // Arrange: Mock the database to throw an error
      pool.query.mockRejectedValue(new Error('Database error'));

      // Act: Call the function
      await getApplicantId(req, res);

      // Assert: Check if the error response is correct
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ errMsg: 'Internal Server Error' });
    });

    it('should return 200 with null applicant when email is not found', async () => {
      // Arrange: Mock the database response with no rows
      pool.query.mockResolvedValue({ rows: [] });

      // Act: Call the function
      await getApplicantId(req, res);

      // Assert: Check if the response is correct
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ applicant: undefined });
    });

    it('should handle missing email header gracefully', async () => {
      // Arrange: Remove email from headers
      req.headers.email = undefined;

      // Act: Call the function
      await getApplicantId(req, res);

      // Assert: Check if the response is correct
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ errMsg: 'Internal Server Error' });
    });
  });
});

// End of unit tests for: getApplicantId
