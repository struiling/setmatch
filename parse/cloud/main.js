require('cloud/app.js');

var _ = require('underscore');
var settings = require('cloud/settings');
var Group = Parse.Object.extend("Group");
var Profile = Parse.Object.extend("Profile");
var Invitation = Parse.Object.extend("Invitation");

/*
Parse.Cloud.beforeSave("Group", function(req, res) {
    Parse.Cloud.useMasterKey();

    //TODO: strip spaces and bad characters from slug (only alphanumeric and - and _)
    console.log('req.object.get("slug"): ' + req.object.get("slug"));
    console.log('req.object: ' + JSON.stringify(req.object));
	if (!req.object.get("slug") && req.object.isNew()) {
    	res.error("A URL is required.");
	} else {
        var slug = req.object.get("slug").toLowerCase();
	    var query = new Parse.Query(Group);

        // check if another group has this URL, and is not the one you're saving
	    query.equalTo("slug", slug);
	    console.log("req.object.id: "+req.object.id);

        query.first().then(function(object) {
        	//console.log("object.id: "+object.id);
      		if (object !== undefined &&
      			req.object.id !== object.id) {
                // duplicate group found
              console.log("duplicate group found");
          		res.error("A group with this URL already exists.");
        	} else {
          		req.object.set("slug", slug);
                res.success();
        	}	    	
	    });
  	}
});
*/
Parse.Cloud.beforeSave("Group", function(req, res) {
    Parse.Cloud.useMasterKey();
    if (!req.object.get("slug") && req.object.isNew()) {
        res.error("A URL is required.");
    } else if (req.object.get("slug")) {
        groupSlug = req.object.get("slug").toLowerCase();
        var cleanSlug = groupSlug.replace(/[^a-z0-9_\-]/gi, '').toLowerCase();
        if (groupSlug !== cleanSlug) {
            res.error("Group URL names can't have special characters. Please only use numbers, letters, underscore, and dash.");
        } else {
            req.object.set("slug", groupSlug);
            res.success();
        }
    } else {
        res.success();
    }

});
Parse.Cloud.afterSave("Group", function(req, res) {
    Parse.Cloud.useMasterKey();
    if (!req.object.existed()) {
        var user = req.user;
        var userACL = user.get("ACL");
        userACL.setRoleReadAccess(req.object.id + "_member", true);
        user.setACL(userACL);

        var profile = new Profile();
        profile.id = user.get("profile").id;
        profile.setACL(userACL);

        return Parse.Object.saveAll([user, profile]);
    }
});

/* TODO: Figure out why this function stops addInviteToUser, below, from saving a user change.
Parse.Cloud.beforeSave(Parse.User, function(req, res) {
    Parse.Cloud.useMasterKey();

    var email = req.object.get("email");
    req.object.set("email", email.toLowerCase());
    req.object.set("username", email.toLowerCase());
    if (!req.object.get("fname")) {
        res.error("First name is required.");
    } else {
        var query = new Parse.Query(Parse.User);

        // check if another user has this email address, and is not the one you're saving
        // TODO: make sure slug is unique
        query.equalTo("email", req.object.get("email"));
        console.log("req.object.email: "+req.object.get("email"));

        query.first().then(function(object) {
            //console.log("object.id: "+object.id);
            if (object !== undefined &&
                req.object.id !== object.id) {
                // duplicate group found
                res.error("This email address is registered to a different account.");
            } else {
                res.success();
            }           
        });
    }
});
*/

Parse.Cloud.afterSave(Parse.User, function(req, res) {
    if (!req.object.existed()) {
        var user = req.user; 
        console.log("only for new users: " + JSON.stringify(user));
        user.fetch().then(
            function() {
                return Parse.Cloud.run("addUserToGroup", { isGlobal: true} );
            }
        );
    }
});

