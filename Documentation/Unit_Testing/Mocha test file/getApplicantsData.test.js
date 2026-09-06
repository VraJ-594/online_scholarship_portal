import { expect } from "chai";
import sinon from "sinon";
import { getApplicantData } from "../server/controller/getApplicantsData.js";
import pool from "../server/config/db.js";

describe("getApplicantData Controller", () => {
  let req, res, queryStub;

  beforeEach(() => {
    // Mock request and response objects
    req = {
      query: {
        id: "12345", // Example student_id
        scholarship_id: "sch-001", // Example scholarship_id
      },
    };

    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    // Stub the pool.query method
    queryStub = sinon.stub(pool, "query");
  });

  afterEach(() => {
    // Restore the stubbed method
    sinon.restore();
  });

  it("should return applicant data for valid query parameters", async () => {
    // Mocked database response
    const mockResponse = {
      rows: [
        {
          applicant_id: "12345",
          first_name: "John",
          middle_name: "Doe",
          last_name: "Smith",
          dob: "2000-01-01",
          gender: "Male",
          category: "General",
          email: "john.doe@example.com",
          mobile_number: "9876543210",
          parent_name: "Jane Smith",
          occupation: "Engineer",
          income: 500000,
          parent_mobile: "1234567890",
          current_semester: 5,
          year_of_admission: "2018",
          address_id: "add-001",
          bank_account_no: "111122223333",
          college_id: "col-001",
          street_address: "123 Main Street",
          pin_code: "123456",
          district_name: "Sample District",
          department_name: "Computer Science",
          tuition_fees: 50000,
          non_tuition_fees: 20000,
          status: "Approved",
        },
      ],
    };

    queryStub.resolves(mockResponse);

    await getApplicantData(req, res);

    expect(queryStub.calledOnce).to.be.true;
    expect(queryStub.firstCall.args[0]).to.include("SELECT"); // Check query execution
    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith({ data: mockResponse.rows })).to.be.true;
  });

  it("should return 500 if the database query fails", async () => {
    // Mocked database error
    const mockError = new Error("Database error");

    queryStub.rejects(mockError);

    await getApplicantData(req, res);

    expect(queryStub.calledOnce).to.be.true;
    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWith({ errMsg: "Internal Server Error" })).to.be.true;
  });

  it("should return 200 with empty data if no matching applicant is found", async () => {
    // Mocked empty database response
    const mockResponse = { rows: [] };

    queryStub.resolves(mockResponse);

    await getApplicantData(req, res);

    expect(queryStub.calledOnce).to.be.true;
    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith({ data: [] })).to.be.true;
  });

  
});
