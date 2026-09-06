
// Unit tests for: getListOfScholarships




const { getListOfScholarships } = require('../ApplicantController');
const pool = require("../../config/db");
jest.mock("../../config/db", () => ({
  query: jest.fn(),
}));

describe('getListOfScholarships() getListOfScholarships method', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });
  

  describe('Happy paths', () => {
    it('should return a list of scholarships with correct data', async () => {
      // Arrange: Mock the database response
      const mockRows = [
        {
          id: 1,
          name: 'Scholarship A',
          numApplicants: 10,
          start_date: '2023-01-01',
          end_date: '2023-12-31',
          status: 'approved',
        },
        {
          id: 2,
          name: 'Scholarship B',
          numApplicants: 5,
          start_date: '2023-02-01',
          end_date: '2023-11-30',
          status: 'pending',
        },
      ];
      pool.query.mockResolvedValue({ rows: mockRows });

      // Act: Call the function
      await getListOfScholarships(req, res);

      // Assert: Check if the response is correct
      expect(res.json).toHaveBeenCalledWith(mockRows);
    });
  });

  describe('Edge cases', () => {
    it('should handle no scholarships in the database', async () => {
      // Arrange: Mock the database response with no rows
      pool.query.mockResolvedValue({ rows: [] });

      // Act: Call the function
      await getListOfScholarships(req, res);

      // Assert: Check if the response is an empty array
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should handle database query errors gracefully', async () => {
      // Arrange: Mock the database to throw an error
      const mockError = new Error('Database error');
      pool.query.mockRejectedValue(mockError);

      // Act: Call the function
      await getListOfScholarships(req, res);

      // Assert: Check if the error is handled and a 500 status is returned
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});

// End of unit tests for: getListOfScholarships
