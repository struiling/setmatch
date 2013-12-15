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
	var userProfile;
	//user.fetch();

	var query = new Parse.Query(Parse.User);
	query.include("groups");
	query.include("profile");
	query.get(user.id);
	query.first().then( function(result) {
		userGroups = result.get("groups");
		userProfile = result.get("profile");

		return Parse.Cloud.run("getInvites", { invites: user.get("invites") });
	}).then( function(userInvites) {
		console.log("userProfile: "+ JSON.stringify(userProfile));
		res.render("profile", { user: user, groups: userGroups, invites: userInvites, profile: userProfile });
	});

};