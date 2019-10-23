var express = require('express');
var router = express.Router({
  mergeParams: true
});

var Campground = require('../models/campground');
var Comment = require('../models/comment');
var middlewareObj = require('../middleware'); //express automatically considers index to make use of

//middleware for all the routes
router.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

// ======================
// COMMENTS ROUTES
//=======================

router.get('/campgrounds/:id/comments/new', middlewareObj.isLoggedIn, function (
  req,
  res
) {
  var id = req.params.id;

  Campground.findById(req.params.id)
    .populate([{
        path: 'author'
      },
      {
        path: 'comments',
        populate: {
          path: 'author',
          model: 'user'
        }
      }
    ])
    .exec(function (err, foundCampground) {
      if (err) {
        console.log(err);
      } else {
        res.render('comments/new', {
          campground: foundCampground
        });
      }
    });
});

router.post('/campgrounds/:id/comments', middlewareObj.isLoggedIn, function (
  req,
  res
) {
  //comment schema has comment text and author ==> associated to users schema

  var commentText = req.body.comment.text;

  Campground.findById(req.params.id)
    .populate([{
        path: 'author'
      },
      {
        path: 'comments',
        populate: {
          path: 'author',
          model: 'user'
        }
      }
    ])
    .exec(function (err, foundCampground) {
      if (err || !foundCampground) {
        req.flash('error', 'Campground not found');
        res.redirect('back');
      } else {

        var newComment = {
          author: req.user._id, //author is referenced to user schema and hence assigneed req.user to author
          text: commentText
        };


        Comment.create(newComment, function (err, createdComment) {
          if (err) {
            console.log(err);
          } else {
            foundCampground.comments.push(createdComment._id); //push the created comment into the campground document
            foundCampground.save();
            res.redirect('/campgrounds/' + req.params.id);
          }
        });
      }
    });
});

//EDIT Route
router.get(
  '/campgrounds/:id/comments/:comment_id/edit',
  middlewareObj.checkCommentAuthorized,
  function (req, res) {
    Campground.findById(req.params.id)
      .populate([{
          path: 'author'
        },
        {
          path: 'comments',
          populate: {
            path: 'author',
            model: 'user'
          }
        }
      ])
      .exec(function (err, foundCampground) {
        if (err || !foundCampground) {
          req.flash('error', 'campground not found');
          return res.redirect('back');
        }
        Comment.findById(req.params.comment_id, function (err, foundComment) {
          if (err || !foundComment) {
            req.flash('error', 'Comment not found');
            res.redirect('back');
          } else {
            res.render('comments/edit', {
              comment: foundComment,
              campgroundId: req.params.id
            });
          }
        });
      });
  }
);

//UPDATE Route
router.put(
  '/campgrounds/:id/comments/:comment_id',
  middlewareObj.checkCommentAuthorized,
  function (req, res) {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function (
      err,
      updatedcomment
    ) {
      if (err || !updatedcomment) {
        req.flash('error', 'Comment not found');
        res.redirect('back');
      } else {
        res.redirect('/campgrounds/' + req.params.id);
      }
    });
  }
);

//DELETE ROUTE
router.delete(
  '/campgrounds/:id/comments/:comment_id',
  middlewareObj.checkCommentAuthorized,
  function (req, res) {
    Comment.findByIdAndRemove(req.params.comment_id, function (err) {
      if (err) {
        console.log(err);
        res.redirect('back');
      } else {
        res.redirect('/campgrounds/' + req.params.id);
      }
    });
  }
);

module.exports = router;