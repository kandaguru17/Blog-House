var express = require("express");
var router = express.Router({ mergeParams: true }); //merge params is used to include the params.id whilst being passed from app.use
var mongoose = require("mongoose");
var moment = require("moment");
var Comment = require("../models/comment");
var Campground = require("../models/campground");
var User = require("../models/user");
var Notification = require("../models/notifications");
var middlewareObj = require("../middleware"); //express automatically considers index to make use of 
require("dotenv").config();


// campground Routes
//  
//index : /campgrounds
//new   : /campgrounds/new     GET
//create:/campgrounds          POST   create{}
//show  :/campgrounds/:id      GET    findById{}
//edit  :/campgrounds/:id/edit GET     
//update:/campgrounds/:id      PUT    findByIdAndUpdate{}
//Delete:/campgrounds/:id      DELETE findByIdAndRemove{}


//============================================================================================================================================================
//Multer configuration to upload local files

// var crypto = require("crypto");
// var multer = require("multer");
// var gridFsStorage = require("multer-gridfs-storage");
// var grid = require("gridfs-stream");
// var path = require("path");

// const mongoURI = "mongodb://localhost:27017/yelp_camp";
// const conn = mongoose.createConnection("mongodb://localhost:27017/yelp_camp"); //create connection returns connection isntance but connect is just conection

// let gfs;

// conn.once('open', function() {
//  // Init stream

//  gfs = grid(conn.db, mongoose.mongo);
//  gfs.collection('uploads');
// });



// const storage = new gridFsStorage({
//  url: mongoURI,
//  file: function(req, file) {
//   return new Promise((resolve, reject) => {
//    crypto.randomBytes(16, (err, buf) => {
//     if (err) {
//      return reject(err);
//     }
//     const filename = buf.toString('hex') + path.extname(file.originalname);
//     const fileInfo = {
//      filename: filename,
//      bucketName: 'uploads'
//     };
//     resolve(fileInfo);
//    });
//   });
//  }
// });

// const upload = multer({ storage });


//============================================================================================================================================================

//Multer config
var multer = require('multer');

var storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, Date.now() + file.originalname);  //file name config
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


router.use(async function (req, res, next) {
    try {
        if (req.user) {

            var user = await User.findById(req.user._id).
                populate({
                    path: "notifications",
                    populate: { path: "campground", model: "campground" }, match: { isRead: false }
                }).exec();

            res.locals.notifications = user.notifications.reverse();    //sending out the notification arrry to all the rendererd pages
        }

    } catch (err) {

        console.log(err.message)
    }
    res.locals.currentUser = req.user;
    res.locals.moment = moment;
    next();
});


function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


//INDEX ROUTE
router.get("/campgrounds", function (req, res) {

    if (req.query.search) {  //req.querey is obtained as a result of GET request from the fuzzy search form

        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({ $or: [{ name: regex }, { description: regex }] }).populate("author").exec(function (err, allCampgrounds) {

            if (err) {
                console.log(err);
            }
            else {
             
                if (allCampgrounds.length < 1) {

                    req.flash("error", "no Blogs Found")
                    return res.redirect("back");
                }
                res.render("campgrounds/index", { campgrounds: allCampgrounds });
            }
        });

    } else {

        Campground.find({}).populate("author").exec(function (err, allCampgrounds) {

            if (err) {
                console.log(err);

            }
            else {
                res.render("campgrounds/index", { campgrounds: allCampgrounds });
            }
        });
    }


});






//NEW ROUTE
router.get("/campgrounds/new", middlewareObj.isLoggedIn, function (req, res) {

    res.render("campgrounds/new");
});





//POST ROUTE
router.post("/campgrounds", middlewareObj.isLoggedIn, upload.single("image"), async function (req, res) {

    //cloudinary code to upload the image in the cloud


    if (req.file) {   //when a new file is uploaded 

        try {

            var result = await cloudinary.v2.uploader.upload(req.file.path, { folder: "Campgrounds" });
        }
        catch (err) {

            req.flash("error", err.message);
            res.redirect("back");

        }

        var newCampground = { name: req.body.campground.name, image: result.secure_url, description: req.body.campground.description, author: req.user, imageId: result.public_id };

    } else {

        //default image_url and image_id when there is no image uploaded by the user
        var defaultImageUrl = "https://res.cloudinary.com/dyzh4obz4/image/upload/v1557718103/default/web-POB-Blog-Default_o122op.jpg";
        var defaultImageId = "web-POB-Blog-Default_o122op";

        var newCampground = { name: req.body.campground.name, image: defaultImageUrl, description: req.body.campground.description, author: req.user, imageId: defaultImageId };
    }


    await Campground.create(newCampground, async function (err, newCampground) {

        if (err) {

            console.log("error", err.message);
        }
        else {

            var newNotification = {

                username: newCampground.author.username,
                campground: newCampground

            }

            var createdNotification = await Notification.create(newNotification);             //notification created in notification schema
            var foundUser = await User.findById(req.user._id).populate("followers").exec();  //populating the user schema with all its followers

            //tricky part
            foundUser.followers.forEach(function(followingUser) {             //iterating through all the followers which is referenced to user                                                                      schema which has notifications
                followingUser.notifications.push(createdNotification);
                followingUser.save();

            });

            req.flash("success", "Blog Created Successfully")
            res.redirect("/campgrounds");

        }

    });

});







