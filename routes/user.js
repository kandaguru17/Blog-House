var express = require("express");
var router = express.Router({ mergeParams: true });
var mongoose = require("mongoose");
var User = require("../models/user");
var middleware = require("../middleware")
var moment = require("moment");
var Comment = require("../models/comment");
var Campground = require("../models/campground");
var Notification=require("../models/notifications");
require("dotenv").config();



//Multer config
var multer = require('multer');

var storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, "Profile_pic_" + Date.now() + file.originalname);  //file name config
    }
});

var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

var upload = multer({ storage: storage, fileFilter: imageFilter })

//cloudinary config
var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY, //process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.API_SECRET //process.env.CLOUDINARY_API_SECRET
});




router.use(function (req, res, next) {

    res.locals.currentUser = req.user;
    res.locals.moment = moment;
    next();

});

//show current user profile
router.get("/user/:id", async function (req, res) {

    try{   
        var userId = req.params.id;
        let foundUser=await User.findById(userId);
        let populatedUser=await User.findById(userId).populate([{path:"followers"},{path:"following"}]).exec();
      
         
        
        res.render("user/show", { user: foundUser,populatedUser});

    
        }catch(err){
    
            console.log(err);
            res.redirect("/campgrounds");
        }

});


// edit route
router.get("/user/:id/edit", middleware.isLoggedIn, function (req, res) {

    User.findById(req.user._id, function (err, foundUser) {

        if (err) {
            req.flash("error", err.message);
            return res.redirect("back")
        }


        res.render("user/edit", { user: foundUser });


    });

});


//update route
router.put("/user/:id", middleware.isLoggedIn, upload.single("image"), async function (req, res) {

    await User.findById(req.params.id, async function (err, foundUser) {

        if (foundUser.imageId === undefined) {

            foundUser.imageId = "default-avatar_jjot1w"
            foundUser.image = "https://res.cloudinary.com/dyzh4obz4/image/upload/v1557117795/default-avatar_jjot1w.png";

        }

        if (req.file) {

            try {

                await cloudinary.v2.uploader.destroy(foundUser.imageId);
                var result = await cloudinary.v2.uploader.upload(req.file.path, { folder: "user" });
                foundUser.image = result.secure_url;
                foundUser.imageId = result.public_id;
                foundUser.save();


            } catch (err) {

                req.flash("error", err.message);
                res.redirect("back");

            }
        }

        var newUser = {

            username: req.body.username,
            about: req.body.about,
            hobbies: req.body.hobbies,
            firstName: req.body.firstname,
            lastName: req.body.lastname,
            email: req.body.email,
            image: foundUser.image,
            imageId: foundUser.imageId

        };



        await User.findByIdAndUpdate(req.user._id, newUser, function (err, updatedUser) {

            if (err || !updatedUser) {

                req.flash("error", err.message);
                return res.redirect("back");
            }


            req.flash("success", "profile updated successfully");
            res.redirect("/user/" + updatedUser._id);


        });



    });


});


//show other user profile from comments
router.get("/comments/:comment_id/user/:user_id", middleware.isLoggedIn,async function (req, res) {

    
    try{
        let foundComment=await Comment.findById(req.params.comment_id);
        let foundUser=await User.findOne(foundComment.author._id);
        let populatedUser=await User.findOne(foundComment.author._id).populate([{path:"followers"},{path:"following"}]).exec(); //to dispalay the followers of the user
        res.render("user/show", { user: foundUser,populatedUser});   

    }catch(err){

        req.flash("error", err.message);
        return res.redirect("back");

    }
});


//show other user profile from campgrounds
router.get("/campgrounds/:id/user/:user_id", middleware.isLoggedIn, async function (req, res) {

    try{
        let foundCampground=await Campground.findById(req.params.id);
        let foundUser=await User.findOne(foundCampground.author._id);
        let populatedUser=await User.findOne(foundCampground.author._id).populate([{path:"followers"},{path:"following"}]).exec(); //to display the details of the followers
        res.render("user/show", { user: foundUser,populatedUser});   

    }catch(err){

        req.flash("error", err.message);
        return res.redirect("back");

    }

});



//User Followers notification Routes
router.get("/follow/:user_id", middleware.isLoggedIn, function (req, res) {

    User.findById(req.params.user_id, async function (err, foundUser) {

        if (err || !foundUser) {

            req.flash("error", "No Such user or User Deleted");
            return res.redirect("/campgrounds");
        }


        try{

            if (foundUser.followers.indexOf(req.user._id) > -1) {                 //if already following the foundUser 

                req.flash("error", "you are already following " + foundUser.firstName)
                res.redirect("back");
    
            } else {

                foundUser.followers.push(req.user._id);                     //add to the followers array of found user
                await foundUser.save();
    
                let currentUser=await User.findById(req.user._id);
                currentUser.following.push(foundUser._id);
                await currentUser.save();
    
    
                req.flash("success", "You are now following " + foundUser.firstName);
                res.redirect("back");
    
            }

        }catch(err){

            console.log(err);
            res.redirect("/campgrounds");
        }

    });
});


//unfollow user
//user_id is the profile user_id
//req.user._id ==> current user

router.get("/unfollow/:user_id",middleware.isLoggedIn, async function (req, res) {

    try {

        //Remove the current user from the followers array of the found user
        var foundUser = await User.findById(req.params.user_id).populate("notifications").exec();
        foundUser.followers.pop(req.user._id);
        foundUser.save(function(err){
            if(err){

                req.flash("error",err.message);
                return res.redirect("back")

            }

        
            req.flash("success", "You have unfollowed " + foundUser.firstName);
            res.redirect("back");

        });
        



        //Remove corresponding notifications

        var foundUsername = foundUser.username;
        var currentUser = await User.findById(req.user._id).populate("notifications").exec();
        var currentNotifications = currentUser.notifications.filter(obj => obj.username !== foundUsername)  //removing the notificaitons of the                                                                                                         unfollowed user
        currentUser.notifications = currentNotifications;
        currentUser.following.pop(foundUser._id);
        await currentUser.save();




    } catch (err) {

        console.log(err.message);

    }


    //remove notifications from the follower
});



//Show all notifications
router.get("/view/notifications",async function(req,res){

try{

    let foundUser=await User.findById(req.user._id).
    populate({path: "notifications",
     populate: { path: "campground", model: "campground"}}).exec();
   
     let allNotifications=foundUser.notifications;


    res.render("notifications/index",{allNotifications});

}catch(err){

    console.log(err.message);
    res.redirect("back");
}


});


//notifiations handling
router.get("/notifications/:notification_id",middleware.isLoggedIn,function(req,res){
    
Notification.findById(req.params.notification_id,function(err,foundNotification){

if(err||!foundNotification){

    req.flash("error","Notification not found");
    return res.redirect("back");
}

    foundNotification.isRead=true;
    foundNotification.save();
    res.redirect("/campgrounds/"+foundNotification.campground._id)

});

});


module.exports = router;
