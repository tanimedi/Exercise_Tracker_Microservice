const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
var mongo = require("mongodb");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//Exercise Tracker

const exerciseSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: String
});

const userSchema = new mongoose.Schema({
  username: String,
  log: [exerciseSchema]
});

const user = mongoose.model("user", userSchema);
const exercise = mongoose.model("exercise", exerciseSchema);

app.post("/api/users", (req, res) => {
  let username = req.body.username;
  const newUser = new user({
    username: username
  });

  newUser.save((err, savedNewUser) => {
    if (err) {
      console.log(err);
    } else {
      res.json({
        username: savedNewUser.username,
        _id: savedNewUser.id
      });
    }
  });
});

app.get("/api/users", (req, res) => {
  user.find({}, (err, userArray) => {
    if (err) {
      console.log(err);
    } else {
      res.json(userArray);
    }
  });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  let description = req.body.description;
  let duration = req.body.duration;
  let date = new Date(req.body.date).toDateString();

  const loggedExercise = new exercise({
    description: description,
    duration: duration,
    date: date
  });

  if (loggedExercise.date === "Invalid Date") {
    loggedExercise.date = new Date().toDateString();
  }

  loggedExercise.save();

  user.findOne({ _id: req.params._id }, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      foundUser.log.push(loggedExercise);
      foundUser.save();
      res.json({
        _id: foundUser.id,
        username: foundUser.username,
        date: loggedExercise.date,
        duration: loggedExercise.duration,
        description: loggedExercise.description
      });
    }
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  let fromDate = req.query.from || "1980-01-01";
  let toDate = req.query.to || new Date();
  let limit = req.query.limit;

  user.findOne(
    {
      _id: req.params._id
    },
    (err, foundUser) => {
      if (err) {
      } else {
        foundUser.log = foundUser.log.filter((filteredLog) => {
          return (
            new Date(filteredLog.date) >= new Date(fromDate) &&
            new Date(filteredLog.date) <= new Date(toDate)
          );

        });

        foundUser.log = foundUser.log.slice(0, limit);
        let exerciseCount = foundUser.log.length;
        res.json({
          _id: foundUser.id,
          username: foundUser.username,
          from:  new Date(fromDate).toDateString(),
          to: new Date(toDate).toDateString(),
          count: exerciseCount,
          log: foundUser.log
        });
      }
    }
  );
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