//SHOW ROUTE
router.get("/campgrounds/:id", function (req, res) {

    Campground.findById(req.params.id).populate([{ path: "author" }, {
        path: "comments",
        populate: { path: "author", model: "user" }
    }]).exec(function (err, foundCampground) { // findByID to get an item based on id generated by the mongoose db

        if (err || !foundCampground) {

            console.log(err);

            req.flash("error", "Blog not founsd");
            res.redirect("back");
        }
        else {

            res.render("campgrounds/show", { campground: foundCampground });
        }

    });
});



//EDIT Route
router.get("/campgrounds/:id/edit", middlewareObj.checkCampgroundAuthorized, function (req, res) {

    Campground.findById(req.params.id).populate([{ path: "author" }, {
        path: "comments",
        populate: { path: "author", model: "user" }
    }]).exec(function (err, foundCampground) {

        if (err || !foundCampground) {

            req.flash("error", "Blog not found");
            res.redirect("back");
        }
        else {

            res.render("campgrounds/edit", { campground: foundCampground });
        }

    });

});



//UPDATE route
router.put("/campgrounds/:id", middlewareObj.checkCampgroundAuthorized, upload.single("image"), function (req, res) {

    Campground.findById(req.params.id, async function (err, foundCampground) {

        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }


        if (req.file) { //if a file is  uploaded i.e file is available for multer

            try {

                await cloudinary.v2.uploader.destroy(foundCampground.imageId);     //pass the image ID found in the result object of cloudinary API
                var result = await cloudinary.v2.uploader.upload(req.file.path, { folder: "Campgrounds" });
                foundCampground.imageId = result.public_id;
                foundCampground.image = result.secure_url;
                foundCampground.save();


            }
            catch (err) {

                req.flash("error", err.message);
                return res.redirect("back");

            }
        }


        var newCampground = {
            name: req.body.campground.name,
            image: foundCampground.image,               // takes the existing value when not set in the if(req.file) block
            imageId: foundCampground.imageId,           // takes the existing value when not set in the if(req.file) block
            description: req.body.campground.description,
            author: req.user
        };


        Campground.findByIdAndUpdate(req.params.id, newCampground, function (err, updatedCampground) {

            if (err) {
                return res.redirect("back");
            }

            req.flash("success", "successfully updated!!")
            res.redirect("/campgrounds/" + req.params.id);
     
        });

    });

});




//delete route
router.delete("/campgrounds/:id", middlewareObj.checkCampgroundAuthorized, function (req, res) {
    Campground.findById(req.params.id, async function (err, foundCampground) {

        if (err) {
            req.flash("error", err.message);
            return res.redirect("back")
        }

        try {

            await cloudinary.v2.uploader.destroy(foundCampground.imageId);  //====> Remove image from cloudinary  
            await foundCampground.remove();                                //======> remove blog from the campground db
            var foundNotification = await Notification.findOneAndDelete({ campground: req.params.id });  //===> Remove corresponding notification


//==============    Remove orphaned references from the notification array     ===============================       
            
            var foundUser = await User.findById(req.user._id);            
            foundUser.followers.forEach(async function (follower) {   
            var followingUser = await User.findById(follower);                  //iterate through all the followers and the remove 
            followingUser.notifications.pop(foundNotification._id);             //notification Id corresponding to the deleted campground 
            await followingUser.save();                                         //from notifications array in user document
              
            });
//===========================================================================================================            

            req.flash("success", "Blog deleted successfully")
            res.redirect("/campgrounds");

        }catch (err) {

            req.flash("error", err.message);
            return res.redirect("back")

        }

    });

});


module.exports = router;
