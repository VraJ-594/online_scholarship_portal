const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Required by node-postgres: an error on an otherwise-idle client (e.g. the
// pooler dropping a connection) is emitted here. Without this handler it is
// an uncaught 'error' event that crashes the whole process.
pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client:", err);
});

pool
  .connect()
  .then((client) => {
    console.log("Database is successfully Connected");
    client.release();
  })
  .catch((err) => {
    console.error(err);
  });

module.exports = pool;
