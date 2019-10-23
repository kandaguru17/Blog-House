var middlewareObj = {};
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var User=require("../models/user");

middlewareObj.isLoggedIn = function(req, res, next) {

    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "Please Login First!");
    res.redirect("/login");


}


middlewareObj.checkCampgroundAuthorized = function(req, res, next) {
    
    if (req.isAuthenticated) {
        Campground.findById(req.params.id, function(err, foundCampground) {

            if (err||!foundCampground) {

                req.flash("error", "campground not found");
                res.redirect("back");

            }
            else {

                if (foundCampground.author._id.equals(req.user._id) || (req.user.isAdmin)) {

                    next();

                }
                else {
                    req.flash("error", "you dont have the permission to do that");
                    res.redirect("/campgrounds");
                }

            }

        });
    }
    else {

        req.flash("error", "Please signup or login!!")
        res.redirect("back");
    }

}


middlewareObj.checkCommentAuthorized = function(req, res, next) {


    if (req.isAuthenticated()) {


        Comment.findById(req.params.comment_id, function(err, foundComment) {
            if (err || !foundComment) {
                req.flash("error", "Comment not found");
                res.redirect("back");
            }
            else {

                if (foundComment.author._id.equals(req.user._id) || (req.user.isAdmin)) { //checking if the user is authorized

                    next();
                }
                else {
                    req.flash("error", "you dont have the permission to do that");
                    res.redirect("back");
                }


            }
        });

    }
    else {

        req.flash("error", "Please signup or login!!")
        res.redirect("back");
    }


}


middlewareObj.isConfirmed=function(req,res,next){

    User.findOne({username:req.body.username},function(err,foundUser){

        if(!foundUser||err){

            req.flash("error", "Invalid Credentials");
            return res.redirect("back");

        }

            if(foundUser.confirmed){
                 next();
                 
            }else{

                req.flash("error", "Please verfiy your email")
                res.redirect("back");
            }


    });



}






module.exports = middlewareObj;
