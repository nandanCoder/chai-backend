import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Video } from "../models/video.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { isValidObjectId } from "mongoose";

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished } = req.body;
  if (!title || !description) {
    throw new apiError(400, "Title and description must be provided");
  }
  const videoLocalFilepath = req.files?.video[0]?.path;
  if (!videoLocalFilepath) {
    throw new apiError(400, "Video File path must be provided");
  }
  const thumbnailLocalFilepath = req.files?.thumbnail[0]?.path;
  if (!thumbnailLocalFilepath) {
    throw new apiError(400, "thumbnail File path must be provided");
  }

  const uplodedVideo = await uploadOnCloudinary(videoLocalFilepath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalFilepath);

  console.log(uplodedVideo);

  if (!uplodedVideo) {
    throw new apiError(400, "Video not uploadOnCloudinary");
  }
  if (!thumbnail) {
    throw new apiError(400, "thumbnail not uploadOnCloudinary");
  }
  try {
    const video = await Video.create({
      title,
      description,
      videoFile: uplodedVideo.url,
      video_public_id: uplodedVideo.public_id,
      thumbnail: thumbnail.url,
      thumbnail_public_id: thumbnail.public_id,
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
  const allVideos = awaitVideo.find();
  if (!allVideos.length) {
    res.status(200).json(new apiResponse(200, [], "No videos"));
  }
  res
    .status(200)
    .json(new apiResponse(200, allVideos, "All video get successfully"));
});
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid video id provided");
  }
  try {
    const video = await Video.findById(videoId);

    if (!video) {
      res.status(200).jason(200, {}, "No one video found of this id");
    }
    res
      .status(200)
      .jason(200)
      .json(new apiResponse(200, video, "Video found successfully"));
  } catch (error) {
    throw new apiError(400, ` Could not find video :: ${error}`);
  }
});
const updateVideo = asyncHandler(async (req, res) => {});
const deleteVideo = asyncHandler(async (req, res) => {
  const { id } = req.parames;
  if (!id) {
    throw new apiError(400, "Video id must be requested");
  }
  try {
    await Video.findOneAndDelete({
      _id: id,
      owner: req.user?._id,
    });
    res.status(200).json(200, {}, "Video deleted successfully");
  } catch (error) {
    throw new apiError(
      400,
      ` you dont have permission to delete video :: ${error}`
    );
  }
});
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { isPublished, id } = req.body;
  if (!isPublished || !id) {
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
          isPublished,
        },
      },
      {
        new: true,
      }
    );
    res.status(200).json(200, updatedVideo, "Video updated successfully");
  } catch (error) {
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
