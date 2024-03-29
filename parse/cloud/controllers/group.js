var _ = require('underscore');
var settings = require('cloud/settings');
var Group = Parse.Object.extend('Group');
var Invitation = Parse.Object.extend('Invitation');
var Trait = Parse.Object.extend('Trait');

exports.create = function(req, res) {

    var user = Parse.User.current();
    var group = new Group();

    // Explicitly specify which fields to save to prevent bad input data
    group.save(_.pick(req.body, 'name', 'slug', 'description')).then( function() {
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
        // create member role
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
        res.redirect('/group/' + group.get("slug"));
    }, function(error) {
        res.flash("error", "Couldn't create group: " + error.message);
        res.redirect("back");
    });
};

exports.delete = function(req, res) {
	var user = Parse.User.current();
    var group;
    var groupQuery = new Parse.Query(Group);
	groupQuery.equalTo("slug", req.params.groupSlug);
	groupQuery.first().then(
		function(result) {
			group = result;
			
    		return group.destroy();
		}
	).then(
		function(promise) {
			res.flash('message', "You've succesfully deleted the " + group.get("name") + ' group.');
		    res.redirect('/');		
		}, 
		function(error) {
			if (error.code == Parse.Error.AGGREGATE_ERROR) {
		        for (var i = 0; i < error.errors.length; i++) {
		          console.log("Couldn't delete " + error.errors[i].object.id + 
		            "due to " + error.errors[i].message);
		        }
		    } else {
		        console.log("Delete aborted because of " + error.message);
		    }
		}
	);
};

exports.edit = function(req, res) {
	var group;
	var groupTraits;

	var groupQuery = new Parse.Query(Group);
	groupQuery.equalTo("slug", req.params.groupSlug);
	groupQuery.include("traits");
	// TODO: reformat ALL the promises to follow this indentation
	groupQuery.first().then(
		function(result) {
			if (result != null) {
				group = result;
				groupTraits = group.get("traits");
				console.log("Query for edit: " + JSON.stringify(group));
				var roleQuery = new Parse.Query(Parse.Role);
				roleQuery.equalTo("name", group.id + "_admin");
				return roleQuery.first();
			} else {
				return Parse.Promise.error("You don't have permission to see this page.");	
			}
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
			res.flash("error", "Group not found.");	
			res.redirect("/");	
		}
	);			
};

