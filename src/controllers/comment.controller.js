import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Comment } from "../models/comment.models.js";
import mongoose, { isValidObjectId } from "mongoose";

const addComment = asyncHandler(async (req, res) => {
  const { content, videoId } = req.body;
  if (!content || !videoId) {
    throw new apiError(400, "content and Video Id must be provided");
  }
  try {
    const comment = await Comment.create({
      content,
      videoId,
      owner: req.user?._id,
    });

    if (!comment) {
      throw new apiError(404, "Comment Not create !!");
    }
    return res
      .status(200)
      .json(new apiResponse(200, comment, "comment added successfully ||"));
  } catch (error) {
    throw new apiError(
      404,
      "Error creating comment for Comment:: ",
      error.message
    );
  }
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId, content } = req.body;
  if (!isValidObjectId(commentId)) {
    throw new apiError(301, "Invalid mongoose ObjectId id");
  }
  if (!content) {
    throw new apiError(400, " Content is required");
  }
  try {
    const comment = await Comment.findOneAndUpdate(
      {
        _id: commentId,
        owner: req.user?._id,
      },
      {
        $set: {
          content,
        },
      },
      {
        new: true,
      }
    );
    if (!comment) {
      throw new apiError(404, " comment not updated ");
    }
    res
      .status(200)
      .json(new apiResponse(200, comment, "comment updated successfully !!"));
  } catch (error) {
    throw new apiError(
      404,
      "Error creating comment for Comment:: ",
      error.message
    );
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new apiError(400, " comment ID is required");
  }
  try {
    await Comment.findOneAndDelete({
      _id: id,
      owner: req.user?._id,
    });
    res
      .status(200)
      .json(new apiResponse(200, {}, "comment deleted successfully"));
  } catch (error) {
    throw new apiError(404, " This User is not allowed to exiquet the ");
  }
});
const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new apiError(400, "Video Id is required");
  }
  try {
    const comments = await Comment.aggregate([
      {
        $match: {
          videoId: new mongoose.Types.ObjectId(videoId),
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
                fullName: 1,
                avater: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          owner: {
            $first: "$owner",
          },
        },
      },
    ]);

    if (!comments.length) {
      res.status(200).json(200, {}, "No comment found");
    }

    res
      .status(200)
      .json(new apiResponse(200, comments, " Comment found successfully"));
  } catch (error) {
    throw new apiError(404, " Faled to get video comments ??");
  }
});

export { addComment, deleteComment, updateComment, getVideoComments };
