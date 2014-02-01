var _ = require('underscore');
var settings = require('cloud/settings');
var Group = Parse.Object.extend('Group');
var Profile = Parse.Object.extend('Profile');
var Trait = Parse.Object.extend('Trait');

exports.match = function(req, res) {
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

			var counts = _.countBy(profileResults,
				function(profile) {
					return profile.trait;
				}
			);
			var groupedProfiles =  _.groupBy(profileResults, function(profile) {
				return profile.trait;
			});


			return {counts: counts, profiles: groupedProfiles, id: traitId};
		}
	).then( 
		function(results) {
			console.log("results:" + JSON.stringify(results));
			res.json(results);
		}
	);
};
