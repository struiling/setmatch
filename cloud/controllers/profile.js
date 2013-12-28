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
	var user = Parse.User.current();
	for (var key in req.body) {
		user.set(key, req.body[key]);
	}

	user.set("username", req.body.email);
	user.save().then( function(success) {
		res.redirect("profile/edit");
	}, function(error) {
		res.flash('message', 'Oops! There was a problem saving your profile.');
		res.redirect("profile/edit");
	});
};

exports.view = function(req, res) {

	var user = Parse.User.current();
	//var userGroups;
	//var userProfile;
	//var userInvites;
	//user.fetch();

	var query = new Parse.Query(Parse.User);
	query.include("groups");
	query.include("profile");
	query.get(user.id);
	query.first().then( function(result) {
		var userGroups = result.get("groups");
		var userProfile = result.get("profile");
		Parse.Cloud.run("getInvites", { invites: user.get("invites") }).then( function(invites) {
		    res.render("profile", { user: user, groups: userGroups, invites: invites, profile: userProfile });
		});
	}, function(error) {
		res.redirect("logout");
	});
/*	}).then( function(userInvites) {
		console.log("userInvites: " + JSON.stringify(userInvites));	
		return {groups: userGroups, profile: userProfile, invites: userInvites};
	}).then( function(userData) {
		console.log("userData.invites: " + JSON.stringify(userData.invites));
	    res.render("profile", { user: user, groups: userData.groups, invites: userData.invites, profile: userData.profile });
	}, function(error) {
		res.redirect("logout");
	});*/
};