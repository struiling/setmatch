var _ = require('underscore');
var settings = require('cloud/settings');
var Group = Parse.Object.extend("Group");
var Profile = Parse.Object.extend("Profile");
var Trait = Parse.Object.extend("Trait");

exports.create = function(req, res) {

	//var user = Parse.User.current();
	var group = new Group();
	group.id = req.body.group;
	var trait = new Trait();
	for (var key in req.body) {
		if (key != "group") {
			trait.set(key, req.body[key]);
			console.log("trait values: " + key + ": " + req.body[key]);
		}
	}
	
    var adminRoleACL = new Parse.ACL();
    adminRoleACL.setPublicReadAccess(false);
    adminRoleACL.setPublicWriteAccess(false);
    adminRoleACL.setRoleReadAccess(group.id + "_admin", true);
    adminRoleACL.setRoleWriteAccess(group.id + "_admin", true);

    var userRoleACL = new Parse.ACL();
    userRoleACL.setPublicReadAccess(false);
    userRoleACL.setPublicWriteAccess(false);
    userRoleACL.setRoleReadAccess(group.id + "_member", true);
    // admins can modify user ACL
    userRoleACL.setRoleWriteAccess(group.id + "_admin", true);

    // group permissions
    trait.setACL(userRoleACL);        
    
	//trait.set("group", group);
	trait.save().then( 
		function (trait) {
			console.log("trait ID: "+ trait.id);
			group.addUnique("traits", {"__type":"Pointer","className":"Trait","objectId":trait.id});
			return group.save();
		}
	).then(
		function(savedGroup) {
console.log("savedGroup: " + JSON.stringify(savedGroup));
			 return savedGroup.fetch();
		}
	).then(
		function (result) {
			console.log("group result: " + JSON.stringify(result));
    		res.redirect('/group/' + result.get("slug") + '/edit');
		}, 
		function(error) {
			res.send(500, "Could not create trait: " + error.message);
		}
	);
};

exports.delete = function(req, res) {
	var trait = new Trait();
	var traitName;
	trait.id = req.params.traitId;
	console.log("Trait prefetch: " + JSON.stringify(trait));
	trait.fetch().then(
		function() {
			traitName = trait.get("name");
			console.log("Trait: " + JSON.stringify(trait));
			console.log("traitName: " + trait.get("name"));
			return trait.destroy();
		}
	).then(
		function() {
			res.flash("message", "You have deleted &#8220;" + traitName + "&#8221;");
			res.redirect("back");
		}
	);
};

exports.match = function(req, res) {

	var traitId = req.params.traitId;
	var traitResult;

	var traitQuery = new Parse.Query(Trait);
	traitQuery.equalTo("objectId", traitId);
	traitQuery.first().then( 
		function(trait) {
			trait.set("value", req.query[traitId]);
			traitResult = trait;
		}
	).then(
		function() {
			var profileQuery = new Parse.Query(Profile);
			var userQuery = new Parse.Query(Parse.User);
			profileQuery.exists("t_" + traitId);
			//profileQuery.select("t_" + traitId, "t_" + settings.global.fname, "t_" + settings.global.lname);
			userQuery.matchesQuery("profile", profileQuery);
			userQuery.include("profile");
			return userQuery.find().then(
				function(userResults) {
					console.log("userResults:" + JSON.stringify(userResults));

					var profileResults = [];
					_.each(userResults, function(userResult) {
						profileResults.push({
							trait: userResult.get("profile").get("t_" + traitId),
						    fname: userResult.get("profile").get("t_" + settings.global.fname),
						    lname: userResult.get("profile").get("t_" + settings.global.lname),
						    slug: userResult.get("slug")
						});
					});
					console.log("profileResults:" + JSON.stringify(profileResults));

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

					return {counts: counts, profiles: profileResults, trait: traitResult};
				}
			);

		}
	).then( 
		function(results) {
			console.log("groupBy:" + JSON.stringify(results));
			res.render("match-traits", results);
		}
	);
};
exports.save = function(req, res) {
	var trait = new Trait();
	trait.id = req.body.id;
	for (var key in req.body) {
		if (key != "id") {
			trait.set(key, req.body[key]);
			console.log("trait values: " + key + ": " + req.body[key]);
		}
	}
    trait.save().then( 
    	function(success) {
			res.flash("message", "Trait saved.");
    		res.redirect("back");
		}, 
		function(error) {
			res.flash("message", error.message);
    		res.redirect("back");
		}
	);
};