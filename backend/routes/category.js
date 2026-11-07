const express = require('express');
const router = express.Router();
//const db = require('../db');
const { getConnection } = require("../db");//AIVEN MYSQL

router.get('/', async (req, res) => {
    try {
      const db = await getConnection();//AIVEN MYSQL
      const query = 'SELECT * FROM categories';
  
      // Fetch categories from the database
      const [results] = await db.query(query);
  
      // Send the categories as a JSON response
      res.json({ data: results });//{ "data": ["Beverages", "Dairy", "Cereals"] }....the final JSON payload sent to the client will look like this:
   //.json({...}): Serializes the provided JavaScript object into a JSON string and sends it as the response body while automatically setting the Content-Type header to application/json.
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });//The provided line of code sets the HTTP response status code to 500 (Internal Server Error) and sends a JSON payload containing a generic error message back to the client. This syntax is standard in Node.js backend frameworks like Express.js
    //• res: The response object used to send data back to the client.
   // • .status(500): Sets the HTTP status code to 500, which tells the client that something went wrong on the server side.
    }
  });

  module.exports = router;
//   {
//     "data": [
//       {
//         "category_id": 2,
//         "category_name": "Beverages"
//       }
//    }
  