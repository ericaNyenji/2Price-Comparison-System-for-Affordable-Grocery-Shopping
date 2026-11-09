const mysql = require("mysql2/promise");

const fs = require("fs");
require("dotenv").config();

let pool;

async function initDB() {

  if (!pool) {
    const config = {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };

    if (process.env.DB_SSL === "true") {
      config.ssl = { ca: fs.readFileSync(__dirname + "/ca.pem") };
    }

    pool = mysql.createPool(config);
    console.log(
      `✅ MySQL pool created for ${config.host}:${config.port} (ssl: ${process.env.DB_SSL === "true"})`
    );
  }
  return pool;
}

async function getConnection() {
  const db = await initDB();
  return db;
}

module.exports = { getConnection };
