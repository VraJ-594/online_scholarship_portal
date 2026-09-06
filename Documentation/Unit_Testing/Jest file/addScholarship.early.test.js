
// Unit tests for: addScholarship




const { addScholarship } = require('../addScholarship');
const pool = require("../../config/db");
jest.mock("../../config/db");

describe('addScholarship() addScholarship method', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        scholarship_name: 'Test Scholarship',
        amount: 1000,
        end_date: '2023-12-31',
        description: 'A test scholarship',
        education_level: 'Undergraduate',
        eligible_courses: ['CS101', 'MATH202'],
        min_percentage: 75,
        annual_family_income: 50000,
        benefits: 'Full tuition',
        note: 'Test note',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    pool.query.mockClear();
  });

  describe('Happy Paths', () => {
    it('should add a scholarship successfully', async () => {
      // Mock the database response
      pool.query.mockResolvedValueOnce({ rows: [{ scholarship_id: 'SCH12345' }] });

      // Call the function
      await addScholarship(req, res);

      // Check if the database query was called with correct parameters
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [
        req.body.scholarship_name,
        req.body.amount,
        req.body.end_date,
        req.body.description,
        req.body.education_level,
        req.body.eligible_courses,
        req.body.min_percentage,
        req.body.annual_family_income,
        req.body.benefits,
        req.body.note,
      ]);

      // Check if the response was sent with status 200
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Scholarship added successfully',
        scholarship_id: 'SCH12345',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should return 400 if any required field is missing', async () => {
      // Remove a required field
      delete req.body.scholarship_name;

      // Call the function
      await addScholarship(req, res);

      // Check if the response was sent with status 400
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith('Please Input all the Fields');
    });

    it('should handle database errors gracefully', async () => {
      // Mock a database error
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      // Call the function
      await addScholarship(req, res);

      // Check if the response was sent with status 500
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        errMsg: 'Internal Server Error',
      });
    });

    it('should handle empty eligible_courses array', async () => {
      // Set eligible_courses to an empty array
      req.body.eligible_courses = [];

      // Mock the database response
      pool.query.mockResolvedValueOnce({ rows: [{ scholarship_id: 'SCH12345' }] });

      // Call the function
      await addScholarship(req, res);

      // Check if the response was sent with status 200
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Scholarship added successfully',
        scholarship_id: 'SCH12345',
      });
    });
  });
});

// End of unit tests for: addScholarship
