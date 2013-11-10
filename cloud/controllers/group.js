var _ = require('underscore');
var Group = Parse.Object.extend('Group');

exports.new = function(req, res) {
	res.render('group-new');
};
/*
var currentUser = null;

retrieveCurrentUser = function() {
	Parse.Cloud.run("checkUser", {}, {
		success: function(user) {
			currentUser = user;
		},
		error: function(error) {
			currentUser = null;
		}
	});

	return (currentUser != null);
};*/

exports.view = function(req, res) {
/*
	if (!retrieveCurrentUser()) {
		res.redirect("/logout");
	}

	var query = new Parse.Query(Group);
	query.equalTo("urlName", req.params.urlName);
	query.find({
		success: function(results) {
	    	res.render('group', {
		    	group: results[0]
			})
		},
		error: function(error) {
			res.redirect(back);
		}
	});			
*/
	var query = new Parse.Query(Group);
	query.equalTo("urlName", req.params.urlName);
	query.find().then(function(results) {
    	res.render('group', {
	    	group: results[0]
		});
    }, function(error) {
		res.redirect(back);
	});				
};

exports.edit = function(req, res) {
	
	var query = new Parse.Query(Group);
	query.equalTo("urlName", req.params.urlName);
	query.find().then(function(results) {
    	res.render('group-edit', {
	    	group: results[0]
		});
    }, function(error) {
		res.redirect(back);
	});			
};

exports.create = function(req, res) {
	//TODO: user creating group should automatically be an admin
	//TODO: New groups should only be accessible to members

	var group = new Group();

	// Explicitly specify which fields to save to prevent bad input data
	group.save(_.pick(req.body, 'name', 'urlName', 'description')).then(function(object) {
	    var groupId = object.id;
	    //create admin role
	    var adminRoleACL = new Parse.ACL();
	    var adminRole = new Parse.Role(groupId + "_admin", adminRoleACL);
	    //adminRoleACL.setPublicReadAccess(false);
	    //adminRoleACL.setPublicWriteAccess(false);
	    //adminRoleACL.setRoleWriteAccess(adminRole);

	    adminRole.save().then(function() {
	    	console.log("post-save?");
	    	var userRoleACL = new Parse.ACL();
		    var userRole = new Parse.Role(groupId + "_member", userRoleACL);
		    userRoleACL.setPublicReadAccess(false);
		    userRoleACL.setPublicWriteAccess(false);
		    //userRoleACL.setRoleWriteAccess(adminRole);
	    
	    	userRole.getRoles().add(adminRole);
		    userRole.save();

			res.redirect('/group/' + req.body.urlName);
	    });
	}, function(error) {
		res.send(500, "Could not create group: " + error.message);
	});
};

exports.save = function(req, res) {

	var query = new Parse.Query(Group);
	query.equalTo("objectId", req.body.id);
	query.find().then(function(results) {
		console.log(results[0]);
    	var group = results[0];
    	group.save(_.pick(req.body, 'name', 'urlName', 'description')).then(function() {
    		res.redirect('/group/' + req.body.urlName);	
    	}, function(error) {
			res.send(500, "Could not save group: " + error.message);
		});
	});
};