Parse.Cloud.afterDelete(Parse.User, function(req, res) {
    Parse.Cloud.useMasterKey();
    var profile = new Profile();
    profile = req.object.get("profile");

    var invitation = new Invitation();
    invitation = req.object.get("invitation");

    var promise = new Parse.Promise();
    Parse.Object.destroyAll([profile, invitation], function (list, error) {
        if (list) {
            promise.resolve(list);
        } else {
            promise.reject(error);
        }
    });
    return promise;
});
Parse.Cloud.afterDelete("Trait", function(req, res) {
    // TODO: clear all data that column in Profile
    // TODO: delete column in Profile table (not currently possible)
    // or move to background job that runs daily
    var trait = req.object;
    console.log("var trait: " + trait.id);
    var group = new Group();
    var groupQuery = new Parse.Query(Group);
    groupQuery.equalTo("traits", {"__type":"Pointer","className":"Trait","objectId":trait.id});
    groupQuery.first().then(
        function (groupResult) {
            console.log("groupResult: " + JSON.stringify(groupResult));
            groupResult.remove("traits", {"__type":"Pointer","className":"Trait","objectId":trait.id});
            return groupResult.save();
        }
    );
});

/*
// TODO: make groups not be deletable if there are members other than the current member
Parse.Cloud.beforeDelete("Group", function(req, res) {

});
*/
Parse.Cloud.afterDelete("Group", function(req, res) {
    Parse.Cloud.useMasterKey();
    var group = req.object;
    var traits = group.get("traits");

    var userQuery = new Parse.Query(Parse.User);
    userQuery.limit(1000);
    userQuery.equalTo("groups", {"__type":"Pointer","className":"Group","objectId":group.id});
    // userQuery.include("profile");
    return userQuery.find().then( 
        function(users) {
            var promise = new Parse.Promise();
            _.each(users, function(user) {
                user.remove("groups", {"__type":"Pointer","className":"Group","objectId":group.id});
            });
            
            Parse.Object.saveAll(users, function (list, error) {
                if (list) {
                    promise.resolve(list);
                } else {
                    promise.reject(error);
                }
            });
            return promise;
        }
    ).then(
        function() {
            var promise = new Parse.Promise();
            Parse.Object.destroyAll(traits, function (list, error) {
                if (list) {
                    promise.resolve(list);
                } else {
                    promise.reject(error);
                }
            });
            return promise;
        }   
    ).then(
        function() {
            var invitationQuery = new Parse.Query(Invitation);
            invitationQuery.limit(1000);
            invitationQuery.equalTo("groups", {"__type":"Pointer","className":"Group","objectId":group.id});
            return invitationQuery.find().then( 
                // TODO: check if results are undefined
                function(invitations) {
                    var promise = new Parse.Promise();
                    _.each(invitations, function(invitation) {
                        invitation.remove("groups", {"__type":"Pointer","className":"Group","objectId":group.id});
                    });
                    
                    Parse.Object.saveAll(invitations, function (list, error) {
                        if (list) {
                            promise.resolve(list);
                        } else {
                            promise.reject(error);
                        }
                    });
                    return promise;
                }
            );
        }
    ).then(
        function() {
            var roleQuery = new Parse.Query(Parse.Role);
            roleQuery.startsWith("name", group.id);
            return roleQuery.find().then( 
                function(roles) {
                    var promise = new Parse.Promise();
                    Parse.Object.destroyAll(roles, function (list, error) {
                        if (list) {
                            promise.resolve(list);
                        } else {
                            promise.reject(error);
                        }
                    });
                    return promise;
                }
            );
        }
    );
});
Parse.Cloud.define("getProfileData", function(req, res) {

    var user;
    var userGroups;
    var customGroups;
    var userProfile;
    var groupsInvited;
    //user.fetch();
    console.log("slug: " + req.params.userSlug);
    console.log("my slug: " + req.user.get("slug"));

    var userQuery = new Parse.Query(Parse.User);
    if ((req.user.get("slug") == req.params.userSlug) || req.params.userSlug == undefined) {
        console.log("You're looking at your own profile");
        Parse.Cloud.useMasterKey();
        userQuery.include("invitation.groups");
        userQuery.get(req.user.id);
    } else {
        userQuery.equalTo("slug", req.params.userSlug);
    }
    userQuery.include("groups.traits");
    userQuery.include("profile");
    userQuery.first().then( 
        function(result) {
            if (result != null) {
                user = result;
                userGroups = result.get("groups");
                userProfile = result.get("profile");
                //console.log("userGroups:" + JSON.stringify(userGroups));
                //console.log("invites:" + JSON.stringify(result.get("invitation")));
                groupsInvited = result.get("invitation").get("groups");
                //console.log("groupsInvited:" + JSON.stringify(groupsInvited));
                if (userGroups.length > 0) {
                    customGroups = _.filter(userGroups, function(group) {
                        if (group != null) {
                            return group.id !== settings.global.groupId;
                        }
                    });
                    //console.log("customGroups: " + JSON.stringify(customGroups));
                }

                res.success( {
                    user: user, 
                    customGroups: customGroups, 
                    userProfile: userProfile, 
                    groupsInvited: groupsInvited
                });
            } else {
                res.success("Can't get user profile.");    
            }
        }, function(error) {
            res.error(error);
        }
            /*var groupsInvitedIds = [];
            if (userInvitation != null && userInvitation.length > 0) {
                for (i in userInvitation) {
                    groupsInvitedIds.push(userInvitation[i].id);
                }
                console.log("groupsInvitedIds:" + groupsInvitedIds);
                return Parse.Cloud.run("getInvites", { invites: groupsInvitedIds });
            }*/
    );
});

