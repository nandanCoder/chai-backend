import { Router } from "express";
import { varifyJWT } from "../middlewares/auth.middleware.js";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  updatePlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();
router.use(varifyJWT); // for all route

router.route("/create").post(createPlaylist);
router.route("/").get(getUserPlaylists);
router.route("/add/:playlistId/:videoId").get(addVideoToPlaylist);
router
  .route("/:playlistId")
  .get(getPlaylistById) // not done
  .patch(updatePlaylist)
  .delete(deletePlaylist);

export default router;
