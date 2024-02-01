import { Router } from "express";
import { varifyJWT } from "../middlewares/auth.middleware.js";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";

const router = Router();

router.use(varifyJWT); // for all route

router.route("/:videoId").get(getVideoComments).post(addComment);
router.route("/delete/:id").get(deleteComment);
router.route("update-comment").post(updateComment);

export default router;
