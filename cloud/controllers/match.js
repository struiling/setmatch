var _ = require('underscore');
var settings = require('cloud/settings');
//var Group = Parse.Object.extend("Group");
var Profile = Parse.Object.extend("Profile");
var Trait = Parse.Object.extend("Trait");

exports.match = function(req, res) {
	if (req.query == {}) {
		res.redirect("/");
	} else {
		var profileQuery = new Parse.Query(Profile);
		var userQuery = new Parse.Query(Parse.User);
		_.each(_.keys(req.query), function(key) {
			profileQuery.equalTo("t_" + key, req.query.key);
		});
		userQuery.matchesQuery("profile", profileQuery);
		userQuery.include("profile");
		userQuery.find().then(
			function(userResults) {
				var profileResults = userResult.get("profile");
				_.each(userResults, function(userResult) {
					profileResults.push({
					    slug: userResult.get("slug")
					});
					console.log("profileResults:" + JSON.stringify(profileResults));
				});
				return {profiles: profileResults};
			}
		).then( 
			function(results) {
				res.render("match", results);
			}
		);
	}
	
};

exports.view = function(req, res) {

	var traitId = req.params.traitId; 

	var profileQuery = new Parse.Query(Profile);
	var userQuery = new Parse.Query(Parse.User);
	profileQuery.exists("t_" + traitId);
	//profileQuery.select("t_" + traitId, "t_" + settings.global.fname, "t_" + settings.global.lname);
	userQuery.matchesQuery("profile", profileQuery);
	userQuery.include("profile");
	userQuery.find().then(
		function(userResults) {
			console.log("userResults:" + JSON.stringify(userResults));

			var profileResults = [];
			_.each(userResults, function(userResult) {
//				userObjects.push(_.omit(userResult, "profile", "invitation", "groups"));
//				profileResults.push(_.pick(userResult.get("profile"), "t_" + traitId));
				profileResults.push({
					trait: userResult.get("profile").get("t_" + traitId),
				    fname: userResult.get("profile").get("t_" + settings.global.fname),
				    lname: userResult.get("profile").get("t_" + settings.global.lname),
				    slug: userResult.get("slug")
				});
			});
			console.log("profileResults:" + JSON.stringify(profileResults));

			/*var grouped =  _.groupBy(userResults, function(userResult) {
				return userResult.get("t_" + traitId);
			});
			*/
			//return filtered = _.pick(profileResults[0], 't_OrKo4Sq2qu');
			/*return _.map(
				_.countBy(profileResults, 
					function(profileResult) {
						return profileResult.get("t_" + traitId)}), 
				function(count, key) {
    				return {name: key, count:count};

			});*/
			var counts = _.countBy(profileResults,
				function(profile) {
					return profile.trait;
				}
			);

			return {counts: counts, profiles: profileResults, id: traitId};
		}
	).then( 
		function(results) {
			console.log("groupBy:" + JSON.stringify(results));
			res.render("match", results);
		}
	);

// TODO: this function
/*	var group = new Group();

	// Explicitly specify which fields to save to prevent bad input data
	group.save(_.pick(req.body, 'name', 'slug', 'description', 'secretive')).then(function(object) {

	    

	}).then( function() {
		user.addUnique("groups", {"__type":"Pointer","className":"Group","objectId":groupId});
        return user.save();
	}).then( function (success) {
    	res.redirect('/group/' + object.get("slug"));
	}, function(error) {
		res.send(500, "Could not create group: " + error.message);
	});*/
};