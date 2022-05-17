// index.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

const Routes = require("./agentRoutes");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "./public", "zoom.html"));
});

app.use(express.static("public"));

app.use("/api/agent", Routes);
// app.use(express.json())
// app.use("/", Routes);

app.listen(PORT, () => console.log(`🔥  server running on port ${PORT}`));
