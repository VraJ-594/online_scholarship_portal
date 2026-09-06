import { expect } from "chai";
import sinon from "sinon";
import { handelemail } from "../server/controller/handelemail.js";
import pool from "../server/config/db.js";




describe("handelemail Controller", () => {
  let req, res, queryStub;

  beforeEach(() => {
    req = { params: { email: "test@example.com" } }; // Mock request with email
    res = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub(),
    };
    queryStub = sinon.stub(pool, "query"); // Stub the database query method
  });

  afterEach(() => {
    sinon.restore(); // Restore stubs after each test
  });

  it("should return 200  if the email exists in the database", async () => {
    
    queryStub.resolves({ rows: [{ email: "test@example.com" }] });

    await handelemail(req, res);

    expect(queryStub.calledOnce).to.be.true; // Query should execute once
    expect(queryStub.firstCall.args).to.deep.equal([
      "SELECT * FROM osp.applicants WHERE email = $1",
      ["test@example.com"],
    ]);
    expect(res.status.calledWith(200)).to.be.true; // Should return status 200
    expect(res.send.calledWith("Email found")).to.be.true; // Should send "Email found"
  });

  it("should return 404  if the email does not exist in the database", async () => {
    // Mock database response
    queryStub.resolves({ rows: [] });

    await handelemail(req, res);

    expect(queryStub.calledOnce).to.be.true; // Query should execute once
    expect(res.status.calledWith(404)).to.be.true; // Should return status 404
    expect(res.send.calledWith("Email not found")).to.be.true; // Should send "Email not found"
  });

  it("should return 500 with 'Server error' if the database query fails", async () => {
    // Mock database error
    const mockError = new Error("Database error");
    queryStub.rejects(mockError);

    await handelemail(req, res);

    expect(queryStub.calledOnce).to.be.true; // Query should execute once
    expect(res.status.calledWith(500)).to.be.true; // Should return status 500
    expect(res.send.calledWith("Server error")).to.be.true; // Should send "Server error"
  });
});
