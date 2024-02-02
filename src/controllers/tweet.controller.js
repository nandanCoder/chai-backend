import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Tweet } from "../models/tweet.models.js";
import mongoose, { isValidObjectId } from "mongoose";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  //console.log(content);
  //console.log(req.body);
  if (!content) {
    throw new apiError(400, "Content Must be recurd");
  }
  const tweet = await Tweet.create({
    content,
    owner: req.user?._id,
  });

  if (!tweet) {
    throw new apiError(404, "Couldn't create tweet");
  }
  return res
    .status(200)
    .json(new apiResponse(200, tweet, "Tweet created successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { content, id } = req.body;
  //console.log(req.body);
  if (!content) {
    throw new apiError(400, "Content Must be recurd");
  }
  if (!isValidObjectId(id)) {
    throw new apiError(400, " this is not a valid tweet id");
  }
  try {
    const updatedTweet = await Tweet.findOneAndUpdate(
      { _id: id, owner: req.user?._id },
      {
        $set: { content },
      },
      {
        new: true,
      }
    );
    if (!updatedTweet) {
      throw new apiError(404, "Couldn't update tweet");
    }
    res
      .status(200)
      .json(new apiResponse(200, updatedTweet, "Tweet updated successfully"));
    //console.log(updateTweet);
  } catch (error) {
    throw new Error(400, " User not authenticated to pafom this event");
  }
});
const deleteTweet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new apiError(401, "You must provide a unique tweet id");
  }
  try {
    const responce = await Tweet.findOneAndDelete({
      _id: id,
      owner: req.user?._id,
    });
    if (!responce) {
      throw new apiError(401, "Tweet not deleted successfully");
    }
    res
      .status(200)
      .json(new apiResponse(200, {}, "Tweet deleted successfully"));
  } catch (error) {
    throw new apiError("This user dont parfom this event :: ", error.message);
  }
});
const getUserTweets = asyncHandler(async (req, res) => {
  const { ownerId } = req.params;
  if (!ownerId) {
    throw new apiError(
      401,
      "You must provide a unique user id for finding tweets"
    );
  }
  try {
    const tweet = await Tweet.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(ownerId),
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner_details",
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
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "tweet",
          as: "total_likes",
        },
      },
      {
        $addFields: {
          total_likes: {
            $size: "$total_likes",
          },
          isLiked: {
            $cond: {
              if: { $in: [req.user?._id, "$total_likes.likedBy"] },
              then: true,
              else: false,
            },
          },
          owner_details: {
            $first: "$owner_details",
          },
        },
      },
    ]);
    //console.log(tweet);
    if (!tweet.length) {
      res.status(200).json(200, [], "No Tweet found");
    }
    if (!tweet) {
      throw new apiError(404, "Not Found for Database");
    }
    res
      .status(200)
      .json(new apiResponse(200, tweet, "Tweet featched successfully"));
  } catch (error) {
    throw new apiError(
      400,
      " User Tweet are not Get successfully ",
      error.message
    );
  }
});

export { createTweet, updateTweet, deleteTweet, getUserTweets };
