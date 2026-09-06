
// Unit tests for: statusUpdate
;
const pool = require("../../config/db");
const { statusUpdate } = require('../../controller/statusUpdate');
// Import necessary modules
// Mock the pool.query method
jest.mock("../../config/db", () => ({
  query: jest.fn(),
}));

describe('statusUpdate() statusUpdate method', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks before each test
    pool.query.mockReset();

    // Mock request and response objects
    req = {
      body: {
        applicant_id: 1,
        s_id: 1,
        statusToUpdate: 'approved',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  // Happy Path Tests
  describe('Happy Paths', () => {
    it('should update status successfully and return 200 with response rows', async () => {
      // Arrange: Mock the database response
      const mockResponse = { rows: [{ success: true }] };
      pool.query.mockResolvedValue(mockResponse);

      // Act: Call the statusUpdate function
      await statusUpdate(req, res);

      // Assert: Check if the response is as expected
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['approved', 1, 1]);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse.rows);
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    it('should handle database errors gracefully and return 500', async () => {
      // Arrange: Mock a database error
      pool.query.mockRejectedValue(new Error('Database error'));

      // Act: Call the statusUpdate function
      await statusUpdate(req, res);

      // Assert: Check if the error is handled correctly
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['approved', 1, 1]);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ errMsg: 'Internal Server Error' });
    });

  })
});

// End of unit tests for: statusUpdate
