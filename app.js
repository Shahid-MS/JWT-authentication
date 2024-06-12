require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const userRouter = require("./Routes/userRouter");
const authRouter = require("./Routes/authRouter");
const app = express();

const port = process.env.SERVER_PORT || 3000;

app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
// app.use(methodOverride("_method"));
// app.engine("ejs", ejsMate);

app.use(express.static(path.join(__dirname, "/public")));
const MONGO_URL = "mongodb://127.0.0.1:27017/jwt";

async function main() {
  await mongoose.connect(MONGO_URL);
}

main()
  .then(() => {
    console.log("Connected to Database");
  })
  .catch((err) => {
    console.log(err);
  });

app.use("/", authRouter); 
app.use("/api", userRouter); 

app.listen(port, () => {
  console.log("App listen on port : " + port);
});
