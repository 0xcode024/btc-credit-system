const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const {
  depositBTC,
  withdrawBTC,
  depositInscription,
  withdrawInscription,
  depositRune,
  withdrawRune,
} = require("./controllers/index.js");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Example route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// POST route for BTC deposit
app.post("/btc-deposit", async (req, res) => {
  try {
    const result = await depositBTC(req.body);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// POST route for BTC withdraw
app.post("/btc-withdraw", async (req, res) => {
  try {
    const result = await withdrawBTC(req.body);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// POST route for inscription deposit
app.post("/inscription-deposit", async (req, res) => {
  try {
    const result = await depositInscription(req.body);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// POST route for inscription withdraw
app.post("/inscription-withdraw", async (req, res) => {
  try {
    const result = await withdrawInscription(req.body);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// POST route for rune deposit
app.post("/rune-deposit", async (req, res) => {
  try {
    const result = await depositRune(req.body);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// POST route for rune withdraw
app.post("/rune-withdraw", async (req, res) => {
  try {
    const result = await withdrawRune(req.body);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
