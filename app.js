const express = require("express"),
    app = express(),
    ejs = require("ejs"),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    flash = require("connect-flash"),
    passport = require("passport"),
    localStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    Campground = require("./models/campground"),
    Comment = require("./models/comment"),
    User = require("./models/user"),
    seedDb = require("./seed");



var campgroundRoutes = require("./routes/campground"),
    commentRoutes = require("./routes/comments"),
    indexRoutes = require("./routes/index"),
    userRoutes = require("./routes/user");



const mongoURI = "mongodb://localhost:27017/yelp_camp";
mongoose.connect(mongoURI, { useNewUrlParser: true });

app.use(bodyParser.json());                          //parsing of json encoded data
app.use(bodyParser.urlencoded({ extended: true })); //parsing of form data
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method")); //method overide
app.use(flash()); // flash requires express-session to be configured to be in use


app.listen(3000, function () {

    console.log("***BlogHouse server is up and Running!!***")
});

app.use(require("express-session")({

    secret: "This is my key",
    resave: false,
    saveUninitialized: false

}));



//middleware for all the routes
app.use(function (req, res, next) {

    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});






//passport config 
//==================================================================


app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//=====================================================================


app.use(campgroundRoutes);
app.use(commentRoutes);
app.use(indexRoutes);
app.use(userRoutes);

 //seedDb();
