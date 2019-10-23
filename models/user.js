var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({

    firstName: String,
    lastName: String,
    username: { type: String, unique: true },
    email: { type: String, required: true, unique: true },
    image: { type: String, default: "https://res.cloudinary.com/dyzh4obz4/image/upload/v1557717753/default/default-avatar_rj4szw.png" },
    imageId: { type: String, default: "web-POB-Blog-Default_o122op" }, //for deleting and updating images in cloudinary
    password: String,
    about: String,
    hobbies: String,
    createdAt: { type: Date, default: Date.now },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    confirmed: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },


    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],

    following:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"user"

        }

    ],

    notifications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "notification"
    }]

});


userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("user", userSchema);
