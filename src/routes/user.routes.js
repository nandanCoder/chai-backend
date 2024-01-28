import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannlProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updatAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { varifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avater",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// secured route

router.route("/logout").post(varifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(varifyJWT, changeCurrentPassword);
router.route("current-user").get(varifyJWT, getCurrentUser);
router.route("/update-acount").patch(varifyJWT, updatAccountDetails);
router
  .route("/update-avater")
  .post(varifyJWT, upload.single("avater"), updateUserAvatar);
router
  .route("/update-coverImage")
  .post(varifyJWT, upload.single("coverImage"), updateUserCoverImage);
router.route("/channel/:userName").get(varifyJWT, getUserChannlProfile);
router.route("/weatchHistory").get(varifyJWT, getWatchHistory);

export default router;
