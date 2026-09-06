
// Unit tests for: getApplicantsByScholarshipId


const { getApplicantsByScholarshipId } = require('../ApplicantController');
const pool = require("../../config/db");
jest.mock("../../config/db");

describe('getApplicantsByScholarshipId() getApplicantsByScholarshipId method', () => {
  let req, res;

  beforeEach(() => {
    req = { params: { id: '1' } }; // Default request object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('Happy paths', () => {
    it('should return a list of applicants for a valid scholarship ID', async () => {
      // Mock database response
      const mockApplicants = [
        {
          id: 1,
          student_name: 'John Doe',
          applied_date: '2023-01-01',
          end_date: '2023-12-31',
          status: 'approved',
        },
        {
          id: 2,
          student_name: 'Jane Smith',
          applied_date: '2023-02-01',
          end_date: '2023-12-31',
          status: 'pending',
        },
      ];
      pool.query.mockResolvedValue({ rows: mockApplicants });

      // Call the function
      await getApplicantsByScholarshipId(req, res);

      // Assertions
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['1']);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockApplicants);
    });
  });

  describe('Edge cases', () => {
    it('should handle no applicants found for a valid scholarship ID', async () => {
      // Mock database response with no applicants
      pool.query.mockResolvedValue({ rows: [] });

      // Call the function
      await getApplicantsByScholarshipId(req, res);

      // Assertions
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['1']);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should handle invalid scholarship ID', async () => {
      // Set invalid scholarship ID
      req.params.id = 'invalid-id';

      // Mock database response
      pool.query.mockResolvedValue({ rows: [] });

      // Call the function
      await getApplicantsByScholarshipId(req, res);

      // Assertions
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['invalid-id']);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should handle database query errors gracefully', async () => {
      // Mock database error
      const mockError = new Error('Database error');
      pool.query.mockRejectedValue(mockError);

      // Call the function
      await getApplicantsByScholarshipId(req, res);

      // Assertions
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['1']);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch applicants.' });
    });
  });
});

// End of unit tests for: getApplicantsByScholarshipId
