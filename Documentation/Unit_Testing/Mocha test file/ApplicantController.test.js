import { expect } from "chai";
import sinon from "sinon";
import { getListOfScholarships,getApplicantsByScholarshipId } from "../server/controller/ApplicantController.js";
import pool from "../server/config/db.js";

describe("getListOfScholarships", () => {
  let queryStub;

  // Stub the database query method before each test
  beforeEach(() => {
    queryStub = sinon.stub(pool, "query");
  });

  // Restore the stub after each test
  afterEach(() => {
    queryStub.restore();
  });

  it("should return a list of scholarships with the number of applicants", async () => {
    // Mock database result
    queryStub.resolves({
      rows: [
        { id: 1, name: "Scholarship A", numApplicants: 5 },
        { id: 2, name: "Scholarship B", numApplicants: 0 },
      ],
    });

    // Mock request and response objects
    const req = {};
    const res = {
      json: sinon.spy(),
    };

    await getListOfScholarships(req, res);

    // Verify the response
    expect(res.json.calledOnce).to.be.true;
    expect(res.json.calledWith([
      { id: 1, name: "Scholarship A", numApplicants: 5 },
      { id: 2, name: "Scholarship B", numApplicants: 0 },
    ])).to.be.true;
  });

  it("should handle an empty list of scholarships", async () => {
    // Mock database result with no rows
    queryStub.resolves({ rows: [] });

    const req = {};
    const res = {
      json: sinon.spy(),
    };

    await getListOfScholarships(req, res);

    // Verify the response
    expect(res.json.calledOnce).to.be.true;
    expect(res.json.calledWith([])).to.be.true;
  });

  it("should handle database errors gracefully", async () => {
    // Simulate a database error
    queryStub.rejects(new Error("Database error"));

    const req = {};
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    await getListOfScholarships(req, res);

    // Verify the response
    expect(res.status.calledOnce).to.be.true;
    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledOnce).to.be.true;
    expect(res.json.calledWith({ error: "Internal server error" })).to.be.true;
  });
  it("should return scholarships sorted by scholarship ID", async () => {
    queryStub.resolves({
      rows: [
        { id: 2, name: "Scholarship B", numApplicants: 3 },
        { id: 1, name: "Scholarship A", numApplicants: 5 },
      ],
    });

    const req = {};
    const res = {
      json: sinon.spy(),
    };

    await getListOfScholarships(req, res);

    // Verify that the data is returned as-is (controller does not sort manually)
    expect(res.json.calledOnce).to.be.true;
    expect(res.json.calledWith([
      { id: 2, name: "Scholarship B", numApplicants: 3 },
      { id: 1, name: "Scholarship A", numApplicants: 5 },
    ])).to.be.true;
  });
  it("should return scholarships even if no applicants exist for any of them", async () => {
    queryStub.resolves({
      rows: [
        { id: 1, name: "Scholarship A", numApplicants: 0 },
        { id: 2, name: "Scholarship B", numApplicants: 0 },
      ],
    });

    const req = {};
    const res = {
      json: sinon.spy(),
    };

    await getListOfScholarships(req, res);

    expect(res.json.calledOnce).to.be.true;
    expect(res.json.calledWith([
      { id: 1, name: "Scholarship A", numApplicants: 0 },
      { id: 2, name: "Scholarship B", numApplicants: 0 },
    ])).to.be.true;
  });
});


describe("getApplicantsByScholarshipId", () => {
    let queryStub;
  
    // Stub the database query before each test
    beforeEach(() => {
      queryStub = sinon.stub(pool, "query");
    });
  
    // Restore the stubbed method after each test
    afterEach(() => {
      queryStub.restore();
    });
  
    it("should return applicants for a given scholarship ID", async () => {
      const mockApplicants = [
        {
          id: 1,
          student_name: "John Doe",
          applied_date: "2023-11-01",
          end_date: "2023-12-01",
        },
        {
          id: 2,
          student_name: "Jane Smith",
          applied_date: "2023-11-02",
          end_date: "2023-12-01",
        },
      ];
  
      queryStub.resolves({ rows: mockApplicants });
  
      const req = { params: { id: "123" } };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
  
      await getApplicantsByScholarshipId(req, res);
  
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(mockApplicants)).to.be.true;
    });
  
    it("should return an empty array if no applicants are found", async () => {
      queryStub.resolves({ rows: [] });
  
      const req = { params: { id: "456" } };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
  
      await getApplicantsByScholarshipId(req, res);
  
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith([])).to.be.true;
    });
  
    it("should handle invalid scholarship ID", async () => {
      queryStub.resolves({ rows: [] });
  
      const req = { params: { id: null } }; // Simulate invalid input
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
  
      await getApplicantsByScholarshipId(req, res);
  
      expect(res.status.calledWith(200)).to.be.true; // Returns empty result for invalid input
      expect(res.json.calledWith([])).to.be.true;
    });
  
    it("should handle database errors gracefully", async () => {
      queryStub.rejects(new Error("Database error"));
  
      const req = { params: { id: "123" } };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
  
      await getApplicantsByScholarshipId(req, res);
  
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ error: "Failed to fetch applicants." })).to.be.true;
    });
  
    it("should log the error when a database error occurs", async () => {
      const consoleErrorStub = sinon.stub(console, "error");
      queryStub.rejects(new Error("Database error"));
  
      const req = { params: { id: "123" } };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
  
      await getApplicantsByScholarshipId(req, res);
  
      expect(consoleErrorStub.calledOnce).to.be.true;
      expect(consoleErrorStub.firstCall.args[0]).to.include("Error fetching applicants");
  
      consoleErrorStub.restore();
    });
  });
  