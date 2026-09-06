import { expect } from "chai";
import sinon from "sinon";
import { editScholarship } from "../server/controller/editScholarship.js"; // Adjust the path as needed
import pool from "../server/config/db.js";

describe("editScholarship", () => {
  let req, res, queryStub;

  beforeEach(() => {
    req = {
      params: { scholarship_id: 123 },
      body: {
        scholarshipName: "Updated Scholarship",
        amount: 5000,
        endDate: "2024-12-31",
        description: "Updated description",
        educationLevel: "Undergraduate",
        eligibleCourses: ["CS", "IT"],
        minPercentage: 85,
        annualFamilyIncome: 200000,
        benefits: "Free books and tuition",
        note: "Special consideration for low-income groups",
      },
    };

    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    queryStub = sinon.stub(pool, "query");
  });

  afterEach(() => {
    sinon.restore();
  });

  /**
   * 1. Test for successful update
   */
  it("should successfully update the scholarship", async () => {
    queryStub.resolves({ rowCount: 1 });

    await editScholarship(req, res);

    expect(queryStub.calledOnce).to.be.true;
    expect(queryStub.args[0][0]).to.include("UPDATE osp.Scholarships");
    expect(queryStub.args[0][1]).to.deep.equal([
      "Updated Scholarship",
      5000,
      "2024-12-31",
      "Updated description",
      "Undergraduate",
      ["CS", "IT"],
      85,
      200000,
      "Free books and tuition",
      "Special consideration for low-income groups",
      123,
    ]);
    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWithMatch({
      message: "Scholarship updated successfully",
      scholarship_id: 123,
    })).to.be.true;
  });

  /**
   * 2. Test for missing required fields
   */
  it("should return 400 if required fields are missing", async () => {
    req.body.scholarshipName = undefined; // Simulate missing required field

    await editScholarship(req, res);

    expect(queryStub.called).to.be.false; // Database shouldn't be queried
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWith("Please Input all the Fields")).to.be.true;
  });

  
  /**
   * 4. Test for empty fields in the body
   */
  it("should return 400 if a field in the body is empty", async () => {
    req.body.description = ""; // Simulate empty field

    await editScholarship(req, res);

    expect(queryStub.called).to.be.false; // Database shouldn't be queried
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWith("Please Input all the Fields")).to.be.true;
  });

  /**
   * 5. Test for invalid data types
   */
  it("should return 400 if a field has invalid data type", async () => {
    req.body.amount = "five thousand"; // Invalid amount

    await editScholarship(req, res);

    expect(queryStub.called).to.be.false; // Database shouldn't be queried
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWith("Invalid data provided")).to.be.true;
  });

  /**
   * 6. Test for scholarship not found
   */
  it("should return 404 if the scholarship ID does not exist", async () => {
    queryStub.resolves({ rowCount: 0 }); // Simulate no rows updated

    await editScholarship(req, res);

    expect(queryStub.calledOnce).to.be.true;
    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith("Scholarship not found")).to.be.true;
  });

  /**
   * 7. Test for database error
   */
  it("should handle database errors gracefully", async () => {
    queryStub.rejects(new Error("Database error")); // Simulate database failure

    await editScholarship(req, res);

    expect(queryStub.calledOnce).to.be.true;
    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({
      errMsg: "Internal Server Error",
    })).to.be.true;
  });

  /**
   * 8. Test for optional fields
   */
  it("should allow optional fields like note and benefits to be null", async () => {
    req.body.note = null;
    req.body.benefits = null;

    queryStub.resolves({ rowCount: 1 });

    await editScholarship(req, res);

    expect(queryStub.calledOnce).to.be.true;
    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWithMatch({
      message: "Scholarship updated successfully",
      scholarship_id: 123,
    })).to.be.true;
  });

  /**
   * 9. Test for large data input
   */
  it("should handle large data input gracefully", async () => {
    req.body.description = "A".repeat(10000); // Simulate a very large description

    queryStub.resolves({ rowCount: 1 });

    await editScholarship(req, res);

    expect(queryStub.calledOnce).to.be.true;
    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWithMatch({
      message: "Scholarship updated successfully",
      scholarship_id: 123,
    })).to.be.true;
  });
});
