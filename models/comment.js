var mongoose = require("mongoose");

var commentSchema = new mongoose.Schema({

    author: {

        type: mongoose.Schema.Types.ObjectId,
        ref: "user"

    },

    text: String,
    createdAt: { type: Date, default: Date.now }

});


module.exports = mongoose.model("comment", commentSchema);
