const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");
const app = express();
const multer = require("multer");

const port = 3000;

app.use(bodyParser.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

const dbConfig = {
  host: "127.0.0.1",
  port: "3306",
  user: "root",
  password: "root",
  database: "angler",
};

app.post("/admin", async (req, res) => {
  try {
    const { username, password } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT * FROM users WHERE role = 'admin'"
    );
    if (rows.length > 0) {
      await connection.end();
      return res.json({ message: "Admin already exists" });
    }
    await connection.execute(
      "INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')",
      [username, password]
    );
    await connection.end();
    res.json({ message: "Admin created successfully" });
  } catch (error) {
    res.json({ message: "Database error", error });
  }
});

app.post("/customers", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (username === null || username === undefined || username === "") {
      return res.json({
        message: "Username is empty",
      });
    }
    if (password === null || password === undefined || password === "") {
      return res.json({
        message: "Password is empty",
      });
    }
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      "INSERT INTO users (username, password, role) VALUES (?, ?, 'customer')",
      [username, password]
    );
    await connection.end();
    res.json({ message: "Customer created successfully" });
  } catch (error) {
    res.json({ message: "Database error", error });
  }
});

app.put("/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "UPDATE users SET username = ?, password = ? WHERE id = ? AND role = 'customer'",
      [username, password, id]
    );
    await connection.end();
    if (result.affectedRows === 0) {
      return res.json({ message: "Customer not found" });
    }
    res.json({ message: "Customer updated successfully" });
  } catch (error) {
    res.json({ message: "Database error", error });
  }
});

app.delete("/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "DELETE FROM users WHERE id = ? AND role = 'customer'",
      [id]
    );
    await connection.end();
    if (result.affectedRows === 0) {
      return res.json({ message: "Customer not found" });
    }
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    res.json({ message: "Database error", error });
  }
});

app.post("/products", upload.single("image"), async (req, res) => {
  try {
    const { name, price, count } = req.body;
    if (name === null || name === undefined || name === "") {
      return res.json({
        message: "name is empty",
      });
    }
    if (price === null || price === undefined || price === "") {
      return res.json({
        message: "price is empty",
      });
    }
    if (count === null || count === undefined || count === "") {
      return res.json({
        message: "count is empty",
      });
    }
    const image = req.file ? req.file.filename : "";
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      "INSERT INTO products (name, price, count, image) VALUES (?, ?, ?, ?)",
      [name, price, count, image]
    );
    await connection.end();
    res.json({ message: "Product created successfully" });
  } catch (error) {
    res.json({ message: "Database error", error });
  }
});

app.put("/products/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, count } = req.body;
    if (name === null || name === undefined || name === "") {
      return res.json({
        message: "name is empty",
      });
    }
    if (price === null || price === undefined || price === "") {
      return res.json({
        message: "price is empty",
      });
    }
    if (count === null || count === undefined || count === "") {
      return res.json({
        message: "count is empty",
      });
    }
    const image = req.file ? req.file.filename : null;
    const connection = await mysql.createConnection(dbConfig);
    let query =
      "UPDATE products SET name = ?, price = ?, count = ? WHERE id = ?";
    const params = [name, price, count, id];
    if (image) {
      query =
        "UPDATE products SET name = ?, price = ?, count = ?, image = ? WHERE id = ?";
      params.splice(3, 0, image);
    }
    const [result] = await connection.execute(query, params);
    await connection.end();
    if (result.affectedRows === 0) {
      return res.json({ message: "Product not found" });
    }
    res.json({ message: "Product updated successfully" });
  } catch (error) {
    res.json({ message: "Database error", error });
  }
});

app.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "DELETE FROM products WHERE id = ?",
      [id]
    );
    await connection.end();
    if (result.affectedRows === 0) {
      return res.json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.json({ message: "Database error", error });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
