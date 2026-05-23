const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
require("dotenv").config();
// Initialize cloudinary (config is in config/cloudinary.js)
require("./config/cloudinary");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
app.set("trust proxy", 1);
const server = http.createServer(app);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:3000"];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use((req, res, next) => {
  req.io = io;
  next();
});
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());

const registerRoute = require("./api/register");
const loginRoute = require("./api/login");
const usersRoute = require("./api/users");
const logoutRoute = require("./api/logout");
const fieldRoute = require("./api/field");
const facilitiesRoutes = require("./api/facilities");
const sportsTypesRoutes = require("./api/sports-types");
const myfieldRoute = require("./api/my-field");
const profile = require("./api/profile");
const posts = require("./api/posts");
const booking = require("./api/booking")(io);
require("./cron/bookingCron")(io);
const reviews = require("./api/reviews");
const statistics = require("./api/statistics");
const search = require("./api/search");
const notification = require("./api/notification");
const following = require("./api/following");
app.get("/", (req, res) => {
  res.send("Welcome to the API");
});

app.use("/register", registerRoute);
app.use("/login", loginRoute);
app.use("/users", usersRoute);
app.use("/logout", logoutRoute);
app.use("/facilities", facilitiesRoutes);
app.use("/sports_types", sportsTypesRoutes);
app.use("/field", fieldRoute);
app.use("/myfield", myfieldRoute);
app.use("/profile", profile);
app.use("/posts", posts);
app.use("/booking", booking);
app.use("/reviews", reviews);
app.use("/statistics", statistics);
app.use("/search", search);
app.use("/notification", notification);
app.use("/following", following);
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_room", (userId) => {
    socket.join(userId.toString());
    console.log(`User joined room: ${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
