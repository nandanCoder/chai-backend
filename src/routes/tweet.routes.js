import { Router } from "express";
import { varifyJWT } from "../middlewares/auth.middleware.js";
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controller.js";
const router = Router();

router.use(varifyJWT); // for all route
router.route("/").post(createTweet);
router.route("/update-tweet").post(updateTweet);
router.route("/delete-tweet/:id").get(deleteTweet);
router.route("/get-user-tweets/:ownerId").get(getUserTweets);

export default router;
