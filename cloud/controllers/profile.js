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
			var userProfile = result.get("profile");
			var userGroups = result.get("groups");
			var customGroups;
			var globalGroup;
			customGroups = _.filter(userGroups, function(group) {
			     return group.get("urlName") !== "global";
			});
			console.log("customGroups: " + JSON.stringify(customGroups));
			globalGroup = _.first(_.filter(userGroups, function(group) {
			     return group.get("urlName") == "global";
			}));
			console.log("globalGroup: " + JSON.stringify(globalGroup));

			Parse.Cloud.run("getInvites", { invites: user.get("invites") }).then( 
				function(groupsInvited) {
			    	res.render("profile-edit", { 
			    		user: user, 
				    	customGroups: customGroups, 
				    	globalGroup: globalGroup, 
				    	invites: groupsInvited, 
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
	var customGroups;
	var globalGroup;
	var userProfile;
	var userInvitation;
	//user.fetch();

	var query = new Parse.Query(Parse.User);
	query.include("groups.traits");
	query.include("profile");
	query.include("invitation.groups");
	query.get(user.id);
	query.first().then( 
		function(result) {
			userGroups = result.get("groups");
			userProfile = result.get("profile");
			userInvitation = result.get("invitation").get("groups");
			console.log("userInvitation:" + JSON.stringify(userInvitation));
			customGroups = _.filter(userGroups, function(group) {
			     return group.get("urlName") !== "global";
			});
			console.log("customGroups: " + JSON.stringify(customGroups));
			globalGroup = _.first(_.filter(userGroups, function(group) {
			     return group.get("urlName") == "global";
			}));
			console.log("globalGroup: " + JSON.stringify(globalGroup));
			var groupsInvitedIds = [];
			if (userInvitation != null ) {
				for (i in userInvitation) {
					groupsInvitedIds.push(userInvitation[i].id);
				}
				console.log("groupsInvitedIds:" + groupsInvitedIds);
				return Parse.Cloud.run("getInvites", { invites: groupsInvitedIds });
			}
		}
	).then( 
		function(groupsInvited) {

		    res.render("profile", { 
		    	user: user, 
		    	customGroups: customGroups, 
		    	globalGroup: globalGroup, 
		    	invites: groupsInvited, 
		    	profile: userProfile 
		    });
		},	
		function(error) {
			res.error(error.message);
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