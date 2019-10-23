 var mongoose = require("mongoose");
var Comment=require("./comment");

 var campgroundSchema = new mongoose.Schema({
  name: String,
  image: {type:String,default:"https://res.cloudinary.com/dyzh4obz4/image/upload/v1557718103/default/web-POB-Blog-Default_o122op.jpg"},
  imageId: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
  myId:{type:String,default:"123456"},
  author: {
   type: mongoose.Schema.Types.ObjectId,
   ref: "user"
  },

  comments: [{                                        // array of comments for each campground
   type: mongoose.Schema.Types.ObjectId,              // have to push the created comment into the comments array of associated campground  
   ref: "comment"                                     //save the campground
  }]

  
 });

 
 campgroundSchema.pre("remove",async function(next){    //delete associated comments of the deleted campground
  try{
      
    await  Comment.remove({
        "_id":{
            $in:this.comments
        }
    });
    next();

  }catch(err){

    next(err);  
  }
 });
 
 
 module.exports = mongoose.model("campground", campgroundSchema);
 