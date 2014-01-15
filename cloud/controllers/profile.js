var _ = require('underscore');
var Group = Parse.Object.extend("Group");
var Profile = Parse.Object.extend("Profile");
var Invitation = Parse.Object.extend("Invitation");

exports.edit = function(req, res) {
	var user = Parse.User.current();
	//var userGroups;
	//var userProfile;
	//var userInvites;

	var query = new Parse.Query(Parse.User);
	query.include("groups.traits");
	query.include("profile");
	query.get(user.id);
	query.first().then( 
		function(result) {
			var userGroups = result.get("groups");
			console.log("Groups data:" + JSON.stringify(userGroups));
			var userProfile = result.get("profile");
			Parse.Cloud.run("getInvites", { invites: user.get("invites") }).then( 
				function(invites) {
			    	res.render("profile-edit", { 
			    		user: user, 
			    		groups: userGroups, 
			    		invites: invites, 
			    		profile: userProfile 
			    	});
				}
			);
		}, 
		function(error) {
			res.redirect("logout");
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

	var user = Parse.User.current();
	var userGroups;
	var userProfile;
	var userInvitation;
	//user.fetch();

	var query = new Parse.Query(Parse.User);
	query.include("groups");
	query.include("profile");
	query.include("invitation");
	query.get(user.id);
	query.first().then( 
		function(result) {
			userGroups = result.get("groups");
			userProfile = result.get("profile");
			userInvitation = result.get("invitation");
			if (userInvitation != null ) {
				return Parse.Cloud.run("getInvites", { invites: userInvitation[0].id });
			}
		}
	).then( 
		function(groupsInvited) {
		    res.render("profile", { user: user, groups: userGroups, invites: groupsInvited, profile: userProfile });
		},	
		function(error) {
			res.redirect("logout");
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