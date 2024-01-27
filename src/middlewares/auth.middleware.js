// this varifay user a6a ki na

import { User } from "../models/user.models.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const varifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", ""); // ata replace use korlam karon ar data aga ai brr ta take to sata to amar chi na tai take kata bat dia dilam
    console.log(token);
    if (!token) {
      throw new apiError(401, "Unauthenticated user");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    // TODO: discuss about frontend

    if (!user) {
      throw new apiError(401, "Invalid accessToken");
    }

    // akan taka ki6u return korbo na oi data modha i ai data vora patia dibo samne ok
    req.user = user;
    next();
  } catch (error) {
    throw new apiError(401, error.message || "invalid accessToken");
  }
});