exports.groups = function(req, res) {
	var user = Parse.User.current();
	var groups;
	var invitations;

	Parse.Cloud.run("getProfileData", {}).then( 
		function(results) {
			console.log("results.profile: " + JSON.stringify(results.userProfile));
			if (results.userProfile !== undefined) {
			    res.render("groups", {
			    	groups: results.customGroups, 
			    	invites: results.groupsInvited
			    });
			    
			} else {
				res.render("groups");
			}
		},	
		function(error) {
			//res.error(error.message);
			res.flash("error", "Can't retrieve your groups.");
			res.redirect("/profile");
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

	//TODO: check if user is an admin before running addInviteToUser

	// remove whitespace and split on comma, filter out duplicates
	var inviteMemberList = _.unique(
		req.body.inviteMembers.replace(/\s/g, '').split(',')
	);
	console.log("New members list in JSON: " + JSON.stringify(inviteMemberList));
	Parse.Cloud.run("addInviteToUser", { users: inviteMemberList, group: req.body.group }).then(
		function() {
			res.flash("success", "Invitations sent!");
			res.redirect("back");		
		},
		function(error) {
			res.flash("error", "There was a problem sending invitations: " + error.message);
			res.redirect("back");
		}
	);
    //console.log("req.url: " + req.url);
};

exports.join = function(req, res) {
	var user = Parse.User.current();
	
	Parse.Cloud.run("addUserToGroup", { group: req.params.groupSlug }).then( 
		function(group) {
			res.flash("message", "You've joined " + group.get("name") + ".");
			res.redirect('back');
		},
		function(error) {
			res.flash("error", "There was a problem joining " + group.get("name") + ": " + error.message);
			res.redirect('back');
		}
	);
};

exports.leave = function(req, res) {
	// TODO: check if the user is the last admin, and if so, prevent leaving
	// TODO: if user is the last member, delete the group
	var user = Parse.User.current();
	var group;

	var groupQuery = function(slug) {
        var query = new Parse.Query(Group);
        query.equalTo("slug", slug);
        return query.first();
    };
    groupQuery(req.params.groupSlug).then(
        function(result) {
        	if (!result) {
        		return Parse.Promise.error("You're not a member of this group.");
        	}
        	group = result;
        	console.log("leave result: " + JSON.stringify(result));
        	user.remove("groups", {"__type":"Pointer","className":"Group","objectId":group.id});
            return user.save().then(
		    	function() {
					return Parse.Cloud.run("leaveGroup", {groupId: group.id});
				}
			);
        }
	).then( 
		function() {
			res.flash("message", "You are no longer a member of " + group.get("name"));
			res.redirect("/");
		}, function(error) {
			res.flash("message", "Couldn't leave " + group.get("name") + ": " + error.message);
			res.redirect("/group/" + req.params.groupSlug);
		}
	);
};

exports.members = function(req, res) {
	var groupQuery = function(slug) {
		var query = new Parse.Query(Group);
		query.equalTo("slug", slug);
		return query.first();
	};

	var groupSlug = req.params.groupSlug;
	var group;
	var members;
	var invitations;
	var admin;

	groupQuery(groupSlug).then(
		function(groupResult) {
			group = groupResult;
			if (group != null) {
				var query = new Parse.Query(Parse.User);
				query.equalTo("groups", group);
				query.include("profile");
				return query.find();
			} else {
				return Parse.Promise.error("You don't have permission to see this page.");
			}
		}
	).then( 
		function(memberResult) {
			members = memberResult;
			console.log("Group members: " + JSON.stringify(members));
			console.log("Group: " + JSON.stringify(group));

			var roleQuery = new Parse.Query(Parse.Role);
			roleQuery.equalTo('name', group.id + '_admin');
			return roleQuery.first();
		}
	).then( 
		function(adminRole) {
			console.log("adminRole" + JSON.stringify(adminRole));
			if (adminRole != null) {
				admin = adminRole;
				var invitationQuery = new Parse.Query(Invitation);
				invitationQuery.equalTo("groups", group);
				// only get email addresses. Doesn't matter whether they already have a SM account
				invitationQuery.select("email");
				return invitationQuery.find();
			}
		}
	).then( 
		function(invitationResult) {
			invitations = invitationResult;
			console.log("Group invitations: " + JSON.stringify(invitations));
			res.render('group-members', {
		    	group: group,
		    	members: members,
		    	invitations: invitations,
		    	admin: admin
			});
		},
		function(error) {
			res.flash("error", error);
			res.redirect("/");	
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
    	group.save(_.pick(req.body, 'name', 'slug', 'description', 'secretive')).then(function(object) {
    		res.redirect('/group/' + object.get("slug"));	
    	}, function(error) {
			res.flash("error", "Could not save group: " + error.message);
			res.redirect("back");
		});
	});
};

exports.view = function(req, res) {
	var groupSlug = req.params.groupSlug;

	var groupQuery = function(slug) {
		var query = new Parse.Query(Group);
		query.equalTo("slug", slug);
		return query.first();
	};
	
	/* ---------- not currently being used ---------- */
	var memberQuery = function(group) {
		var query = new Parse.Query(Parse.User);
		query.equalTo("groups", group);
		query.include("profile");
		return query.find();
	};

	/* -------------------- */

	var group;
	var members;
	var admin;

	groupQuery(groupSlug).then(
		function(groupResult) {
			group = groupResult;
			if (group != null) {
				var query = new Parse.Query(Parse.User);
				query.equalTo("groups", group);
				query.include("profile");
				return query.find();
			} else {
				return Parse.Promise.error("You don't have permission to see this page.");
			}
		}
	).then( 
		function(memberResult) {
			members = memberResult;
			console.log("Group members: " + JSON.stringify(members));
			console.log("Group: " + JSON.stringify(group));

			var roleQuery = new Parse.Query(Parse.Role);
			roleQuery.equalTo('name', group.id + '_admin');
			return roleQuery.first();
		}
	).then( 
		function(adminRole) {
			console.log("adminRole" + JSON.stringify(adminRole));
			if (!adminRole && group.id == settings.global.groupId) {
				// don't let non-admins of global group view the group
				return Parse.Promise.error("You don't have permission to see this page.");
			}

			if (adminRole) {
				// viewing a group you're an admin of
				admin = adminRole;
			}
			return;
		}
	).then( 
		function() {
			res.render('group', {
		    	group: group,
		    	members: members,
		    	admin: admin
			});
		},
		function(error) {
			res.flash("error", error);
			res.redirect("/");	
		}
	);
};