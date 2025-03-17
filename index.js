const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const http = require("http");
const socketIo = require("socket.io");

const userRoutes = require("./routes/user");
const authRoutes = require("./routes/auth");
const cashRoutes = require("./routes/cash");
const txRoutes = require("./routes/transaction");
const coinFlipRoutes = require("./routes/games/coinFlipRoutes");

const { initTransactionWorker } = require("./workers/transaction");

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 8000;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

//Removed random AI bullshit - check above app, port and mongoose connections to make sure they are correct (or we want to even use)

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cash", cashRoutes);
app.use("/api/tx", txRoutes);
app.use("/api/games/coinflip", coinFlipRoutes);

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

initTransactionWorker(io);

io.on("connection", (socket) => {
  console.log("A client connected");
});
