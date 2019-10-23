var mongoose = require("mongoose");
var User = require("./user");


var notificationSchema = new mongoose.Schema({

    username: String,
    isRead: { type: Boolean, default: false },
    campground: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "campgrounds"
    }

});



module.exports = mongoose.model("notification", notificationSchema);