var _ = require('underscore');
var Group = Parse.Object.extend('Group');

exports.new = function(req, res) {
	res.render('group-new');
};

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
    	if (results[0] != null) {
			res.render('group', {
		    	group: results[0]
			});
		} else {
			res.flash("message", "You don't have permission to see this page.");
			res.redirect("/");	
		}
    }, function(error) {
		res.redirect(back);
	});				
};

exports.edit = function(req, res) {
	
	var query = new Parse.Query(Group);
	query.equalTo("urlName", req.params.urlName);
	query.find().then(function(results) {
		if (results[0] != null) {
			res.render('group-edit', {
		    	group: results[0]
			});
		} else {
			res.flash("message", "You don't have permission to see this page.");
			res.redirect("/");	
		}
    	
    }, function(error) {
		res.redirect(back);
	});			
};

exports.create = function(req, res) {
	//TODO: user creating group should automatically be an admin
	//TODO: New groups should only be accessible to members

	var group = new Group();

	// Explicitly specify which fields to save to prevent bad input data
	group.save(_.pick(req.body, 'name', 'urlName', 'description', 'browsable')).then(function(object) {
	    var groupId = object.id;
	    //create admin role
	    var adminRoleACL = new Parse.ACL();
	    var adminRole = new Parse.Role(groupId + "_admin", adminRoleACL);
	    adminRole.getUsers().add(Parse.User.current());
	    adminRoleACL.setPublicReadAccess(false);
	    adminRoleACL.setPublicWriteAccess(false);
	    adminRoleACL.setRoleReadAccess(groupId + "_admin", true);
	    adminRoleACL.setRoleWriteAccess(groupId + "_admin", true);

	    adminRole.save().then(function() {
	    	var userRoleACL = new Parse.ACL();
		    var userRole = new Parse.Role(groupId + "_member", userRoleACL);
		    userRoleACL.setPublicReadAccess(false);
		    userRoleACL.setPublicWriteAccess(false);
		    userRoleACL.setRoleReadAccess(groupId + "_member", true);
		    userRoleACL.setRoleWriteAccess(groupId + "_admin", true);
	    
	    	userRole.getRoles().add(adminRole);
		    userRole.save();

		    object.setACL(userRoleACL);	
	    	object.save();

	    	res.redirect('/group/' + object.get("urlName"));
		    
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
    	group.save(_.pick(req.body, 'name', 'urlName', 'description')).then(function(object) {
    		res.redirect('/group/' + object.get("urlName"));	
    	}, function(error) {
			res.send(500, "Could not save group: " + error.message);
		});
	});
};