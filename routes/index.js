var express = require("express");
var router = express.Router({ mergeParams: true });
var passport = require("passport");
var User = require("../models/user");
var middleware = require("../middleware");   //file name index.js in middleware so no need to call it
var passportLocalMongoose = require("passport-local-mongoose");
require('dotenv').config();

//resest password and verification mail
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");


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
    api_secret:  process.env.API_SECRET//process.env.CLOUDINARY_API_SECRET
});



//middleware for all the routes
router.use(function (req, res, next) {

    res.locals.currentUser = req.user;
    next();
});


// LANDING PAGE
router.get("/", function (req, res) {

    res.render("landingpage");

});




//Auth Routes

router.get("/register", function (req, res) {

    res.render("register");
   
});



// Register Routes
router.post("/register", upload.single("image"), async function (req, res) {

    if (req.file) {    //branch to take if user uploads an image 
        try {
            var result = await cloudinary.v2.uploader.upload(req.file.path, { folder: "user" });

            var newUser = new User({ username: req.body.username, about: req.body.about, hobbies: req.body.hobbies, firstName: req.body.firstname, lastName: req.body.lastname, email: req.body.email, image: result.secure_url, imageId: result.public_id });

        } catch (err) {

            req.flash("error", err.message);
            res.redirect("back");
        }

    } else { //branch when user doesnot upload an image

        var newUser = new User({ username: req.body.username, about: req.body.about, hobbies: req.body.hobbies, firstName: req.body.firstname, lastName: req.body.lastname, email: req.body.email });

    }

    if (req.body.password === req.body.confirm) {

        await User.register(newUser, req.body.password, async function (err, user) {

            if (err) {

                req.flash("error", err.message);
                res.redirect("/register");

            }
            else {
                try {
                    let buf = await crypto.randomBytes(20);                 //create buffer token
                    var token = buf.toString("hex");                        //conver it to string
                    user.resetPasswordToken = token;                        //setting the values of the token
                    user.resetPasswordExpires = Date.now() + 3600000;       //password expires in 1 hour
                    var user = await user.save();

                } catch (err) {
                    req.flash("error", err.message);
                    res.redirect("/campgrounds");
                }


                // await user.save(function (err, user) {
                //     if (err) {
                //         req.flash("error", "Issue saving the user details");
                //         return res.redirect("/campgrounds");
                //     }





                var smtpTransport = nodemailer.createTransport({

                    service: 'Gmail',
                    auth: {
                        user: process.env.REG_EMAIL,
                        pass: process.env.REG_PASSWORD                 //hide it

                    }

                });


                var mailOptions = {

                    to: user.email,
                    from: process.env.REG_EMAIL,
                    subject: "User Verification",
                    text: "'You are receiving this because you (or someone else) have requested for an account or for a Password reset.\n\n" +
                        "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
                        "http://" + req.headers.host + "/" + token + "\n\n" +
                        "If you did not request this, please ignore this email.\n'"

                };


                await smtpTransport.sendMail(mailOptions, function (err) {
                    if (err) {

                        req.flash("error", err.message);
                        return res.redirect("/campgrounds");
                    }

                    req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                    res.redirect("/campgrounds")

                });


            }
        });

    } else {

        req.flash("error", "password doesnt match");
        res.redirect("/register");

    }

});



//login Routes
router.get("/login", function (req, res) {
    res.render("login");
});


router.post("/login", middleware.isConfirmed, passport.authenticate("local", {

    successRedirect: "/campgrounds",
    failureRedirect: "/login",
    failureFlash: true,
    successFlash: "Login Successful"

}), function (req, res) {

});



//logout routes
router.get("/logout", function (req, res) {
    req.logout();
    req.flash("success", "Logged Out Successfully")
    res.redirect("/campgrounds")

});


router.get("/forgot", function (req, res) {

    res.render("user/forgot");
});


//Verification Route
router.get("/:token", function (req, res) {

    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, foundUser) {

        if (err||!foundUser) {

            req.flash("error", "No user found or token expired");
            return res.redirect("/");
        }

        foundUser.confirmed = true;
        foundUser.save();


        req.login(foundUser, function (err) {

            if (err) {z

                req.flash("error", "verification failed - Link expired");
                res.redicrect("/campgrounds");
            }

            if(req.user.username===process.env.ADMIN){
  
                foundUser.isAdmin=true;
        
            }

            req.flash("success", "Registration successful ,Welcome to Yelpcamp " + foundUser.username);
            res.redirect("/campgrounds");

        });

    });

});



//Routes for Password Reset

router.post("/forgot", async function (req, res) {

    var email = req.body.email;

    try {
        await User.findOne({ email: email },async function(err,foundUser){
            if(err||!foundUser){

                req.flash("error","No Such User");
                return res.redirect("back");
            }


        //generate token
        var buf = await crypto.randomBytes(20);
        var token = buf.toString("hex");
        foundUser.resetPasswordToken = token;
        foundUser.resetPasswordExpires = Date.now() + 3600000;
        var user=await foundUser.save();

        var smtpTransport = nodemailer.createTransport({

            service: 'Gmail',
            auth: {
                user: process.env.REG_EMAIL,
                pass: process.env.REG_PASSWORD                    //hide it

            }

        });


        var mailOptions = {

            to: email,
            from: process.env.REG_EMAIL,
            subject: "Password Reset",
            text: "'You are receiving this because you (or someone else) have requested for an account or for a Password reset.\n\n" +
                "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
                "http://" + req.headers.host + "/reset/" + token + "\n\n" +
                "If you did not request this, please ignore this email.\n'"

        };


        await smtpTransport.sendMail(mailOptions, function (err) {
            if (err) {
                req.flash("error", err.message)
                return res.redirect("back");
            }
            console.log("mail Sent");
            req.flash("verification mail sent for password reset")
            res.redirect("back")

        });

        });

    } catch (err) {

        req.flash("error", err.message)
        return res.redirect("back");

    }

});


router.get("/reset/:token", function (req, res) {

    User.findOne({resetPasswordToken:req.params.token, resetPasswordExpires: { $gt: Date.now()}},function(err,foundUser){
       
        if(err||!foundUser){

            req.flash("error","Invalid User or Token Expired");
            return res.redirect("back");
        }

        foundUser.confirmed=false;
        foundUser.save();
        res.render("user/passwordReset",{token:req.params.token});
    }); 
});


router.post("/reset/:token",async function(req,res){

if(req.body.password===req.body.confirm){

await User.findOne({resetPasswordToken:req.params.token, resetPasswordExpires: { $gt: Date.now() }},async function(err,foundUser){

    if(err||!foundUser){

        req.flash("error","Not a Valid User/Token expired");
        return res.redirect("back");
    }


     await foundUser.setPassword(req.body.password,async function(err){     //updating with new password
        if(err){

            req.flash("error","Password set failed");
            return res.redirect("back");

        }
        // foundUser.resetPasswordExpires=undefined;
        // foundUser.resetPasswordToken=undefined;
        foundUser.confirmed=true; 

       await foundUser.save(async function(err){
    
            if(err){
    
                req.flash("error","error saving the user data");
                return res.redirect("back");
            }
    
            req.flash("success","Password changed successfully");
            res.redirect("/campgrounds");

            await req.logIn(foundUser,function(err){                     //after password set ,the current user is logged in

                if(err){

                    req.flash("error","logged In");
                    res.redirect("back");
                }

            });
    
        });
                  
            
    });


});

}else{
    
    req.flash("error","password didnot match")
    res.redirect("back");
}

});



module.exports = router;
