const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");
const app = express();
const multer = require("multer");
const cors = require("cors");

const port = 3001;

app.use(bodyParser.json());

app.use(cors());

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

app.get("/products", async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("SELECT * FROM products");
    await connection.end();
    res.json(rows);
  } catch (error) {
    res.json({ message: "Database error", error });
  }
});

app.post("/cart", async (req, res) => {
  try {
    const { customer_id, product_id, quantity } = req.body;
    if (
      customer_id === null ||
      customer_id === undefined ||
      customer_id === ""
    ) {
      return res.json({
        message: "customer_id is empty",
      });
    }
    if (product_id === null || product_id === undefined || product_id === "") {
      return res.json({
        message: "product_id is empty",
      });
    }
    if (quantity === null || quantity === undefined || quantity === "") {
      return res.json({
        message: "quantity is empty",
      });
    }
    const connection = await mysql.createConnection(dbConfig);

    const [product] = await connection.execute(
      "SELECT count FROM products WHERE id = ?",
      [product_id]
    );
    if (product.length === 0 || product[0].count < quantity) {
      await connection.end();
      return res.json({
        message: "Product not available or insufficient quantity",
      });
    }

    await connection.execute(
      "INSERT INTO carts (customer_id, product_id, quantity) VALUES (?, ?, ?)",
      [customer_id, product_id, quantity]
    );

    await connection.execute(
      "UPDATE products SET count = count - ? WHERE id = ?",
      [quantity, product_id]
    );

    await connection.end();
    res.json({ message: "Product added to cart successfully" });
  } catch (error) {
    res.json({ message: "Database error", error });
  }
});

app.post("/orders", async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);

    const [cartItems] = await connection.execute(
      "SELECT * FROM carts WHERE customer_id = ?",
      [req.body.customer_id]
    );

    for (const item of cartItems) {
      const [product] = await connection.execute(
        "SELECT * FROM products WHERE id = ?",
        [item.product_id]
      );

      if (product.length === 0 || product[0].count < item.quantity) {
        await connection.end();
        return res.json({
          message: "Product not available or insufficient quantity in cart",
        });
      }

      await connection.execute(
        "INSERT INTO orders (customer_id, product_id, quantity, total_price) VALUES (?, ?, ?, ?)",
        [
          item.customer_id,
          item.product_id,
          item.quantity,
          product[0].price * item.quantity,
        ]
      );

      await connection.execute(
        "UPDATE products SET count = count - ? WHERE id = ?",
        [item.quantity, item.product_id]
      );

      await connection.execute("DELETE FROM carts WHERE id = ?", [item.id]);
    }

    await connection.end();
    res.json({ message: "Order placed successfully" });
  } catch (error) {
    res.json({ message: "Database error", error });
  }
});

app.get("/getProducts", (req, res) => {
  let products = [
    {
      id: 1,
      product_name: "Product 1",
      sku: "SKU001",
      price: 10.0,
      description: "Description for product 1",
      brand: "Brand A",
    },
    {
      id: 2,
      product_name: "Product 2",
      sku: "SKU002",
      price: 20.0,
      description: "Description for product 2",
      brand: "Brand B",
    },
    {
      id: 3,
      product_name: "Product 3",
      sku: "SKU003",
      price: 30.0,
      description: "Description for product 3",
      brand: "Brand C",
    },
    {
      id: 4,
      product_name: "Product 4",
      sku: "SKU004",
      price: 40.0,
      description: "Description for product 4",
      brand: "Brand D",
    },
    {
      id: 5,
      product_name: "Product 5",
      sku: "SKU005",
      price: 50.0,
      description: "Description for product 5",
      brand: "Brand E",
    },
    {
      id: 6,
      product_name: "Product 6",
      sku: "SKU006",
      price: 60.0,
      description: "Description for product 6",
      brand: "Brand F",
    },
    {
      id: 7,
      product_name: "Product 7",
      sku: "SKU007",
      price: 70.0,
      description: "Description for product 7",
      brand: "Brand G",
    },
    {
      id: 8,
      product_name: "Product 8",
      sku: "SKU008",
      price: 80.0,
      description: "Description for product 8",
      brand: "Brand H",
    },
    {
      id: 9,
      product_name: "Product 9",
      sku: "SKU009",
      price: 90.0,
      description: "Description for product 9",
      brand: "Brand I",
    },
    {
      id: 10,
      product_name: "Product 10",
      sku: "SKU010",
      price: 100.0,
      description: "Description for product 10",
      brand: "Brand J",
    },
    {
      id: 11,
      product_name: "Product 11",
      sku: "SKU011",
      price: 110.0,
      description: "Description for product 11",
      brand: "Brand K",
    },
    {
      id: 12,
      product_name: "Product 12",
      sku: "SKU012",
      price: 120.0,
      description: "Description for product 12",
      brand: "Brand L",
    },
    {
      id: 13,
      product_name: "Product 13",
      sku: "SKU013",
      price: 130.0,
      description: "Description for product 13",
      brand: "Brand M",
    },
    {
      id: 14,
      product_name: "Product 14",
      sku: "SKU014",
      price: 140.0,
      description: "Description for product 14",
      brand: "Brand N",
    },
    {
      id: 15,
      product_name: "Product 15",
      sku: "SKU015",
      price: 150.0,
      description: "Description for product 15",
      brand: "Brand O",
    },
    {
      id: 16,
      product_name: "Product 16",
      sku: "SKU016",
      price: 160.0,
      description: "Description for product 16",
      brand: "Brand P",
    },
    {
      id: 17,
      product_name: "Product 17",
      sku: "SKU017",
      price: 170.0,
      description: "Description for product 17",
      brand: "Brand Q",
    },
    {
      id: 18,
      product_name: "Product 18",
      sku: "SKU018",
      price: 180.0,
      description: "Description for product 18",
      brand: "Brand R",
    },
    {
      id: 19,
      product_name: "Product 19",
      sku: "SKU019",
      price: 190.0,
      description: "Description for product 19",
      brand: "Brand S",
    },
    {
      id: 20,
      product_name: "Product 20",
      sku: "SKU020",
      price: 200.0,
      description: "Description for product 20",
      brand: "Brand T",
    },
    {
      id: 21,
      product_name: "Product 21",
      sku: "SKU021",
      price: 210.0,
      description: "Description for product 21",
      brand: "Brand U",
    },
    {
      id: 22,
      product_name: "Product 22",
      sku: "SKU022",
      price: 220.0,
      description: "Description for product 22",
      brand: "Brand V",
    },
    {
      id: 23,
      product_name: "Product 23",
      sku: "SKU023",
      price: 230.0,
      description: "Description for product 23",
      brand: "Brand W",
    },
    {
      id: 24,
      product_name: "Product 24",
      sku: "SKU024",
      price: 240.0,
      description: "Description for product 24",
      brand: "Brand X",
    },
    {
      id: 25,
      product_name: "Product 25",
      sku: "SKU025",
      price: 250.0,
      description: "Description for product 25",
      brand: "Brand Y",
    },
  ];

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const resultProducts = products.slice(startIndex, endIndex);

  const pagination = {};
  if (endIndex < products.length) {
    pagination.next = {
      page: page + 1,
      limit: limit,
    };
  }
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit: limit,
    };
  }

  res.json({
    totalProducts: products.length,
    page,
    limit,
    pagination,
    products: resultProducts,
  });
});
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
