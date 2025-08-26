const express = require("express");
const cors = require("cors");
const app = express();
const port = 8081;

app.use(cors());
app.use(express.json());

const products = [
  { id: 1, name: "Product 1", price: 100 },
  { id: 2, name: "Product 2", price: 200 },
];

app.get("/products", (req, res) => {
  res.json(products);
});

app.listen(port, () => {
  console.log(`Provider service listening at http://localhost:${port}`);
});
