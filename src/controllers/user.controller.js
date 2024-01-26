import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js"; // ai mongo db sata i kotha bol ba ar bar bar kotha boll ba ok
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
  //1 get user details from frontend
  //2 validation  - not emty
  //3 chack if user already exists : username - email
  //4 chack for images , chack for avater
  //5 uplod tham to cloudinary, avater
  //6 create user object - create entry in DB
  //7 remove password and refresh Token fild from response
  //8 chak for user cration
  //9 return res

  const { fullName, username, email, password } = req.body;
  //console.log("email: ", email);

  // if(fullName === ""){
  //   throw new apiError(400,"fullname is required")
  // }
  //| bar bar chack na kora ak bar chak kora ni6i

  if (
    [fullName, username, email, password].some((fild) => fild?.trim() === "")
  ) {
    throw new apiError(400, " All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new apiError(409, "User with email and username already exists");
  }

  const avaterLocalPath = req.files?.avater[0]?.path;
  //req.file aka ak bar console.log kora dakbo
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;
  //console.log(req.files);
  // chack for cover image
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avaterLocalPath) {
    throw new apiError(400, "Avater file are required");
  }

  const avater = await uploadOnCloudinary(avaterLocalPath); // somay niba
  const coverImage = await uploadOnCloudinary(coverImageLocalPath); // somay niba

  if (!avater) {
    throw new apiError(400, "Avater file are required");
  }

  // send database the data using this

  const user = await User.create({
    fullName,
    avater: avater.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken" // this a syntex using space berd syntes ata ja ja chi na ta lika hoy inqury ta
  );

  if (!createdUser) {
    throw new apiError(500, "Somthing went wrong while refreshing the user");
  }

  return res
    .status(201)
    .json(new apiResponse(200, createdUser, "User registered Successfully"));
});

export { registerUser };
