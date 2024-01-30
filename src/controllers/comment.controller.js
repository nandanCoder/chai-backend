import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Comment } from "../models/comment.models.js";
import { isValidObjectId } from "mongoose";

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
  const { id, content } = req.body;
  if (!isValidObjectId(id)) {
    throw new apiError(301, "Invalid mongoose ObjectId id");
  }
  if (!content) {
    throw new apiError(400, " Content is required");
  }
  try {
    const comment = await Comment.findOneAndUpdate(
      {
        _id: id,
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
    res.status(200).json(200, comment, "comment updated successfully !!");
  } catch (error) {
    throw new apiError(
      404,
      "Error creating comment for Comment:: ",
      error.message
    );
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  const { id } = eq.params;
  if (!id) {
    throw new apiError(400, " comment ID is required");
  }
  try {
    await Comment.findOneAndDelete({
      _id: id,
      owner: req.user?._id,
    });
    res.status(200).json(200, {}, "comment deleted successfully");
  } catch (error) {
    throw new apiError(404, " This User is not allowed to exiquet the ");
  }
});

export { addComment, deleteComment, updateComment };
