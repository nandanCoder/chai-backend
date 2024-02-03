import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";

const isUserOwnerofPlaylist = async (playlistId, userId) => {
  try {
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      throw new apiError(400, "playlist doesn't exist");
    }

    if (playlist?.owner.toString() !== userId.toString()) {
      return false;
    }

    return true;
  } catch (e) {
    throw new apiError(400, e.message || "Playlist Not Found");
  }
};

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    throw new apiError(400, " playlist name or description must be provided");
  }
  try {
    const playlist = await Playlist.create({
      name,
      description,
      owner: req.user?._id,
      videos: [],
    });
    res
      .status(200)
      .json(new apiResponse(200, playlist, "Playlist created successfully"));
  } catch (error) {
    console.log(error);
    throw new apiError(404, "Some unconfigured error");
  }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  try {
    const playLists = await Playlist.aggregate([
      {
        $match: {
          owner: req.user?._id,
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
                owner: 1,
                duration: 1,
                description: 1,
                title: 1,
                thumbnail: 1,
                videoFile: 1,
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
    if (!playLists.length) {
      res.status(200).json(new apiResponse(200, [], "No playlist found"));
    }
    res.status(200).json(new apiResponse(200, playLists, "success message "));
  } catch (error) {
    console.log(error);
    throw new apiError(404, "Some unconfigured error");
  }
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // get playlist by id and video id
  // then chack tay are not emty
  // chack this video are piblic or note
  //if the video is not published but video owner and current user is same then owner can add to playlist only
  // than chack this id axisit to this plylist
  // than push this id
  if (!isValidObjectId(videoId) && !isValidObjectId(playlistId)) {
    throw new apiError(400, "Invalid playlist id and VideoId");
  }

  try {
    const userOwner = await isUserOwnerofPlaylist(playlistId, req.user?._id);

    if (!userOwner) {
      throw new apiError(300, "Unauthorized Access");
    }

    const video = await Video.findById(videoId);

    if (!video || (video?.owner !== req.user?._id && !video?.isPublished)) {
      throw new apiError(404, "Video Not Found");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      throw new apiError(404, "Playlist Not Found");
    }
    // console.log(playlist);

    if (playlist.videos.includes(videoId)) {
      res
        .status(200)
        .json(new apiResponse(200, {}, "Video Is already present In Playlist"));
    } else {
      const newPlaylist = await Playlist.updateOne(
        {
          _id: playlistId,
        },
        {
          $push: {
            videos: videoId,
          },
        },
        {
          new: true,
        }
      );
      res
        .status(300)
        .json(new apiResponse(200, newPlaylist, "Playlist Updated Success"));
    }
  } catch (error) {
    throw new apiError(
      500,
      error.message || "Unable to add video to the playlist"
    );
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (isValidObjectId(playlistId) || isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid playlist id or video id");
  }

  //const user = await isUserOwnerofPlaylist(playlistId,req.user?._id)
  const playlist = await Playlist.findById(playlistId);

  if (playlist.owner !== req.user?._id) {
    throw new apiError(400, "This user not alowed to remove");
  }

  if (!playlist.videos.includes(videoId)) {
    throw new apiError(400, "Video is not exist this plylist");
  }

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    {
      _id: playlistId,
      owner: req.user?._id,
    },
    {
      $pull: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedPlaylist) {
    throw new apiError(500, "Unable to remove ,Retry!!!!!");
  }
  res
    .status(200)
    .json(new apiResponse(200, updatedPlaylist, "Video removed successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new apiError(300, "Invalid playlist id");
  }

  try {
    await Playlist.findOneAndDelete({
      _id: playlistId,
      owner: req.user?._id,
    });
    res.status(200).json(new apiResponse(200, {}, "Playlist delete success "));
  } catch (error) {
    throw new apiError(300, error.message || "Unauthorized Access");
  }
}); // delete playlist

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new apiError(`Invalid playlist id: ${playlistId}`);
  }
  const { name, description } = req.body;
  if (!name || !description) {
    throw new apiError(
      "name and description fild must be a required parameter"
    );
  }

  try {
    const playlist = await Playlist.findByIdAndUpdate(
      {
        _id: playlistId,
        owner: req.user?._id,
      },
      {
        $set: {
          name,
          description,
        },
      },
      {
        new: true,
      }
    );
    if (!playlist) {
      throw new apiError(404, "plylist not Updated");
    }
    res.status(200).json(new apiResponse(200, playlist, "PLaylist updated"));
  } catch (error) {
    throw new apiError(300, error.message || "Unauthorized Access");
  }
});
export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
