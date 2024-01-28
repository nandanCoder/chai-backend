import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js"; // ai mongo db sata i kotha bol ba ar bar bar kotha boll ba ok
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({
      validateBeforeSave: false, // ami abr validation chi na mana mongose a ja ja fild requard a6a sa gula ami abar dita chi na sudu ata save korta chi ok thats good
    });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(
      500,
      "Somthing  while wrong generating accessToken and refreshToken"
    );
  }
};

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

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  // find the user
  // chack password
  // access and refreshToken
  // send cookis

  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new apiError(400, "username and email are required");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new apiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCurrect(password);
  if (!isPasswordValid) {
    throw new apiError(401, "Invalid password:: Invalid user credentials");
  }

  // call the mathod

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //- TODO: are call korbo na data base ka
  //const finalUser = user.refreshToken = refreshToken

  // now send this in cookis

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully||"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // akane user ar access nai karon logout ar somay toemil daoa jaba na
  // middleware injak kora dia6i tai pia ga6i
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User loged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefrshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefrshToken) {
    throw new apiError(403, "Unauthenticated access token requst");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefrshToken.process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new apiError(401, "Invalid refresh token");
    }
    if (incomingRefrshToken !== user.refreshToken) {
      throw new apiError(401, "refresh Token  is expiry or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new apiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "AccessToken generated successfully"
        )
      );
  } catch (error) {
    throw new apiError(401, error.message || "Invilid access token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.body._id);

  const isPasswordCurrect = await user.isPasswordCurrect(oldPassword);
  if (!isPasswordCurrect) {
    throw new apiError(400, "Invalid oldPassword");
  }
  user.password = newPassword;
  await user.save({
    validateBeforeSave: false,
  });
  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password updated successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  //const user = await User.findById(req.user?._id);

  return res
    .status(200)
    .json(new apiResponse(200, req.body, "Current user featched successfully"));
});

const updatAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new apiError(400, " All fields must be required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password"); // chaning ak bara sob set hoa jabe karon basi data base call chi na

  if (!user) {
    throw new apiError(404, " Fullname and email not change Internaal issu ");
  }

  return res
    .status(200)
    .json(new apiResponse(200, user, "User Data Change Success fully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avaterLocalPath = req.file?.path;

  if (!avaterLocalPath) {
    throw new apiError(400, "Avater file is missing");
  }
  const avater = uploadOnCloudinary(avaterLocalPath);
  if (!avater) {
    throw new apiError(400, "Avater file not uploded");
  }

  const oldUser = await User.findById(req.user._id);

  await deleteOnCloudinary(oldUser.avater);

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avater: avater.url,
      },
    },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new apiError(404, " Avater not updated Successfully");
  }

  return res
    .status(200)
    .json(new apiResponse(200, user, "Avater updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new apiError(400, "coverImage must be requard");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage) {
    throw new apiError(400, "Internaal Surver Error");
  }
  const oldUser = await User.findById(req.user._id);
  await deleteOnCloudinary(oldUser.coverImage);

  const user = await User.findByIdAndUpdate(
    req.body._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");
  if (!user) {
    throw new apiError(404, "Internaal Surver Error");
  }
  return res
    .status(200)
    .jason(new apiResponse(200, user, "Cover Image Updated Successfully"));
});

//| Aggregation Pipeline Example
//The following aggregation pipeline example contains two stages and returns the total order quantity .

const getUserChannlProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;
  if (!userName?.trim()) {
    throw new apiError(400, "userNAme is missing");
  }
  const channel = await User.aggregate([
    {
      $match: {
        // meatch kora6a data
        userName: userName?.toLowerCase(),
      },
    },
    {
      $lookup: {
        // ono fold a gia match kor6a
        from: "subscriptions", // ja fild ta matech korate chi sata kotaya6a ta akane

        localField: "_id", // local fild

        foreignField: "channel", // ja fild take match korate chi
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        // user object a new fild add kora ho6a

        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $condition: {
            if: {
              // condition for chaking amar id ta ar modha a6a ki na

              $in: [req.user?._id, "$subscribers.subscriber"],
              then: true,
              else: false,
            },
          },
        },
      },
    },
    {
      $project: {
        //| ja j avlue return korta chi

        fullName: 1,
        avater: 1,
        coverImage: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        email: 1,
      },
    },
  ]);
  console.log(channel);

  if (!channel.length()) {
    throw new apiError(404, "Channel does not exist");
  }
  return res
    .status(200)
    .jason(
      new apiResponse(200, channel[0], "User Chanal featched Successfully")
    );
});
//| Aggregation Pipeline

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        // ata use kora holo kanon pip;ine ae data dairect data base a ajay to aknae moongoose use hoba na to amay string id take object id te convert kora meatch kora te hoba ok
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory", //* nasting piplin karon akne sob video pia ga6i but video modha ja user a6a tar ka6a jaoar jono abar pipline laga bo ok tai ata korla acces pia jabo
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    avater: 1,
                    fullName: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $fast: "owner",
              },
            },
          },
        ],
      },
    },
  ]);
  return res
    .status(200)
    .jason(
      new apiResponse(
        200,
        user[0].watchHistory,
        "watchHistory featched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updatAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannlProfile,
  getUserChannlProfile,
  getWatchHistory,
};
