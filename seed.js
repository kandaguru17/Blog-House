var mongoose = require("mongoose"),
    Campground = require("./models/campground"),
    Comment = require("./models/comment");


var defaultCampgrounds = [

    {
        name: "camper nightsky",
        image: "https://farm9.staticflickr.com/8167/7121865553_e1c6a31f07.jpg",
        description: "In the United States counselors for residential camps are typically drawn from older teens and college-aged adults (early 20s) because of the temporary, seasonal and low-paying aspects of the work. International staff are often hired alongside their American counterparts through agencies who vet the staff beforehand. Overall camp supervision is typically done by older camp directors, who lead a team that includes cooks, sports instructors, a nurse, maintenance personnel and counselors. The director and the maintenance personnel have a longer-term affiliation with the summer camp. Professional camp staff organize preparation of facilities and supplies for the camp season and supervise the maintenance of the camp during the off-season. Camp directors conduct the hiring of seasonal counselors, instructors, and support staff, often during job fairs held on campuses or on online job boards"

    },
    {

        name: "Nighter Boom",
        image: "https://farm9.staticflickr.com/8167/7121865553_e1c6a31f07.jpg",
        description: "In the United States counselors for residential camps are typically drawn from older teens and college-aged adults (early 20s) because of the temporary, seasonal and low-paying aspects of the work. International staff are often hired alongside their American counterparts through agencies who vet the staff beforehand. Overall camp supervision is typically done by older camp directors, who lead a team that includes cooks, sports instructors, a nurse, maintenance personnel and counselors. The director and the maintenance personnel have a longer-term affiliation with the summer camp. Professional camp staff organize preparation of facilities and supplies for the camp season and supervise the maintenance of the camp during the off-season. Camp directors conduct the hiring of seasonal counselors, instructors, and support staff, often during job fairs held on campuses or on online job boards!!!!!"
    },

]


var defaultComments = [{
        username: "james",
        text: "my first comment"


    }, {

        username: "james",
        text: "my first comment"

    }

];



async function seedDb() {


    await Campground.remove({});
    console.log("campground removed");
    await Comment.remove({});
    console.log("comments removed");

    // for (var i = 0; i < defaultCampgrounds.length; i++) {

    //     let campground = await Campground.create(defaultCampgrounds[i]);
    //     console.log("campgrounds added");
    //     for (var j = 0; j < defaultComments.length; j++) {

    //         let comment = await Comment.create(defaultComments[j]);
    //         console.log("created comment");
    //         //await Comment.find({})
    //         campground.comments.push(comment);
    //         console.log("comment added to campground");
    //     }

    //Campground.save();
    //     }

    // }
    // catch (err) {

    //     console.log(err);
    // }

}


// function seedDb() {


//     Campground.remove({}, function(err) {

//         Comment.remove({}, function(err) {

//             if (err) {

//                 console.log(err);
//             }
//             else {

//                 console.log("comments removed");
//             }


//         });

//         if (err) {

//             console.log(err);
//         }
//         else {

//             console.log("Campground Removed");
//             //Add Campground

//             defaultCampgrounds.forEach(function(campground) {

//                 Campground.create(campground, function(err, addedCamp) {

//                     if (err) {

//                         console.log(err);
//                     }
//                     else {

//                         console.log("campground Added");

//                         //Add Comment
//                         defaultComments.forEach(function(comments) {

//                             Comment.create(comments, function(err, addedcomment) {
//                                 if (err) {

//                                     console.log(err);

//                                 }
//                                 else {
//                                     console.log("comments Added");
//                                     addedCamp.comments.push(addedcomment);
//                                     addedCamp.save();

//                                 }

//                             });

//                         });



//                     }

//                 });




//             });




//         }

//     });

// }


module.exports = seedDb;