Parse.Cloud.define("addUserToGroup", function(req, res) {
    console.log("in addUserToGroup");
    Parse.Cloud.useMasterKey();

    var user = Parse.User.current();
    var group = {};

    /*var addUserToRole = function(user, roleName) {
        var roleQuery = new Parse.Query(Parse.Role);
        roleQuery.equalTo("name", roleName);
        console.log("addUserToRole(" + JSON.stringify(user) + "," + roleName + ")");
        roleQuery.find().then(function(role) {
            console.log("role query response: " + JSON.stringify(role));
            role[0].getUsers().add(user);      
            role[0].save();
        });
    }; */
    //addUserToRole(user, "orrmOKjjUW_member");

    var groupQuery = new Parse.Query(Group);
    groupQuery.equalTo("slug", req.params.group);
    groupQuery.first().then(
        function(groupResult) {
            if (req.params.isGlobal) {
                group.id = settings.global.groupId;
                return;
            } else {
                group = groupResult;
                // check if an invite exists for this group
                //console.log("user invitations: " + JSON.stringify(user.get("invitation")));
                //console.log("user invitation ID: " + user.get("invitation").id);

                var invitationQuery = new Parse.Query(Invitation);
                invitationQuery.get(user.get("invitation").id);
                invitationQuery.include("groups");
                invitationQuery.equalTo("groups", {"__type":"Pointer","className":"Group","objectId":group.id});
                return invitationQuery.first();
            }
        }
    ).then(
        function(invitation) {
            console.log("user invitation query: " + JSON.stringify(invitation));

            if (req.params.isGlobal) {
                user.addUnique("groups", {"__type":"Pointer","className":"Group","objectId":group.id});
                console.log("adding globalGroup");
                return user.save();
            } else if (invitation != undefined) {
                console.log("invitation != undefined");
                var userACL = user.get("ACL");
                userACL.setRoleReadAccess(group.id + "_member", true);
                user.setACL(userACL);

                var profile = new Profile();
                profile = user.get("profile");
                profile.setACL(userACL);
                
                user.addUnique("groups", {"__type":"Pointer","className":"Group","objectId":group.id});
                invitation.remove("groups", {"__type":"Pointer","className":"Group","objectId":group.id});
                
                var promise = new Parse.Promise();
                Parse.Object.saveAll([user, invitation, profile], function (list, error) {
                    if (list) {
                        promise.resolve(list);
                    } else {
                        promise.reject(error);
                    }
                });
                return promise;
            } else {
                return Parse.Promise.error("You haven't been invited to this group.");
            }
        }
    ).then(
        function() {
            console.log("querying for role");
            var roleQuery = new Parse.Query(Parse.Role);
            roleQuery.equalTo("name", group.id + "_member");
            return roleQuery.first();
        }
    ).then( 
        function(role) {
            console.log("saving role");
            role.getUsers().add(user);      
            return role.save();            
        }
    ).then( 
        function() {
            console.log("almost there");
            if(!req.params.isGlobal) { 
                res.success(group);
            } else {
                res.success();
            }
            
        },
        function(error) {
            res.error(error);
        }
    );
});

