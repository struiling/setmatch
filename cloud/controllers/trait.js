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
		function () {
    		res.redirect('/group/' + req.params.slug + '/edit');
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