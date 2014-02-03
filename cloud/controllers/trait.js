var _ = require('underscore');
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
	// Do most of this in afterDelete so the same functions will run on deleting a group
	// TODO: remove pointer from traits array in Group
	// TODO: clear all data that column in Profile
	// TODO: delete column in Profile table (not currently possible)
	// TODO: destroy() row in Trait
};

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
};
exports.save = function(req, res) {
// TODO: this function
	var user = Parse.User.current();
	var group = new Group();

	// Explicitly specify which fields to save to prevent bad input data
	group.save(_.pick(req.body, 'name', 'slug', 'description', 'secretive')).then(function(object) {

	    

	}).then( function() {
		user.addUnique("groups", {"__type":"Pointer","className":"Group","objectId":groupId});
        return user.save();
	}).then( function (success) {
    	res.redirect('/group/' + object.get("slug"));
	}, function(error) {
		res.send(500, "Could not create group: " + error.message);
	});
};