//require("dotenv").config({ path: "./env" });
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});
const port = process.env.PORT || 8000;

connectDB()
  .then(
    app.listen(port, () => {
      console.log(`Server listening on ${port}`);
    }),
    app.on("error", (error) => {
      console.log("ERROR", error);
      throw error;
    })
  )
  .catch((error) => {
    console.log("MONGODB CONNECTION FAILD: !!", error);
  });
