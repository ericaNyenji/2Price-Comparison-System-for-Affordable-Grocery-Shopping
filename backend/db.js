// // const mysql = require('mysql2/promise');
// // require('dotenv').config();

// // const connection = mysql.createPool({
// //   host: process.env.DB_HOST,
// //   user: process.env.DB_USER,
// //   password: process.env.DB_PASSWORD,
// //   database: process.env.DB_NAME,
// // });

// // // Test the connection
// // const testConnection = async () => {
// //   try {
// //     const conn = await connection.getConnection();
// //     console.log('✅ Database connection successful');
// //     conn.release();
// //   } catch (err) {
// //     console.error('❌ Database connection failed:', err);
// //   }
// // };

// // testConnection();

// // module.exports = connection;

// const { Pool } = require('pg');//This version uses Neon’s connection string (DATABASE_URL) from my .env.
// require('dotenv').config();

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false, // required by Neon
//   },
// });

// (async () => {
//   try {
//     const client = await pool.connect();
//     console.log('✅ Connected to PostgreSQL (Neon)');
//     client.release();
//   } catch (err) {
//     console.error('❌ Database connection failed:', err);
//   }
// })();

// module.exports = pool;


//Importing the dependencie --> require() loads a Node.js module.(Node modules???)
const mysql = require("mysql2/promise");//"mysql2/promise" loads the MySQL2 library's Promise-based API.
//Why the /promise? MySQL operations are asynchronous. The Promise API allows us to use async/await instead of callbacks.
const fs = require("fs");
require("dotenv").config();

let pool;

async function initDB() {//....why doesn't this function have await....why doesnt this function return a promise? it should be async and return a promise that resolves to the pool.????????

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

    // Local MySQL: leave DB_SSL unset or false (no TLS).
    // Hosted Aiven MySQL: set DB_SSL=true to verify against ca.pem.
    if (process.env.DB_SSL === "true") {
      config.ssl = { ca: fs.readFileSync(__dirname + "/ca.pem") };// // <-- Use your certificate(to connect to aiven)That ca.pem belongs to an Aiven MySQL instance
    }

    pool = mysql.createPool(config);
    console.log(
      `✅ MySQL pool created for ${config.host}:${config.port} (ssl: ${process.env.DB_SSL === "true"})`
    );
  }
  return pool;
}

// Helper function — returns a connection for each query
async function getConnection() {
  const db = await initDB();
  return db;
}

module.exports = { getConnection };
