import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avater: {
      type: String, // cloudinary url
      required: true,
    },
    coverimage: {
      type: String, // cloudinary url
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timeseries: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // password change hola i in cription korbo
  this.password = await bcrypt.hash(this.password, 8); // 8 is round for password in criptions
  next();
});

// user ja password dia6a ar incript password  compare kora jachai korba aki ki na ok
userSchema.methods.isPasswordCurrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//| JWT is BRR token ata jar ka6a a6a taka ami data patia dibo
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    // payload data
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    // payload data
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
