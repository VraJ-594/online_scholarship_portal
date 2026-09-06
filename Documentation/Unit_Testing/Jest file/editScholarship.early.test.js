const { editScholarship } = require('../editScholarship');
const pool = require("../../config/db");
jest.mock("../../config/db");

describe('editScholarship() editScholarship method', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { scholarship_id: '1' },
      body: {
        scholarshipName: 'Test Scholarship',
        amount: 1000,
        endDate: '2023-12-31',
        description: 'A test scholarship',
        educationLevel: 'Undergraduate',
        eligibleCourses: ['CS', 'Math'],
        minPercentage: 75,
        annualFamilyIncome: 50000,
        benefits: 'Full tuition',
        note: 'Apply before deadline',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('Happy Paths', () => {
    it('should update the scholarship successfully', async () => {
      // Mock the database query to simulate a successful update
      pool.query.mockResolvedValue({ rowCount: 1 });

      await editScholarship(req, res);

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), expect.any(Array));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Scholarship updated successfully',
        scholarship_id: '1',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should return 400 if any required field is missing', async () => {
      // Remove a required field from the request body
      delete req.body.scholarshipName;

      await editScholarship(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith('Please Input all the Fields');
    });

    it('should return 404 if the scholarship is not found', async () => {
      // Mock the database query to simulate no rows being updated
      pool.query.mockResolvedValue({ rowCount: 0 });

      await editScholarship(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith('Scholarship not found');
    });

    it('should return 500 on database error', async () => {
      // Mock the database query to throw an error
      pool.query.mockRejectedValue(new Error('Database error'));

      await editScholarship(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        errMsg: 'Internal Server Error',
      });
    });

    it('should handle large data input gracefully', async () => {
      // Simulate large data input
      req.body.scholarshipName = 'A'.repeat(1000); // 1000 characters
      req.body.description = 'B'.repeat(5000); // 5000 characters

      pool.query.mockResolvedValue({ rowCount: 1 });

      await editScholarship(req, res);

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), expect.any(Array));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Scholarship updated successfully',
        scholarship_id: '1',
      });
    });

    it('should allow optional fields to be null', async () => {
      // Set optional fields to null
      req.body.benefits = null;
      req.body.note = null;

      pool.query.mockResolvedValue({ rowCount: 1 });

      await editScholarship(req, res);

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([
        req.body.scholarshipName,
        req.body.amount,
        req.body.endDate,
        req.body.description,
        req.body.educationLevel,
        req.body.eligibleCourses,
        req.body.minPercentage,
        req.body.annualFamilyIncome,
        null, // Benefits as null
        null, // Note as null
        req.params.scholarship_id,
      ]));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Scholarship updated successfully',
        scholarship_id: '1',
      });
    });

    it('should return 400 if request body is empty', async () => {
      req.body = {}; // Empty body

      await editScholarship(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith('Please Input all the Fields');
    });
  });
});
