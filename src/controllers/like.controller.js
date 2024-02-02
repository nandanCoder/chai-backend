import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.modles.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "invalid video id");
  }
  try {
    await Like.create({
      video: videoId,
      likedBy: req.user?._id,
    });

    res.status(200).json(new apiResponse(200, {}, "Video liked successfully"));
  } catch (error) {
    console.log(error);
    throw new apiError(404, "unable to toggle video like");
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new apiError(400, "invalid comment id");
  }
  try {
    await Like.create({
      comment: commentId,
      likedBy: req.user?._id,
    });

    res
      .status(200)
      .json(new apiResponse(200, {}, "comment liked successfully"));
  } catch (error) {
    throw new apiError(404, "unable to toggle comment like");
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new apiError(400, "invalid tweetId id");
  }
  try {
    await Like.create({
      tweet: tweetId,
      likedBy: req.user?._id,
    });

    res.status(200).json(new apiResponse(200, {}, "tweet liked successfully"));
  } catch (error) {
    throw new apiError(404, "unable to toggle tweetId like");
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  try {
    const likedVideos = await Like.aggregate([
      {
        $match: {
          // meatch only videos
          likedBy: new mongoose.Types.ObjectId(req.user?._id),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "video_details",
          pipeline: [
            {
              $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                owner: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          video_details: {
            $first: "$video_details",
          },
        },
      },
    ]);
    if (!likedVideos.length) {
      res
        .status(200)
        .json(
          new apiResponse(
            200,
            [],
            "You dont like any videos plis fast like videos than get liked videos"
          )
        );
    }
    res
      .status(200)
      .json(
        new apiResponse(200, likedVideos, "Likely videos get successfully")
      );
  } catch (error) {
    console.log(error.message);
    throw new apiError(404, "unable to get liked videos");
  }
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
