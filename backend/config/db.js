const { Pool } = require("pg");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: isProduction ? 10 : 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.connect((err) => {
  if (err) {
    console.error("Database connection error:", err.stack);
  } else {
    console.log("Connected to PostgreSQL database");
    console.log("Running in", process.env.NODE_ENV || "development", "mode");
  }
});

module.exports = pool;