Parse.Cloud.define("leaveGroup", function(req, res) {
    Parse.Cloud.useMasterKey();
    var user = Parse.User.current();
    var groupId = req.params.groupId;

    var query = new Parse.Query(Parse.Role);
    query.startsWith("name", groupId);
    
    query.find().then( 
        function(roles) {
            for (i in roles) {
                roles[i].getUsers().remove(user);
            }
 
            var promise = new Parse.Promise();
            Parse.Object.saveAll(roles, function (list, error) {
                if (list) {
                    console.log("promise list");
                    promise.resolve(list);
                } else {
                    console.log("promise error");
                    promise.reject(error);
                }
            });
            return promise;
        }
    ).then(
        function() {
            res.success();
        }, function(error) {
            res.error(error);
        }
    );

});
Parse.Cloud.define("addInviteToUser", function(req, res) {

    Parse.Cloud.useMasterKey();
    // the user objects formatted for Mandrill's recipient list
    var existingUserRecipients = [];
    // emails of people who already have SetMatch accounts
    var existingUsers = [];
    // emails of people who don't have SetMatch acccounts, i.e. existingInvitations + newInvitations
    var newUsers = [];
    // emails of people who don't have a SetMatch account but have previously been invited
    var existingInvitations = [];
    // emails of people who don't have a SetMatch account and have never been invited
    var newInvitations = [];

    // group being invited to
    var group = new Group();
    group.id = req.params.group;
    group.fetch();

    var userQuery = new Parse.Query(Parse.User);
    userQuery.containedIn("email", req.params.users);
    userQuery.include("profile");
    userQuery.include("invitation");
    userQuery.include("groups");
    userQuery.find().then(
        function(userResults) {
            // invite users who already exist in the system
            if (userResults.length > 0) {

                for (var i in userResults) {
                    var user = userResults[i];
                    // check if user is already a member of the group, in which case don't invite them
                    var groupIds = [];
                    for (j in user.get("groups")) {
                        groupIds.push(user.get("groups")[j].id);
                        console.log(user.get("email") + "groupIds.push(user.get(groups)[j].id) : " + user.get("groups")[j].id)
                        console.log("PRINT");
                    }

                    var groupMatch = _.find(groupIds, function(currentGroups) {
                        return currentGroups == group.id;
                    });
                    console.log(user.get("email") + " groupMatch:" + groupMatch);
                    if (groupMatch != undefined) {
                        // user is already a member of the group. No need to invite
                        console.log(user.get("email") + " user is already a member of the group. No need to invite");
                        continue;
                    }
                    console.log(user.get("email") +"if user is already a member of the group. This shouldn't print");
                    existingUsers.push(user.getEmail());

                    existingUserRecipients.push( { 
                        'email': user.get("email"),
                        'name': user.get("profile").get("t_" + settings.global.fname)
                    } );

                    // Add an invite to this user's existing invites.
                    var userInvitation = user.get("invitation");
                    console.log("userInvitation:" + JSON.stringify(userInvitation));
                    if (userInvitation != null) {
                        userInvitation.addUnique("groups", {"__type":"Pointer","className":"Group","objectId":group.id} );
                    } else {
                        var invitation = new Invitation();
                        invitation.set("email", user.get("email"));
                        invitation.addUnique("groups", {"__type":"Pointer","className":"Group","objectId":group.id} );
                        user.set("invitation", invitation);
                    }
                    
                }
                console.log("group.id " + group.id);

                var promise = new Parse.Promise();
                Parse.Object.saveAll(userResults, function (list, error) {
                    if (list) {
                        promise.resolve(list);
                    } else {
                        promise.reject(error);
                    }
                });
                return promise;
            }
        }
    ).then(
        function() {
            // subset of people who were invited who don't have user accounts, whether they've been invited previously or not
            newUsers = _.difference(req.params.users, existingUsers);

            // subset of people who've been invited to this group already
            var invitationQuery = new Parse.Query(Invitation);
            invitationQuery.containedIn("email", newUsers);
            invitationQuery.select("email", "groups");

            console.log("starting Invitation query");
            return invitationQuery.find();
        }
    ).then(
        function(invitationResults) {
            if (invitationResults.length > 0) {
                var modifiedInvitationObjects = [];
                // email address that have previously been invited and already have an Invitation row

                console.log("Got invitation results: " + JSON.stringify(invitationResults));

                for (var i in invitationResults) {
                    var invite = invitationResults[i];
                    existingInvitations.push(invite.get("email"));
                    modifiedInvitationObjects.push(invite);

                    // Add an invite to this user's existing invites.
                    invite.addUnique("groups", {"__type":"Pointer","className":"Group","objectId":group.id});
                }

                var promise = new Parse.Promise();
                Parse.Object.saveAll(modifiedInvitationObjects, function (list, error) {
                    if (list) {
                        promise.resolve(list);
                    } else {
                        promise.reject(error);
                    }
                });
                return promise;
            }
        }
    ).then(
        function() {
            // email address that have never been invited
            newInvitations = _.difference(newUsers, existingInvitations);
            console.log("New invitations array: " + newInvitations);
            var newInvitationObjects = [];

            for (var i in newInvitations) {
                var invite = newInvitations[i];
                var invitation = new Invitation();

                invitation.set("email", invite);
                invitation.set("groups", [{"__type":"Pointer","className":"Group","objectId":group.id}]);

                newInvitationObjects.push(invitation);
            }

            var promise = new Parse.Promise();
            Parse.Object.saveAll(newInvitationObjects, function (list, error) {
                if (list) {
                    promise.resolve(list);
                } else {
                    promise.reject(error);
                }
            });
            return promise;
        }
    ).then(
        function() {
            // send email invite to users
            console.log("About to send email");
            return Parse.Cloud.run("emailInvites", { 
                inviterEmail: req.user.get("email"),
                existingUsers: existingUserRecipients, newUsers: newUsers, group: group.get("name") });
        }
    ).then(
        function(message) {
            console.log("Success! Finished invite cloud function: " + message);
            res.success();
        }, 
        function(error) {
            res.error(error.message);
        }
    );  
});

