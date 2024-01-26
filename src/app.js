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
app.use(cookieParser());

// routes

// routes import

import userRouter from "./routes/user.routes.js";
// akane  routs sa agar moto hoba na ok akan ala karon ono gay gay taka amara import kora rout nia as6i
// rout ka anar jono middware anta hoba

app.use("/api/v1/users", userRouter);

// http://localhost:8080/api/v1/users/register

export { app };
