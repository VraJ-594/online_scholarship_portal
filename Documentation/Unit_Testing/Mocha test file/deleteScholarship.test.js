import { deleteScholarship } from "../server/controller/deleteScholarship.js"; // Update with your controller path
import { expect } from "chai";
import sinon from "sinon";
import pool from "../server/config/db.js"; 
describe("deleteScholarship", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("should delete a scholarship when a valid ID is provided", async () => {
    const req = {
      params: { scholarship_id: 123 },
    };

    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    // Simulate successful deletion
    sinon.stub(pool, "query").resolves({ rowCount: 1 });

    await deleteScholarship(req, res);

    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith({
      message: "Scholarship deleted successfully",
      scholarship_id: 123,
    })).to.be.true;
  });

  it("should return a 404 error when the scholarship ID is not found", async () => {
    const req = {
      params: { scholarship_id: 999 },
    };

    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    // Simulate no rows affected
    sinon.stub(pool, "query").resolves({ rowCount: 0 });

    await deleteScholarship(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith("Scholarship not found")).to.be.true;
  });

  it("should return a 500 error when a database error occurs", async () => {
    const req = {
      params: { scholarship_id: 123 },
    };

    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    // Simulate database error
    sinon.stub(pool, "query").rejects(new Error("Database connection error"));

    await deleteScholarship(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWith({
      errMsg: "Internal Server Error",
    })).to.be.true;
  });

  

  it("should log the correct messages to the console during deletion", async () => {
    const req = {
      params: { scholarship_id: 123 },
    };

    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    const consoleSpy = sinon.spy(console, "log");

    // Simulate successful deletion
    sinon.stub(pool, "query").resolves({ rowCount: 1 });

    await deleteScholarship(req, res);

    expect(consoleSpy.calledWith("Reached deleteScholarship")).to.be.true;
    expect(consoleSpy.calledWith("Deleted scholarship with ID: 123")).to.be.true;
  });
  it("should handle concurrent deletion attempts gracefully", async () => {
    const req1 = { params: { scholarship_id: 123 } };
    const req2 = { params: { scholarship_id: 123 } };
  
    const res1 = { status: sinon.stub().returnsThis(), json: sinon.spy() };
    const res2 = { status: sinon.stub().returnsThis(), json: sinon.spy() };
  
    sinon.stub(pool, "query")
      .onFirstCall().resolves({ rowCount: 1 })
      .onSecondCall().resolves({ rowCount: 0 });
  
    await Promise.all([deleteScholarship(req1, res1), deleteScholarship(req2, res2)]);
  
    expect(res1.status.calledWith(200)).to.be.true;
    expect(res2.status.calledWith(404)).to.be.true;
  });
  it("should return a 500 error when the database times out", async () => {
    const req = {
      params: { scholarship_id: 123 },
    };
  
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };
  
    sinon.stub(pool, "query").rejects(new Error("Query timeout"));
  
    await deleteScholarship(req, res);
  
    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWith({
      errMsg: "Internal Server Error",
    })).to.be.true;
  });
  //Simulate deleting a scholarship while another process re-inserts it.
  it("should handle concurrent deletion and re-insertion", async () => {
    const deleteReq = { params: { scholarship_id: 123 } };
    const insertReq = { body: { scholarship_id: 123, name: "New Scholarship" } };
  
    const deleteRes = { status: sinon.stub().returnsThis(), json: sinon.spy() };
    const insertRes = { status: sinon.stub().returnsThis(), json: sinon.spy() };
  
    sinon.stub(pool, "query")
      .onFirstCall().resolves({ rowCount: 1 }) // Deletion succeeds
      .onSecondCall().resolves({ rowCount: 1 }); // Re-insertion succeeds
  
    await Promise.all([
      deleteScholarship(deleteReq, deleteRes),
      pool.query("INSERT INTO osp.Scholarships (scholarship_id, name) VALUES ($1, $2)", [123, "New Scholarship"])
    ]);
  
    expect(deleteRes.status.calledWith(200)).to.be.true; // Deletion succeeds
  });
  
  

});
