 import { expect } from "chai";
import sinon from "sinon";
import bcrypt from "bcryptjs";
import pool from "../server/config/db.js";
import { registerUser } from "../server/controller/registerUser.js";


// const chai = require("chai");
// const sinon = require("sinon");
// const bcrypt = require("bcryptjs");
// const pool = require("../config/db");
// const { registerUser } = require("../path/to/registerUser");

const { expect } = chai;

describe("registerUser Controller", () => {
  let req, res, queryStub, bcryptStub;

  beforeEach(() => {
    // Mock request and response objects
    req = {
      body: {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        role: "user",
      },
    };

    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
      send: sinon.stub(),
    };

    // Stub the pool.query method
    queryStub = sinon.stub(pool, "query");

    // Stub bcrypt methods
    bcryptStub = {
      genSalt: sinon.stub(bcrypt, "genSalt"),
      hash: sinon.stub(bcrypt, "hash"),
    };
  });

  afterEach(() => {
    // Restore stubs
    sinon.restore();
  });

  it("should return 400 if required fields are missing", async () => {
    req.body = { email: "test@example.com", password: "password123" }; // Missing username

    await registerUser(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.send.calledWith(JSON.stringify("Please Input all the Feilds"))).to.be.true;
  });

  it("should return 400 if the user already exists", async () => {
    // Mock database response indicating a user exists
    queryStub.resolves({ rows: [{ id: 1, email: "test@example.com" }] });

    await registerUser(req, res);

    expect(queryStub.calledOnce).to.be.true;
    expect(queryStub.firstCall.args[0]).to.include("select * from osp.users where email");
    expect(res.status.calledWith(400)).to.be.true;
    expect(
      res.send.calledWith({
        success: false,
        message: "User already exists",
      })
    ).to.be.true;
  });

  it("should register a user successfully", async () => {
    // Mock database responses and bcrypt behavior
    queryStub.onCall(0).resolves({ rows: [] }); // No user exists
    queryStub.onCall(1).resolves(); // Insert user
    queryStub.onCall(2).resolves({
      rows: [{ id: 1, username: "testuser", email: "test@example.com", role: "user" }],
    });

    bcryptStub.genSalt.resolves("salt");
    bcryptStub.hash.resolves("hashedpassword");

    await registerUser(req, res);

    expect(queryStub.calledThrice).to.be.true;
    expect(queryStub.firstCall.args[0]).to.include("select * from osp.users where email");
    expect(queryStub.secondCall.args[0]).to.include("insert into osp.users");
    expect(queryStub.thirdCall.args[0]).to.include("select * from osp.users where username");

    expect(bcryptStub.genSalt.calledOnce).to.be.true;
    expect(bcryptStub.hash.calledOnce).to.be.true;

    expect(res.status.calledWith(201)).to.be.true;
    expect(
      res.json.calledWith({
        id: 1,
        username: "testuser",
        role: "user",
        email: "test@example.com",
      })
    ).to.be.true;
  });

  it("should return 400 if an error occurs during user registration", async () => {
    const mockError = new Error("Database error");
    queryStub.rejects(mockError);

    await registerUser(req, res);

    expect(queryStub.calledOnce).to.be.true;
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWith({ errMsg: "Something went wrong" })).to.be.true;
  });
});
