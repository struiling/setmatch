var _ = require('underscore');
var Group = Parse.Object.extend("Group");
var Profile = Parse.Object.extend("Profile");
var Invitation = Parse.Object.extend("Invitation");

exports.edit = function(req, res) {
	
	Parse.User.current().fetch().then(function(user) {
        res.render("profile-edit", { user: user });
    },
    function(error) {
    	// Render error page.
    	console.log("Problem retrieving user information");
    });
	
};

exports.save = function(req, res) {

	Parse.Cloud.run("checkUser", {}, {
		success: function(user) {
			for (var key in req.body) {
				user.set(key, req.body[key]);
			}
			user.set("username", req.body.email);
			user.save();

			res.redirect("profile/edit");
		},
		error: function(error) {
			res.redirect("/logout");
		}
	});

};

exports.view = function(req, res) {

	var user = Parse.User.current();
	//user.fetch();
	console.log("user = " + JSON.stringify(user));

	if (user.get("invites")) {
		console.log("invites: " +user.get("invites"));
		var query = new Parse.Query(Group);
		query.containedIn("objectId", user.get("invites"));
		query.find().then( function(invites) {
			console.log("group results: " + JSON.stringify(invites));

			if (user.get("groups")) {

			}

			res.render("profile", { user: user, invites: invites });
		}).then( function() {		
    		
	    },
	    function(error) {
	    	// Render error page.
	    	console.log("Problem retrieving user information");
	    });
	}

	/*}).then( function() {		
    	
    },
    function(error) {
    	// Render error page.
    	console.log("Problem retrieving user information");
    });*/

};