import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
// use mathord useFor using middleware or confarigations

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser()); // ami maj mkane cooke acsec korta par6i sob jay gay

// routes

// routes import

import userRouter from "./routes/user.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import commentRouter from "./routes/comment.routes.js";
import videoRouter from "./routes/video.routes.js";
import likeRouter from "./routes/like.routes.js";
// akane  routs sa agar moto hoba na ok akan ala karon ono gay gay taka amara import kora rout nia as6i
// rout ka anar jono middware anta hoba

app.use("/api/v1/users", userRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/like", likeRouter);

// http://localhost:8080/api/v1/users/register

export { app };
