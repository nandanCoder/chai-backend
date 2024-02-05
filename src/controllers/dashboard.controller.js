import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscriptions.models.js";
import { Like } from "../models/like.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const userId = req.user?._id;
  const channelStats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "owner",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $group: {
        _id: null,
        TotalVideos: {
          $sum: 1, // this help sum of this fild total videos
        },
        TotalViews: { $sum: "$views" },

        totalsubscribers: {
          $first: {
            $size: "$subscribers",
          },
        },
        totallikes: {
          $first: {
            $size: "$likes",
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalsubscribers: 1,
        totallikes: 1,
        TotalVideos: 1,
        TotalViews: 1,
      },
    },
  ]);
  if (!channelStats) {
    throw new apiError(404, "Channel Stats not found ");
  }
  res.status(200).json(new apiResponse(200, channelStats));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  try {
    const videos = await Video.find({ owner: req.user?._id });
    if (!videos || videos.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, videos, "No video published yet"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, videos, "All videos fetched"));
  } catch (error) {
    throw new apiError(404, error.message || "somthing error");
  }
});

export { getChannelStats, getChannelVideos };
