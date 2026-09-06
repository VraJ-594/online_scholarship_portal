import { expect } from "chai";
import sinon from "sinon";  
import pool from "../server/config/db.js";
import { statusUpdate } from "../server/controller/statusUpdate.js";


describe("statusUpdate Controller", () => {
  let req, res, queryStub;

  beforeEach(() => {
    // Mock request and response objects
    req = {
      body: {
        applicant_id: "12345",
        s_id: "sch-001",
        statusToUpdate: "Approved",
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

  it("should update the status and return a 200 response", async () => {
    // Mock successful database response
    queryStub.resolves({ rows: [] });

    await statusUpdate(req, res);

    expect(queryStub.calledOnce).to.be.true;
    expect(queryStub.firstCall.args[0]).to.include("UPDATE osp.applied_in");
    expect(queryStub.firstCall.args[1]).to.deep.equal([
      "Approved",
      "12345",
      "sch-001",
    ]);
    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith([])).to.be.true;
  });
  

  it("should return 500 if the database query fails", async () => {
    // Mock database error
    queryStub.rejects(new Error("Database error"));

    await statusUpdate(req, res);

    expect(queryStub.calledOnce).to.be.true;
    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWith({ errMsg: "Internal Server Error" })).to.be.true;
  });

  

  it("should return 200 but no rows affected if no matching records exist", async () => {
    // Simulate no rows updated in the database
    queryStub.resolves({ rows: [] });

    await statusUpdate(req, res);

    expect(queryStub.calledOnce).to.be.true;
    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith([])).to.be.true;
  });
});
