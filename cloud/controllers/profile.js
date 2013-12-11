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
	var userGroups;
	var userInvites;
	//user.fetch();

	//TODO: get user's profile info

	// TODO: get user's groups
	if (user.get("groups")) {
		//var query = new Parse.Query(Parse.User);
		var relation = user.relation("groups");
		relation.query().find().then( function(results) {
			console.log("group relation: " + JSON.stringify(results));
			userGroups = results;

			if (user.get("invites")) {

				userInvites = Parse.Cloud.run("getInvites", { invites: user.get("invites") });
			}
			return userInvites;
			
		}).then( function(userInvites) {
			res.render("profile", { user: user, groups: userGroups, invites: userInvites });
		});
    } else if (user.get("invites")) {
		console.log("User's invites: " +user.get("invites"));
		
		Parse.Cloud.run("getInvites", { invites: user.get("invites")}, { 
			success: function(userInvites) {
				res.render("profile", { user: user, invites: userInvites });
			},
			error: function(error) {

			}
		});
	} else {
		res.render("profile", { user: user });
	}

	
	

	/*}).then( function() {		
    	
    },
    function(error) {
    	// Render error page.
    	console.log("Problem retrieving user information");
    });*/

};