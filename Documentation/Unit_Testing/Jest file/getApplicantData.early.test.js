
// Unit tests for: getApplicantData


const pool = require("../../config/db");
const { getApplicantData } = require('../../controller/getApplicantsData');
jest.mock("../../config/db");

describe('getApplicantData() getApplicantData method', () => {
  let req, res, mockQuery;

  beforeEach(() => {
    req = {
      query: {
        id: '123',
        scholarship_id: '456'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockQuery = pool.query;
  });

  // Happy Path Tests
  describe('Happy Path', () => {
    it('should return applicant data successfully', async () => {
      // Arrange
      const mockData = {
        rows: [
          {
            applicant_id: '123',
            first_name: 'John',
            middle_name: 'Doe',
            last_name: 'Smith',
            dob: '1990-01-01',
            gender: 'Male',
            category: 'General',
            email: 'john.doe@example.com',
            mobile_number: '1234567890',
            parent_name: 'Jane Doe',
            occupation: 'Engineer',
            income: 50000,
            parent_mobile: '0987654321',
            current_semester: 5,
            year_of_admission: 2015,
            address_id: '1',
            bank_account_no: '123456789012',
            college_id: '10',
            street_address: '123 Main St',
            pin_code: '123456',
            district_name: 'District A',
            department_name: 'Engineering',
            tuition_fees: 10000,
            non_tuition_fees: 2000,
            status: 'Applied'
          }
        ]
      };

      mockQuery.mockResolvedValue(mockData);

      // Act
      await getApplicantData(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: mockData.rows });
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    it('should handle no applicant data found', async () => {
      // Arrange
      const mockData = { rows: [] };
      mockQuery.mockResolvedValue(mockData);

      // Act
      await getApplicantData(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: [] });
    });

    it('should handle database query error', async () => {
      // Arrange
      const mockError = new Error('Database error');
      mockQuery.mockRejectedValue(mockError);

      // Act
      await getApplicantData(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ errMsg: 'Internal Server Error' });
    });

    it('should handle missing student_id in query', async () => {
      // Arrange
      req.query.id = undefined;

      // Act
      await getApplicantData(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ errMsg: 'Internal Server Error' });
    });

    it('should handle missing scholarship_id in query', async () => {
      // Arrange
      req.query.scholarship_id = undefined;

      // Act
      await getApplicantData(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ errMsg: 'Internal Server Error' });
    });
  });
});

// End of unit tests for: getApplicantData
