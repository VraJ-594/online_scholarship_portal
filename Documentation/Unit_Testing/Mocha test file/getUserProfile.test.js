import { expect } from "chai";
import sinon from "sinon";
import { getUserProfile, updateUserProfile } from "../server/controller/getUserProfile.js";
import pool from "../server/config/db.js";

describe("getUserProfile", () => {
  let queryStub;

  beforeEach(() => {
    queryStub = sinon.stub(pool, "query");
  });

  afterEach(() => {
    queryStub.restore();
  });

  it("should return user profile when email and role are correct", async () => {
    queryStub.resolves({ rows: [{ email: "admin@example.com", username: "admin" }] });

    const req = { query: { email: "admin@example.com" } };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    await getUserProfile(req, res);

    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith({ email: "admin@example.com", username: "admin" })).to.be.true;
  });

  it("should return 404 if user is not found", async () => {
    queryStub.resolves({ rows: [] });

    const req = { query: { email: "nonexistent@example.com" } };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    await getUserProfile(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: "Admin user not found" })).to.be.true;
  });

  it("should handle database errors", async () => {
    queryStub.rejects(new Error("Database error"));

    const req = { query: { email: "admin@example.com" } };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    await getUserProfile(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWith({ error: "Internal Server Error" })).to.be.true;
  });



  describe("updateUserProfile", () => {
    it("should update username when valid email and name are provided", async () => {
      queryStub.resolves({ rowCount: 1 });

      const req = { body: { email: "admin@example.com", name: "newAdmin" } };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await updateUserProfile(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ message: "Username updated successfully" })).to.be.true;
    });

    it("should return 404 if user to update is not found", async () => {
      queryStub.resolves({ rowCount: 0 });

      const req = { body: { email: "nonexistent@example.com", name: "newAdmin" } };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await updateUserProfile(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: "Admin user not found" })).to.be.true;
    });

    it("should return 400 if email or name is missing", async () => {
      const req = { body: { email: "", name: "" } }; // Invalid input
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await updateUserProfile(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ error: "Email and Name are required" })).to.be.true;
    });

    it("should handle database errors gracefully", async () => {
      queryStub.rejects(new Error("Database error"));

      const req = { body: { email: "admin@example.com", name: "newAdmin" } };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await updateUserProfile(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ error: "Internal Server Error" })).to.be.true;
    });
  });
});
