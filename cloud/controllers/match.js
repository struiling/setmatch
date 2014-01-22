var _ = require('underscore');
var settings = require('cloud/settings');
//var Group = Parse.Object.extend("Group");
var Profile = Parse.Object.extend("Profile");
var Trait = Parse.Object.extend("Trait");

exports.create = function(req, res) {

	
};

exports.view = function(req, res) {

	var traitId = req.params.traitId;

	var profileQuery = new Parse.Query("Profile");
	profileQuery.exists("t_" + traitId);
	profileQuery.select("t_" + traitId, "t_" + settings.global.fname, "t_" + settings.global.lname);
	profileQuery.find().then(
		function(profileResults) {
			console.log("profileResults:" + JSON.stringify(profileResults));
			return _.pairs(
				_.countBy(profileResults, function(profileResult) {
					return profileResult.get("t_" + traitId)
				})
			);
		}
	).then( 
		function(profiles) {
			console.log("countBy:" + JSON.stringify(profiles));
			res.render("match", {matches: profiles});
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