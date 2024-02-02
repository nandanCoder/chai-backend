import { Router } from "express";
import { varifyJWT } from "../middlewares/auth.middleware.js";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

router.use(varifyJWT);

router.route("/upload").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishVideo
);
router.route("/video-by-id/:id").get(getVideoById);
router.route("/delete-video/:id").get(deleteVideo);
router.route("/").get(getAllVideos);
router.route("/update-video").post(updateVideo);
router.route("/toggle-publish/:id").get(togglePublishStatus);

export default router;
