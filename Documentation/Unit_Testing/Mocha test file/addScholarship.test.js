// import { expect } from "chai";
// import sinon from "sinon";
// import pool from "../server/config/db.js";
// import { addScholarship } from "../server/controller/addScholarship.js";

// describe("addScholarship", () => {
//   let queryStub;

//   // Stub the database query before each test
//   beforeEach(() => {
//     queryStub = sinon.stub(pool, "query");
//   });

//   // Restore the stubbed method after each test
//   afterEach(() => {
//     queryStub.restore();
//   });
//   it("should add a scholarship when all fields are valid", async () => {
//     queryStub.resolves({ rows: [{ scholarship_id: "SCH12345" }] });
  
//     const req = {
//       body: {
//         scholarship_name: "Test Scholarship",
//         amount: 5000,
//         end_date: "2024-12-31",
//         description: "Scholarship for testing purposes",
//         education_level: "Undergraduate",
//         eligible_courses: "Computer Science",
//         min_percentage: 75,
//         annual_family_income: 300000,
//         benefits: "Full tuition coverage",
//         note: "No special note",
//       },
//     };
  
//     const res = {
//       status: sinon.stub().returnsThis(),
//       json: sinon.spy(),
//     };
  
//     await addScholarship(req, res);
  
//     expect(res.status.calledWith(200)).to.be.true;
//     expect(
//       res.json.calledWith({
//         message: "Scholarship added successfully",
//         scholarship_id: "SCH12345",
//       })
//     ).to.be.true;
//   });
//   it("should return a 400 error when required fields are missing", async () => {
//     const req = {
//       body: {
//         description: "Missing required fields test", // Required fields are missing
//       },
//     };
  
//     const res = {
//       status: sinon.stub().returnsThis(),
//       json: sinon.spy(),
//     };
  
//     await addScholarship(req, res);
  
//     expect(res.status.calledWith(400)).to.be.true;
//     expect(res.json.calledWith("Please Input all the Fields")).to.be.true;
//   });
//   it("should return an error when minimum percentage is out of bounds", async () => {
//     const req = {
//       body: {
//         scholarship_name: "Percentage Test",
//         amount: 5000,
//         end_date: "2024-12-31",
//         description: "Testing min percentage bounds",
//         education_level: "Graduate",
//         eligible_courses: "Biology",
//         min_percentage: 150, // Invalid percentage
//         annual_family_income: 400000,
//         benefits: "Tuition and lodging",
//         note: "Out of bounds percentage test",
//       },
//     };
  
//     const res = {
//       status: sinon.stub().returnsThis(),
//       json: sinon.spy(),
//     };
  
//     await addScholarship(req, res);
  
//     expect(res.status.calledWith(400)).to.be.true;
//     expect(res.json.calledWith("Minimum percentage must be between 0 and 100")).to.be.true;
//   });
//   it("should return an error when annual family income is negative", async () => {
//     const req = {
//       body: {
//         scholarship_name: "Negative Income Test",
//         amount: 2000,
//         end_date: "2025-01-01",
//         description: "Testing negative income validation",
//         education_level: "Postgraduate",
//         eligible_courses: "Physics",
//         min_percentage: 85,
//         annual_family_income: -10000, // Invalid negative income
//         benefits: "Full support",
//         note: "Negative income edge case",
//       },
//     };
  
//     const res = {
//       status: sinon.stub().returnsThis(),
//       json: sinon.spy(),
//     };
  
//     await addScholarship(req, res);
  
//     expect(res.status.calledWith(400)).to.be.true;
//     expect(res.json.calledWith("Annual family income cannot be negative")).to.be.true;
//   });
//   it("should handle database errors gracefully", async () => {
//     queryStub.rejects(new Error("Database error"));
  
//     const req = {
//       body: {
//         scholarship_name: "Database Error Test",
//         amount: 1000,
//         end_date: "2024-06-30",
//         description: "Testing database errors",
//         education_level: "Postgraduate",
//         eligible_courses: "Engineering",
//         min_percentage: 80,
//         annual_family_income: 400000,
//         benefits: "Partial tuition coverage",
//         note: "Database error edge case",
//       },
//     };
  
//     const res = {
//       status: sinon.stub().returnsThis(),
//       json: sinon.spy(),
//     };
  
//     await addScholarship(req, res);
  
//     expect(res.status.calledWith(500)).to.be.true;
//     expect(res.json.calledWith({ errMsg: "Internal Server Error" })).to.be.true;
//   });
//   it("should handle invalid input data types", async () => {
//     const req = {
//       body: {
//         scholarship_name: "Invalid Scholarship",
//         amount: "invalid_amount", // Invalid data type (should be a number)
//         end_date: "2024-06-30",
//         description: "Invalid data test",
//         education_level: "Graduate",
//         eligible_courses: "Mathematics",
//         min_percentage: "invalid_percentage", // Invalid data type (should be a number)
//         annual_family_income: "invalid_income", // Invalid data type (should be a number)
//         benefits: "Books and supplies",
//         note: "Invalid input edge case",
//       },
//     };

//     const res = {
//       status: sinon.stub().returnsThis(),
//       json: sinon.spy(),
//     };

