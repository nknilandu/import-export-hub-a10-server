const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3031;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to Import Export Hub");
});


app.listen(port, () => {
  console.log(`This app listening on port ${port}`);
});
