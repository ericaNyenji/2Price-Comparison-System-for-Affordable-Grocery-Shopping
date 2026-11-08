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


//The most important thing to understand in this code is the difference between creating a database connection pool, getting the pool, and actually connecting to MySQL....................................Your code is designed to create a MySQL connection pool only once and reuse it throughout your application. How your code works: Your application -> Calls getConnection() -> getConnection() Calls initDB() -> initDB() Checks whether a pool already exists. -> No pool Create a pool. Pool exists Reuse it.->Return the pool. Your application can execute database queries.
//What exactly is a connection pool?Imagine your application has 100 users making database requests.Without a pool, your application might repeatedly create and close database connections.That is inefficient.A connection pool maintains reusable connections.
//????/IT'S LIKE A SWIMMING POOL WHERE USER CAN GET IN
//Importing the dependencie --> require() loads a Node.js module.(Node modules???)
const mysql = require("mysql2/promise");//"mysql2/promise" loads the MySQL2 library's Promise-based API.
//Why the /promise? MySQL operations are asynchronous. The Promise API allows us to use async/await instead of callbacks.
const fs = require("fs"); //fs stands for File System. fs is a built-in Node.js module that allows you to work with files. I use it HERE to read the SSL certificate:
require("dotenv").config();//loads environment variables from .env file into: process.env

let pool;//This is VERY important.You are declaring a variable called pool. Why declare it outside the function? Because you want the variable to be accessible to multiple function calls. Think of pool as a storage location that remembers your database pool

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
      config.ssl = { ca: fs.readFileSync(__dirname + "/ca.pem") };// // <-- Use your certificate(to connect to aiven)That ca.pem belongs to an Aiven MySQL instance........ fs.readFileSync()Reads the certificate file synchronously.
    }

    pool = mysql.createPool(config); //The code enters the if block and creates the pool.Now pool contains the MySQL connection pool object.......This creates a connection pool object.It does not establish all the actual database connections immediately.MySQL2 manages the connections as queries need them.Therefore, createPool() is synchronous: it returns the pool object immediately.
    console.log(
      `✅ MySQL pool created for ${config.host}:${config.port} (ssl: ${process.env.DB_SSL === "true"})`
    );
  }
  return pool;//Because this is an async function, JavaScript automatically wraps the returned value in a Promise.Conceptually:return Promise.resolve(pool);
}

// Helper function — returns a connection for each query
async function getConnection() {
  const db = await initDB();
  return db;
}

module.exports = { getConnection };
