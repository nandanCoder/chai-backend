import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { Comment } from "../models/comment.models.js";
import { Tweet } from "../models/tweet.models.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "invalid video id");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(400, "no video found");
  }
  const alreadyLike = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });
  if (alreadyLike) {
    throw new apiError(400, "already like  this video");
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

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new apiError(400, "no comment found");
  }

  const alreadyLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });
  if (alreadyLike) {
    throw new apiError(400, "already like  this comment");
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
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new apiError(400, "no tweet found");
  }

  const alreadyLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });
  if (alreadyLike) {
    throw new apiError(400, "already like  this tweet");
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
          as: "likedVideos",
        },
      },
      {
        $unwind: "$likedVideos", //* its help to get only videos and destucher fild
      },
      {
        $match: {
          "likedVideos.isPublished": true,
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "likedVideos.owner",
          foreignField: "_id",
          //let: { owner_id: "$likedVideos.owner" },
          pipeline: [
            // {
            //   $match: {
            //     $expr: { $eq: ["$_id", "$$owner_id"] },
            //   },
            // },

            {
              $project: {
                _id: 1,
                username: 1,
                avater: 1,
                fullName: 1,
              },
            },
          ],
          as: "owner",
        },
      },

      {
        //* this help to add all the fild to gather in one fild
        $unwind: "$owner", //{ path: "$owner", preserveNullAndEmptyArrays: true },
      },

      {
        $project: {
          _id: "$likedVideos._id",
          title: "$likedVideos.title",
          thumbnail: "$likedVideos.thumbnail",
          owner: {
            username: "$owner.username",
            avater: "$owner.avater",
            fullName: "$owner.fullName",
          },
        },
      },

      {
        $group: {
          _id: null,
          likedVideos: { $push: "$$ROOT" },
        },
      },

      {
        $project: {
          _id: 0,
          likedVideos: 1,
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