//     await addScholarship(req, res);

//     expect(res.status.calledWith(400)).to.be.true;
//     expect(res.json.calledWith("Invalid input data types")).to.be.true;
//     expect(queryStub.notCalled).to.be.true;
//   });

//   it("should return an error when scholarship amount is 0", async () => {
//     const req = {
//       body: {
//         scholarship_name: "Zero Amount Test",
//         amount: 0, // Invalid: amount is zero
//         end_date: "2024-10-10",
//         description: "Testing zero scholarship amount",
//         education_level: "Masters",
//         eligible_courses: "Finance",
//         min_percentage: 85,
//         annual_family_income: 200000,
//         benefits: "Special assistance",
//         note: "Zero amount test case",
//       },
//     };
  
//     const res = {
//       status: sinon.stub().returnsThis(),
//       json: sinon.spy(),
//     };
  
//     await addScholarship(req, res);
  
//     expect(res.status.calledWith(400)).to.be.true;
//     expect(
//       res.json.calledWith("Invalid scholarship amount: must be greater than 0")
//     ).to.be.true;
//   });
//   it("should handle very large scholarship amounts", async () => {
//     queryStub.resolves({ rows: [{ scholarship_id: "SCH99999" }] });
  
//     const req = {
//       body: {
//         scholarship_name: "Large Amount Scholarship",
//         amount: 1000000000, // Very large amount
//         end_date: "2025-12-31",
//         description: "Testing large scholarship amounts",
//         education_level: "PhD",
//         eligible_courses: "Medicine",
//         min_percentage: 90,
//         annual_family_income: 1000000,
//         benefits: "Full tuition and stipend",
//         note: "Large amount edge case",
//       },
//     };
  
//     const res = {
//       status: sinon.stub().returnsThis(),
//       json: sinon.spy(),
//     };
  
//     await addScholarship(req, res);
  
//     expect(res.status.calledWith(200)).to.be.true;
//     expect(
//       res.json.calledWith({
//         message: "Scholarship added successfully",
//         scholarship_id: "SCH99999",
//       })
//     ).to.be.true;
//   });
//   it("should log errors to the console on database failure", async () => {
//     const consoleErrorStub = sinon.stub(console, "error");
//     queryStub.rejects(new Error("Database error"));
  
//     const req = {
//       body: {
//         scholarship_name: "Console Log Test",
//         amount: 3000,
//         end_date: "2024-08-20",
//         description: "Console logging test",
//         education_level: "Diploma",
//         eligible_courses: "Design",
//         min_percentage: 70,
//         annual_family_income: 450000,
//         benefits: "Full coverage",
//         note: "Logging edge case",
//       },
//     };
  
//     const res = {
//       status: sinon.stub().returnsThis(),
//       json: sinon.spy(),
//     };
  
//     await addScholarship(req, res);
  
//     expect(consoleErrorStub.calledOnce).to.be.true;
//     expect(consoleErrorStub.firstCall.args[0]).to.include(
//       "Error inserting scholarship"
//     );
  
//     consoleErrorStub.restore();
//   });
          
 
// });



import { expect } from "chai";
import sinon from "sinon";
import pool from "../server/config/db.js";
import { addScholarship } from "../server/controller/addScholarship.js";


// Mock the database pool
const mockPool = sinon.stub(pool, 'query');

// Helper function to mock response
const mockResponse = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
};

describe('addScholarship() addScholarship method', () => {
  let req;
  let res;

  beforeEach(() => {
    // Reset mocks before each test
    sinon.resetHistory();

    // Mock request object
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

    // Initialize mock response
    res = mockResponse();
  });

  // Happy path tests
  describe('Happy Paths', () => {
    it('should add a scholarship successfully with valid input', async () => {
      // Mock successful database query
      mockPool.resolves({ rows: [{ scholarship_id: 'SCH12345' }] });

      // Call the function
      await addScholarship(req, res);

      // Assertions
      expect(mockPool.calledOnce).to.be.true;
      expect(mockPool.args[0]).to.be.an('array').that.is.not.empty;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({
        message: 'Scholarship added successfully',
        scholarship_id: 'SCH12345',
      })).to.be.true;
    });
  });

  // Edge case tests
  describe('Edge Cases', () => {
    it('should return 400 if any required field is missing', async () => {
      // Remove a required field
      delete req.body.scholarship_name;

      // Call the function
      await addScholarship(req, res);

      // Assertions
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith('Please Input all the Fields')).to.be.true;
    });

    it('should handle database errors gracefully', async () => {
      // Mock a database error
      mockPool.rejects(new Error('Database error'));

      // Call the function
      await addScholarship(req, res);

      // Assertions
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({
        errMsg: 'Internal Server Error',
      })).to.be.true;
    });

    it('should handle empty eligible_courses array', async () => {
      // Set eligible_courses to an empty array
      req.body.eligible_courses = [];

      // Mock successful database query
      mockPool.resolves({ rows: [{ scholarship_id: 'SCH12345' }] });

      // Call the function
      await addScholarship(req, res);

      // Assertions
      expect(mockPool.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({
        message: 'Scholarship added successfully',
        scholarship_id: 'SCH12345',
      })).to.be.true;
    });
  });
});
