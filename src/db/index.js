import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );
    console.log(`Connected:${connectionInstance}`);
    console.log(
      `\n Mongo DB Connected to || DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB CONNECTION ERROR:: " + error);
    process.exit(1); // process.exit is a syntex on javascript
  }
};
export default connectDB;
