var _ = require('underscore');
var Group = Parse.Object.extend('Group');
var Invitation = Parse.Object.extend('Invitation');
var Trait = Parse.Object.extend('Trait');

exports.create = function(req, res) {

    var user = Parse.User.current();
    var group = new Group();

    // Explicitly specify which fields to save to prevent bad input data
    group.save(_.pick(req.body, 'name', 'urlName', 'description', 'secretive')).then( function() {
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
	var group;
	var groupTraits;

	var groupQuery = new Parse.Query(Group);
	groupQuery.equalTo("urlName", req.params.urlName);
	groupQuery.include("traits");
	// TODO: reformat ALL the promises to follow this indentation
	groupQuery.first().then(
		function(result) {
			group = result;
			groupTraits = group.get("traits");
			console.log("Query for edit: " + JSON.stringify(group));
			var roleQuery = new Parse.Query(Parse.Role);
			roleQuery.equalTo("name", group.id + "_admin");
			return roleQuery.first();
		}
	).then(
		function(role) {
			if (role == undefined) {
				// If you can't see the role, you're not an admin
				res.redirect("/");	
			} else {
				console.log("role: " + JSON.stringify(role));
				console.log("traits: " + JSON.stringify(groupTraits));

				if (groupTraits) {
					res.render('group-edit', {
				    	group: group,
				    	traits: groupTraits
					});
				} else {
					res.render('group-edit', {
				    	group: group
					});
				}
			}
	    },
	    function(error) {
			res.redirect("/");	
		}
	);			
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
	Parse.Cloud.run("addInviteToUser", { users: inviteMemberList, group: req.body.group }).then(
		function() {
			res.redirect('/group/' + req.params.urlName + "/edit");		
		}
	);

	
    //console.log("req.url: " + req.url);

};

exports.join = function(req, res) {
	var user = Parse.User.current();
	console.log("req.user: " + JSON.stringify(req.user));
	Parse.Cloud.run("addUserToGroup", { group: req.params.urlName }).then( 
		function(message) {
			// TODO: set user ACL to group members so other members of the newly joined group can see the user
			res.flash("message", message);
			res.redirect('back');
		}
	);

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
	var groupUrlName = req.params.urlName;

	var groupQuery = function(urlName) {
		var query = new Parse.Query(Group);
		query.equalTo("urlName", urlName);
		return query.first();
	};

	var memberQuery = function(group) {
		var query = new Parse.Query(Parse.User);
		query.equalTo("groups", group);
		query.include("profile");
		return query.find();
	};

	var invitationQuery = function(group) {
		var query = new Parse.Query(Invitation);
		query.containedIn("invites", group.id);
		// only get email addresses. Doesn't matter whether they already have a SM account
		query.select("email")
		return query.find();
	};

	/* -------------------- */

	var group;
	var members;
	var invitations;

	groupQuery(groupUrlName).then(
		function(groupResult) {
			group = groupResult;
			if (group != null) {
				var query = new Parse.Query(Parse.User);
				query.equalTo("groups", group);
				query.include("profile");
				return query.find();
			} else {
				return Parse.Promise.error("You don't have permission to see this page");
			}
		}
	).then( 
		function(memberResult) {
			members = memberResult;
			console.log("Group members: " + JSON.stringify(members));
			console.log("Group: " + JSON.stringify(group));

			var query = new Parse.Query(Invitation);
			query.equalTo("groups", group);
			
			// only get email addresses. Doesn't matter whether they already have a SM account
			query.select("email");
			return query.find();
		}
	).then( 
		function(invitationResult) {
			invitations = invitationResult;
			console.log("Group invitations: " + JSON.stringify(invitations));
			res.render('group', {
		    	group: group,
		    	members: members,
		    	invitations: invitations
			});
		},
		function(error) {
			res.flash("message", error.message);
			res.redirect("/");	
		}
	);

/*
	var query = new Parse.Query(Group);
	query.equalTo("urlName", req.params.urlName);
	query.first().then(
		function(groupResult) {
			console.log("Query for view: " + JSON.stringify(groupResult));
	    	if (groupResult != null) {
	    		group = groupResult;
	    		var memberQuery = new Parse.Query(Parse.User);
				memberQuery.equalTo("groups", group);
				memberQuery.include("profile");
				return memberQuery.find();
			} else {
				return Parse.Promise.error();
			}
		}
	).then( 
		function(members) {
			console.log("Group members: " + JSON.stringify(members));
			res.render('group', {
		    	group: group,
		    	members: members
			});

	    },
    	function(error) {
			res.flash("message", "You don't have permission to see this page.");
			res.redirect("/");	
		}
	);				
*/
};