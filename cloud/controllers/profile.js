var _ = require('underscore');
var settings = require('cloud/settings');
var Group = Parse.Object.extend("Group");
var Profile = Parse.Object.extend("Profile");
var Invitation = Parse.Object.extend("Invitation");

exports.edit = function(req, res) {
	Parse.Cloud.run("getProfileData", {}).then( 
		function(results) {
		    res.render("profile-edit", { 
		    	user: results.user,
		    	customGroups: results.customGroups, 
		    	globalGroup: results.globalGroup, 
		    	invites: results.groupsInvited, 
		    	profile: results.userProfile 
		    });
		},	
		function(error) {
			res.error(error.message);
		}
	);
};

exports.save = function(req, res) {
	var user = Parse.User.current();
	var profile = new Profile();
	profile.id = user.get("profile").id;
	console.log("profile.id: " + profile.id);

	for (var key in req.body) {
		if (key == "email" || key == "password") {
			continue;
		}
		profile.set(key, req.body[key]);
	}

	user.set("email", req.body.email);
	user.set("username", req.body.email);
	user.set("password", req.body.password);

	user.save().then( function() {
		return profile.save();
	}).then( function() {
		res.flash('message', "Your profile has been saved.");
		res.redirect("profile/edit");
	}, function(error) {
		res.flash('message', error.message);
		res.redirect("profile/edit");
	});
};

exports.view = function(req, res) {	
	var params = {userSlug: req.params.userSlug};
	if (Parse.User.current().get("slug") == req.params.userSlug) {
		params.selfView = true;
	}
	Parse.Cloud.run("getProfileData", params).then( 
		function(results) {
		    res.render("profile", { 
		    	user: results.user,
		    	customGroups: results.customGroups, 
		    	globalGroup: results.globalGroup, 
		    	invites: results.groupsInvited, 
		    	profile: results.userProfile,
		    	selfView: params.selfView
		    });
		},	
		function(error) {
			//res.error(error.message);
			res.flashify("message", "That user does not exist.");
			res.redirect("/");
		}
	);

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