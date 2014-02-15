var _ = require('cloud/lib/underscore');
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
		console.log("req.query: " + JSON.stringify(req.query));
	if (_.isEmpty(req.query)) {
		console.log("no req.query");
		// TODO: probably want to make this friendlier
		res.redirect("/");
	} else {
		var profileQuery = new Parse.Query(Profile);
		var userQuery = new Parse.Query(Parse.User);
		var profileResults = [];
		var groupResults = [];
		var groupedProfiles;
		// TODO: sanitize GET variables?
		_.each(_.keys(req.query), function(key) {
			profileQuery.equalTo("t_" + key, req.query[key]);
		});
		userQuery.matchesQuery("profile", profileQuery);
		userQuery.include("profile");
		userQuery.include("groups");
		userQuery.find().then(
			function(userResults) {
				console.log("get groups: " + JSON.stringify(userResults));
				_.each(userResults, function(userResult) {
					var profileResult = userResult.get("profile");
					var groupArray = [];
					profileResult.set("slug", userResult.get("slug"));
					_.each(userResult.get("groups"), function(group) {
						if (group !== null && group.id != settings.global.groupId) {
							groupArray.push(group.get("slug"));

							var groupResult = { slug: group.get("slug"), name: group.get("name") };
							if (_.findWhere(groupResults, groupResult) == null) {
							    groupResults.push(groupResult);
							}
						}
					});
					profileResult.set("groups", groupArray);
					profileResults.push(profileResult);
				});

				groupedProfiles = _(profileResults).reduce(function(memo, o) {
			    	_(o.get("groups")).each(function(i) {
				        memo[i] = memo[i] || [ ];
				        memo[i].push(o);
				    });
				    return memo;
				}, { });
				console.log("groupedProfiles: " + JSON.stringify(groupedProfiles));
			}
		).then( 
			function() {
				var traitQuery = new Parse.Query(Trait);
				traitQuery.containedIn("objectId", _.keys(req.query));
				return traitQuery.find().then( 
					function(traits) {
						_.each(traits, function(trait) {
							trait.set("value", req.query[trait.id]);
						});
						return traits;
					}
				);
			}
		).then( 
			function(traits) {
				console.log("traits:" + JSON.stringify(traits));
				res.render("match-profiles", {traits: traits, profiles: groupedProfiles, groups: groupResults});
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
		console.log("key, req.body[key]" + key + ", " + req.body[key]);
	}

	user.set("email", req.body.email);
	user.set("username", req.body.email);
	user.set("password", req.body.password);

	user.save().then( function() {
		console.log("user saved");
		return profile.save();
	}).then( function() {
		res.flash('success', "Your profile has been saved.");
		res.redirect("profile/edit");
	}, function(error) {
		res.flash('error', error.message);
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
	} else if (req.params.userSlug == undefined) {
		params.selfView = true;
	} else {
		params.userSlug = req.params.userSlug;
	}
	Parse.Cloud.run("getProfileData", params).then( 
		function(results) {
			//console.log("results.profile: " + JSON.stringify(results.userProfile));
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
};