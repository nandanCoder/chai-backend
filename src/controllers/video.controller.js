import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Video } from "../models/video.models.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose, { Schema, isValidObjectId } from "mongoose";

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished } = req.body;
  if (!title || !description) {
    throw new apiError(400, "Title and description must be provided");
  }
  //console.log(req.files);
  const videoLocalFilepath = req.files?.videoFile[0]?.path;
  //console.log(videoLocalFilepath);
  if (!videoLocalFilepath) {
    throw new apiError(400, "Video File path must be provided");
  }
  const thumbnailLocalFilepath = req.files?.thumbnail[0]?.path;
  if (!thumbnailLocalFilepath) {
    throw new apiError(400, "thumbnail File path must be provided");
  }

  const uplodedVideo = await uploadOnCloudinary(videoLocalFilepath);
  const uplodedThumbnail = await uploadOnCloudinary(thumbnailLocalFilepath);

  //console.log(uplodedVideo);

  if (!uplodedVideo) {
    throw new apiError(400, "Video not uploadOnCloudinary");
  }
  if (!uplodedThumbnail) {
    throw new apiError(400, "thumbnail not uploadOnCloudinary");
  }
  try {
    const video = await Video.create({
      title,
      description,
      videoFile: uplodedVideo.url,
      video_public_id: uplodedVideo.public_id,
      thumbnail: uplodedThumbnail.url,
      thumbnail_public_id: uplodedThumbnail.public_id,
      duration: uplodedVideo.duration,
      isPublished,
      owner: req.user?._id,
    });
    if (!video) {
      throw new apiError(400, "Video not create");
    }
    res
      .status(200)
      .json(new apiResponse(200, video, "Video created successfully"));
  } catch (error) {
    throw new apiError(404, error);
  }
});
const getAllVideos = asyncHandler(async (req, res) => {
  // page option
  const allVideos = await Video.aggregate([
    {
      $match: { isPublished: true },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              avater: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "total_likes",
      },
    },
    {
      $addFields: {
        total_likes: {
          $size: "$total_likes",
        },
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  if (!allVideos.length) {
    res.status(200).json(new apiResponse(200, [], "No videos"));
  }
  res
    .status(200)
    .json(new apiResponse(200, allVideos, "All video get successfully"));
});
const getVideoById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    throw new apiError(400, "Invalid video id provided");
  }
  try {
    const video = await Video.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
        },
      },
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
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
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
          owner: {
            $first: "$owner",
          },
        },
      },
    ]);

    if (!video) {
      res.status(200).jason(200, {}, "No one video found of this id");
    }
    res
      .status(200)
      .json(new apiResponse(200, video, "Video found successfully"));
  } catch (error) {
    throw new apiError(400, ` Could not find video :: ${error}`);
  }
});
const updateVideo = asyncHandler(async (req, res) => {
  const { title, description, id } = req.body;

  if (!title || !description) {
    throw new apiError(400, "No title or description provided");
  }
  //TODO: amaka akne video change korar option dita hoba
  try {
    const updatedVideo = await Video.findByIdAndUpdate(
      { _id: id, owner: req.user?._id },
      {
        $set: {
          title,
          description,
        },
      },
      { new: true }
    );
    res
      .status(200)
      .json(200, updatedVideo, "title or description updated success ");
  } catch (error) {
    throw new apiError(404, "YOu dont allou to update this video ");
  }
});
const deleteVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new apiError(400, "Video id must be requested");
  }

  const video = await Video.findById(id);
  await deleteOnCloudinary(video.thumbnail_public_id);
  const response = await deleteOnCloudinary(video.video_public_id);
  console.log(response);
  try {
    await Video.findOneAndDelete({
      _id: id,
      owner: req.user?._id,
    });

    res
      .status(200)
      .json(new apiResponse(200, {}, "Video deleted successfully"));
  } catch (error) {
    throw new apiError(
      400,
      ` you dont have permission to delete video :: ${error}`
    );
  }
});
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new apiError(400, " value must be provided");
  }
  try {
    const updatedVideo = await Video.findOneAndUpdate(
      {
        _id: id,
        owner: req.user?._id,
      },
      {
        $set: {
          isPublished: false,
        },
      },
      {
        new: true,
      }
    );
    res
      .status(200)
      .json(new apiResponse(200, updatedVideo, "Video updated successfully"));
  } catch (error) {
    console.log(error);
    throw new apiError(
      400,
      "You dont have permission to toggle publish status"
    );
  }
});

export {
  publishVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
