const express = require("express");
const router = express.Router();
//const db = require("../db"); 
const { getConnection } = require("../db");

router.get("/", async (req, res) => {
  try {
    const db = await getConnection();//AIVEN MYSQL
    const [categories] = await db.query("SELECT * FROM categories");//const [categories] = [  ["Beverages", "Dairy", "Cereals"],  metadata  ]...nested array that looks like thi

    const exploreData = [];

    for (const category of categories) {
      const [products] = await db.query(
        `SELECT DISTINCT 
           p.product_id, p.product_name, p.image_path
         FROM products p
         WHERE p.category_id = ?`,
        [category.category_id]
      );

      exploreData.push({
        category_id: category.category_id,
        category_name: category.category_name,
        products
      });
    }

    res.json(exploreData);//;//{ "data": ["Beverages", "Dairy", "Cereals"] }....the final JSON payload sent to the client will look like this:
    // .json({...}): Serializes the provided JavaScript object into a JSON string and sends it as the response body while automatically setting the Content-Type header to application/json.
  } catch (err) {
    console.error("Error fetching explore data:", err);
    res.status(500).json({ error: "Server error" }); //The provided line of code sets the HTTP response status code to 500 (Internal Server Error) and sends a JSON payload containing a generic error message back to the client. This syntax is standard in Node.js backend frameworks like Express.js
    //• res: The response object used to send data back to the client.
   // • .status(500): Sets the HTTP status code to 500, which tells the client that something went wrong on the server side.
  }
});

module.exports = router;




