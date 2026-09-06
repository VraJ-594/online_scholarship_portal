const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },

  // host: "10.100.71.21",
  // port: 5432,
  // user: "202201106",
  // password: "Vraj@6610",
  // database: "202201106",
  // searchPath: ["osp"],
});

pool
  .connect()
  .then(() => {
    console.log("Database is successfully Connected");
  })
  .catch((err) => {
    console.error(err);
  });

module.exports = pool;
