var _ = require('underscore');
var settings = require('cloud/settings');
var Group = Parse.Object.extend("Group");
var Profile = Parse.Object.extend("Profile");
var Invitation = Parse.Object.extend("Invitation");
var Trait = Parse.Object.extend('Trait');

exports.edit = function(req, res) {
	Parse.Cloud.run("getProfileData", {}).then( 
		function(results) {
		    res.render("profile-edit", { 
		    	user: results.user,
		    	customGroups: results.customGroups, 
		    	invites: results.groupsInvited, 
		    	profile: results.userProfile 
		    });
		},	
		function(error) {
			res.error(error.message);
		}
	);
};

exports.match = function(req, res) {
	if (req.query == {}) {
		console.log("no req.query");
		res.redirect("/");
	} else {
		var profileQuery = new Parse.Query(Profile);
		var userQuery = new Parse.Query(Parse.User);
		var profileResults = [];
		// TODO: sanitize GET variables?
		_.each(_.keys(req.query), function(key) {
			profileQuery.equalTo("t_" + key, req.query[key]);
			console.log("profileQuery.equalTo('t_' +"+ key + ", " + req.query[key]+")");
		});
		userQuery.matchesQuery("profile", profileQuery);
		userQuery.include("profile");
		userQuery.find().then(
			function(userResults) {
				//var profileResults = userResults.get("profile");

				_.each(userResults, function(userResult) {
					var profileResult = {};
					profileResult = userResult.get("profile");
					console.log("profileResult: " +JSON.stringify(profileResult));
					profileResult.set("slug", userResult.get("slug"));
					console.log("profileResult with slug: " +JSON.stringify(profileResult));
					profileResults.push(profileResult);
				});
				//return profileResults;
			}
		).then( 
			function() {
				console.log("match profileResults:" + JSON.stringify(profileResults));
				console.log("slug test: " + profileResults[0].get("slug"));
				var traitQuery = new Parse.Query(Trait);
				traitQuery.containedIn("objectId", _.keys(req.query));
				return traitQuery.find()
			}
		).then( 
			function(traits) {
				res.render("match-profiles", {traits: traits, profiles: profileResults});
			}
		);
	}
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
	var params = {};
	console.log("view slug: " + req.params.userSlug);
    console.log("view my slug: " + user.get("slug"));
	if (user.get("slug") == req.params.userSlug) {
		params.selfView = true;
		params.userSlug = user.get("slug");
	} else {
		params.userSlug = req.params.userSlug;
	}
	Parse.Cloud.run("getProfileData", params).then( 
		function(results) {
			console.log("results.profile: " + JSON.stringify(results.userProfile));
			if (results.userProfile !== undefined) {
			    res.render("profile", { 
			    	user: results.user,
			    	customGroups: results.customGroups, 
			    	invites: results.groupsInvited, 
			    	profile: results.userProfile,
			    	selfView: params.selfView
			    });
			} else {
				res.render("404");
			}
		},	
		function(error) {
			//res.error(error.message);
			res.flash("message", "That user does not exist.");
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