Parse.Cloud.define("emailInvites", function(req, res) {
    Parse.Cloud.useMasterKey();
    console.log("In email function");
    var inviter;
    var Mandrill = require('mandrill');
    Mandrill.initialize('cHThIIVKJFLq30kpDSYiHw');

    var sendEmail = function(to, subject, message) {
        Mandrill.sendEmail({
            message: {
                text: message,
                subject: subject,
                from_email: "admin@setmatch.es",
                from_name: "SetMatch",
                to: to
            },
                async: true
            },
            {
                success: function(httpResponse) {
                    res.success("Email sent to " + JSON.stringify(to));
                },
                error: function(httpResponse) {
                    //console.error(httpResponse);
                    res.error("Uh oh, problem sending the email invitations.");
                }
            }
        );
    }

    var userQuery = new Parse.Query(Parse.User);
    userQuery.equalTo("email", req.params.inviterEmail);
    userQuery.include("profile");
    userQuery.first().then(
        function(user) {
            console.log("user: " + JSON.stringify(user));

            inviter = user.get("profile").get("t_" + settings.global.fname) + " " + 
                user.get("profile").get("t_" + settings.global.lname) + " (" + req.params.inviterEmail + ")";
            // this may be buggy
            if (req.params.existingUsers.length > 0) {
                console.log("existingUsers: " + JSON.stringify(req.params.existingUsers));
                sendEmail(req.params.existingUsers, "You've been invited to join a SetMatch group!", 
                    "Woohoo, " + inviter + " has invited you to the " + req.params.group +
                    ' group. To accept, log in at https://www.setmatch.es');
            }
            if (req.params.newUsers.length > 0) {
                var newUsers = [];
                for (var i in req.params.newUsers) {
                    // format for Mandrill to:
                    newUsers.push( { 'email': req.params.newUsers[i] } );
                }
                console.log("newUsers: " + JSON.stringify(newUsers));
                sendEmail(newUsers, "You've been invited to SetMatch!", 
                    "Hey! " + inviter + " has invited you to the " + req.params.group +
                    " group on SetMatch. To accept, create an account using this email address at https://www.setmatch.es");
            }
        }
    );
    // ??
    //res.success();
});

/* Not currently in use */
Parse.Cloud.define("addUserToAdmin", function(req, res) {

    Parse.Cloud.useMasterKey();
    var currentUser = req.user;
    var accountName = req.params.accountname;
    var isAdmin = req.params.admin;

    var query = new Parse.Query(Parse.Role);
    query.contains("name", accountName);
    query.find({
        success : function(roles) {
            console.log("roles: " + roles.length);
            for (var i = 0; i < roles.length; i++) {

                if ( isAdmin = false && roles[i].get("name").search("_admin") >= 0)
                    continue;

                roles[i].getUsers().add(currentUser);
                roles[i].save();
            }
            response.success();
        },
        error : function(error) {
            response.error("error adding to admin role " + error);
        }
    });
});