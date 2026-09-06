
// Unit tests for: handelclearpdf




const { handelclearpdf } = require('../handelclearpdf');
const pool = require("../../config/db");
jest.mock("../../config/db");

describe('handelclearpdf() handelclearpdf method', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {
        email: 'test@example.com',
        id: 'incomeCertificate',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('Happy Paths', () => {
    it('should clear the document successfully when a valid email and id are provided', async () => {
      // Arrange
      pool.query.mockResolvedValue({ rowCount: 1 });

      // Act
      await handelclearpdf(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [req.params.email]);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Document 'incomeCertificate' cleared successfully" });
    });
  });

  describe('Edge Cases', () => {
    it('should return 404 if no record is found for the given email', async () => {
      // Arrange
      pool.query.mockResolvedValue({ rowCount: 0 });

      // Act
      await handelclearpdf(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [req.params.email]);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "No record found for the given email" });
    });

    it('should return 500 if there is a server error during the query execution', async () => {
      // Arrange
      pool.query.mockRejectedValue(new Error('Database error'));

      // Act
      await handelclearpdf(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [req.params.email]);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Server error clearing document" });
    });


  });
});

// End of unit tests for: handelclearpdf
