var _ = require('underscore');
var Group = Parse.Object.extend('Group');
exports.create = function(req, res) {

    var user = Parse.User.current();
    var group = new Group();

    // Explicitly specify which fields to save to prevent bad input data
    group.save(_.pick(req.body, 'name', 'urlName', 'description', 'secretive')).then( function(object) {
        console.log("group id: " + group.id);
        //create admin role
        var adminRoleACL = new Parse.ACL();
        var adminRole = new Parse.Role(group.id + "_admin", adminRoleACL);
        adminRole.getUsers().add(user);
        adminRoleACL.setPublicReadAccess(false);
	    adminRoleACL.setPublicWriteAccess(false);
        adminRoleACL.setRoleReadAccess(group.id + "_admin", true);
        adminRoleACL.setRoleWriteAccess(group.id + "_admin", true);
        return adminRole.save();
    }).then(function(adminRole) {
        // create user role
        var userRoleACL = new Parse.ACL();
        var userRole = new Parse.Role(group.id + "_member", userRoleACL);
        userRoleACL.setPublicReadAccess(false);
	    userRoleACL.setPublicWriteAccess(false);
        userRoleACL.setRoleReadAccess(group.id + "_member", true);
        // admins can modify user ACL
        userRoleACL.setRoleWriteAccess(group.id + "_admin", true);

        // set admin role hierarchy
        userRole.getRoles().add(adminRole);

        // group permissions
        group.setACL(userRoleACL);        
        
        user.addUnique("groups", {"__type":"Pointer","className":"Group","objectId":group.id});
        return Parse.Object.saveAll([userRole, user, group]);
        
    }).then( function () {
        res.redirect('/group/' + group.get("urlName"));
    }, function(error) {
        res.send(500, "Could not create group: " + error.message);
    });
};

exports.edit = function(req, res) {
	
	var query = new Parse.Query(Group);
	query.equalTo("urlName", req.params.urlName);
	query.find().then(function(results) {
		console.log("Query for edit: " + JSON.stringify(results[0]));
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

exports.invite = function(req, res) {
	
	/*
	var membersJSON = req.body.addMembers.replace(/\s/g, '').split(',').map(function(email) {
        return {newMember: email};
    });
	console.log("JSON.stringify: " + JSON.stringify(membersJSON)); 
	*/

	// remove whitespace and split on comma
	var inviteMemberList = req.body.inviteMembers.replace(/\s/g, '').split(',');
	console.log("New members list in JSON: " + JSON.stringify(inviteMemberList));
	Parse.Cloud.run("addInviteToUser", { users: inviteMemberList, group: req.params.urlName }, { 
		success: function() {} });

	res.redirect('/group/' + req.params.urlName + "/edit");
    //console.log("req.url: " + req.url);

};

exports.join = function(req, res) {
	var user = Parse.User.current();
		
	Parse.Cloud.run("addUserToGroup", { group: req.params.urlName }).then( function(message) {
		// TODO: set user ACL to group members so members of the newly joined group can see the user
		res.flash("message", message);
		res.redirect('back');
	});

};

exports.new = function(req, res) {
	res.render('group-new');
};

exports.save = function(req, res) {
	var query = new Parse.Query(Group);
	query.get(req.body.id).then(function(group) {
		console.log("Group being saved: " + JSON.stringify(group));
    	group.save(_.pick(req.body, 'name', 'urlName', 'description', 'secretive')).then(function(object) {
    		res.redirect('/group/' + object.get("urlName"));	
    	}, function(error) {
			res.send(500, "Could not save group: " + error.message);
		});
	});
};

exports.view = function(req, res) {
	var query = new Parse.Query(Group);
	query.equalTo("urlName", req.params.urlName);
	query.first().then(function(results) {
		console.log("Query for view: " + JSON.stringify(results));
    	if (results != null) {
			res.render('group', {
		    	group: results
			});
		} else {
			res.flash("message", "You don't have permission to see this page.");
			res.redirect("/");	
		}
    }, function(error) {
		res.redirect(back);
	});				
};