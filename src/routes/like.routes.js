import { Router } from "express";
import { varifyJWT } from "../middlewares/auth.middleware.js";
import {
  getLikedVideos,
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";

const router = new Router();

router.use(varifyJWT); // for all routes

router.route("/video/:videoId").get(toggleVideoLike);
router.route("/comment/:commentId").get(toggleCommentLike);
router.route("/tweet/:tweetId").get(toggleTweetLike);
router.route("/video").get(getLikedVideos);

export default router;
