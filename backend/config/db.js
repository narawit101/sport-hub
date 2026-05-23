const dns = require("node:dns");
const { Pool } = require("pg");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

function buildConnectionString() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  try {
    const parsed = new URL(databaseUrl);
    const hostOverride = process.env.PGHOST || process.env.DATABASE_HOST;
    const portOverride = process.env.PGPORT || process.env.DATABASE_PORT;
    const databaseOverride = process.env.PGDATABASE || process.env.DATABASE_NAME;
    const userOverride = process.env.PGUSER || process.env.DATABASE_USER;
    const passwordOverride =
      process.env.PGPASSWORD || process.env.DATABASE_PASSWORD;

    if (hostOverride) parsed.hostname = hostOverride;
    if (portOverride) parsed.port = portOverride;
    if (databaseOverride) parsed.pathname = `/${databaseOverride}`;
    if (userOverride) parsed.username = userOverride;
    if (passwordOverride) parsed.password = passwordOverride;

    return parsed.toString();
  } catch (error) {
    console.warn("[DB] Failed to parse DATABASE_URL, using raw value:", error.message);
    return databaseUrl;
  }
}

function getConnectionTarget(connectionString) {
  try {
    const parsed = new URL(connectionString);
    return `${parsed.hostname}:${parsed.port || "5432"}`;
  } catch {
    return "unknown-target";
  }
}

const connectionString = buildConnectionString();

const pool = new Pool({
  connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: isProduction ? 10 : 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected pool error:", err.message);
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("Database connection error:", err.stack);

    if (err.code === "ENETUNREACH") {
      console.error(
        "[DB] Hint: the database host resolved to an unreachable network address. " +
          "On Render, use an IPv4-capable Postgres host or set PGHOST/DATABASE_HOST to the provider's pooler hostname."
      );
    }

    if (err.code === "ENOTFOUND") {
      console.error(
        "[DB] Hint: the database hostname could not be resolved. Check DATABASE_URL and any PGHOST/DATABASE_HOST override."
      );
    }

    return;
  }

  console.log("Connected to PostgreSQL database");
  console.log("Running in", process.env.NODE_ENV || "development", "mode");
  console.log("[DB] Target:", getConnectionTarget(connectionString));

  release();
});

module.exports = pool;
