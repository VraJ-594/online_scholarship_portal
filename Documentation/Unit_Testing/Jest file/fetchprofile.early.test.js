
// Unit tests for: fetchprofile



const pool = require("../../config/db");
const { fetchprofile } = require('../../controller/fetchprofile');
jest.mock("../../config/db");

describe('fetchprofile() fetchprofile method', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {
        email: 'test@example.com',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('Happy paths', () => {
    it('should return profile data when a valid email is provided', async () => {
      // Arrange: Mock the database response
      const mockData = [{
        first_name: 'John',
        middle_name: 'Doe',
        last_name: 'Smith',
        dob: '1990-01-01',
        gender: 'Male',
        category: 'General',
        email: 'test@example.com',
        mobileNumber: '1234567890',
        parent_name: 'Jane Doe',
        occupation: 'Engineer',
        parentMobile: '0987654321',
        incomelimit: 50000,
        village: 'Main Street',
        block: 'Central',
        state: 'StateName',
        pin: '123456',
        bankAccount: '123456789012',
        ifscCode: 'IFSC0001',
        bank_name: 'BankName',
        branch_name: 'BranchName',
        courseLevel: 'Undergraduate',
        courseName: 'Computer Science',
        tuitionFees: 10000,
        nonTuitionFees: 2000,
        class10Institute: 'High School',
        class10PassingDate: '2005-05-01',
        class10MarksObtained: 450,
        class10TotalMarks: 500,
        class12Institute: 'Senior School',
        class12PassingDate: '2007-05-01',
        class12MarksObtained: 470,
        class12TotalMarks: 500,
        currentEducationBatch: 2020,
        currentCgpaObtained: 8.5,
        currentCgpaTotal: 10,
        current_semester: 4,
      }];

      pool.query.mockResolvedValue({ rows: mockData });

      // Act: Call the function
      await fetchprofile(req, res);

      // Assert: Check the response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData[0]);
    });
  });

  describe('Edge cases', () => {
    it('should return 404 when no data is found for the given email', async () => {
      // Arrange: Mock the database response with no data
      pool.query.mockResolvedValue({ rows: [] });

      // Act: Call the function
      await fetchprofile(req, res);

      // Assert: Check the response
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Data not found' });
    });

    it('should handle database errors gracefully', async () => {
      // Arrange: Mock the database to throw an error
      pool.query.mockRejectedValue(new Error('Database error'));

      // Act: Call the function
      await fetchprofile(req, res);

      // Assert: Check that the response is not sent
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});

// End of unit tests for: fetchprofile
