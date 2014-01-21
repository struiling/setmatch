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
        console.log("only for new users: " + JSON.stringify(req.user));
        Parse.Cloud.run("addUserToGroup", { isGlobal: true} );
    }
});

Parse.Cloud.afterDelete(Parse.User, function(req, res) {
    var profile = new Profile();
    profile = req.object.get("profile");

    var invitation = new Invitation();
    invitation = req.object.get("invitation");

    Parse.Object.destroyAll([profile, invitation], {
        success: function() {},
        error: function(error) {
          console.error("Error deleting related user data. " + error.code + ": " + error.message);
        }
    });
});

/*
// TODO: make groups not be deletable if there are members other than the current member
Parse.Cloud.beforeDelete("Group", function(req, res) {

});
*/
Parse.Cloud.afterDelete("Group", function(req, res) {
    // TODO: delete group members' Profile trait values that were part of this group
    //       or move to background job that runs daily

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
            var invitationQuery = new Parse.Query("Invitation");
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
    var globalGroup;
    var userProfile;
    var groupsInvited;
    //user.fetch();
    console.log("slug: " + req.params.userSlug);

    var userQuery = new Parse.Query(Parse.User);
    if (Parse.User.current().get("slug") == req.params.userSlug) {
        console.log("You're looking at your own profile");
        Parse.Cloud.useMasterKey();
        userQuery.include("invitation.groups");
    }
    userQuery.include("groups.traits");
    userQuery.include("profile");
    userQuery.equalTo("slug", req.params.userSlug);
    userQuery.first().then( 
        function(result) {
            if (result != null) {
                user = result;
                userGroups = result.get("groups");
                userProfile = result.get("profile");
                console.log("userProfile:" + JSON.stringify(userProfile));
                console.log("invites:" + JSON.stringify(result.get("invitation")));
                groupsInvited = result.get("invitation").get("groups");
                console.log("groupsInvited:" + JSON.stringify(groupsInvited));
                customGroups = _.filter(userGroups, function(group) {
                     return group.id !== settings.global.group;
                });
                console.log("customGroups: " + JSON.stringify(customGroups));
                globalGroup = _.first(_.filter(userGroups, function(group) {
                     return group.id == settings.global.group;
                }));
                console.log("globalGroup: " + JSON.stringify(globalGroup));

                res.success( {
                    user: user, 
                    customGroups: customGroups, 
                    globalGroup: globalGroup, 
                    userProfile: userProfile, 
                    groupsInvited: groupsInvited
                });
            } else {
                res.success(error.message);    
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
                group.id = settings.global.group;
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
            //console.log("user invitation groups: " + JSON.stringify(invitation.get("groups")));
            //console.log("group: " + JSON.stringify(group));

            // check if user has actually been invited to this group
            /*var invitationGroupIds = [];
            for (i in invitation.get("groups")) {
                invitationGroupIds.push(invitation.get("groups")[i].id);
            }
            var inviteMatch = _.find(invitationGroupIds, function(invite) {
                return invite == group.id;
            });*/

            //console.log("invitationGroupIds: " + invitationGroupIds);
            //console.log("inviteMatch: " + inviteMatch);

            if (invitation != undefined) {
                
                user.addUnique("groups", {"__type":"Pointer","className":"Group","objectId":group.id});
                invitation.remove("groups", {"__type":"Pointer","className":"Group","objectId":group.id});
                
                var promise = new Parse.Promise();
                Parse.Object.saveAll([user, invitation], function (list, error) {
                    if (list) {
                        promise.resolve(list);
                    } else {
                        promise.reject(error);
                    }
                });
                return promise;

            } else if (req.params.isGlobal) {
                user.addUnique("groups", {"__type":"Pointer","className":"Group","objectId":group.id});
                console.log("return out of addUserToGroup");
                return user.save();

            } else {
                return Parse.Promise.error("You haven't been invited to this group.");
            }
        }
    ).then(
        function() {
            var roleQuery = new Parse.Query(Parse.Role);
            roleQuery.equalTo("name", group.id + "_member");
            
            return roleQuery.first();
        }
    ).then( 
        function(role) {
            role.getUsers().add(user);      
            role.save();
            
        }
    ).then( function() {
        res.success("You've joined " + group.get("name"));
    }, function(error) {
        res.error(error);
    });
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
                        'name': user.get("profile").get(settings.global.fname)
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
            return Parse.Cloud.run("emailInvites", { existingUsers: existingUserRecipients, newUsers: newUsers, group: group.get("name") });
        }
    ).then(
        function(message) {
            console.log("Success! Finished invite cloud function: " + message);
            res.success();
        }, 
        function(error) {
            res.error("Group lookup failed.");
        }
    );  
});

Parse.Cloud.define("emailInvites", function(req, res) {
    console.log("In email function");
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
                    res.success("Email sent to " + to);
                },
                error: function(httpResponse) {
                    //console.error(httpResponse);
                    res.error("Uh oh, something went wrong");
                }
            }
        );
    }
    // this may be buggy
    if (req.params.existingUsers.length > 0) {
        console.log("existingUsers: " + JSON.stringify(req.params.existingUsers));
        sendEmail(req.params.existingUsers, "You've been invited to join a SetMatch group!", 
            "Woohoo, you've been invited to the " + req.params.group +
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
            "Hey! You've been invited to the " + req.params.group +
            " group on SetMatch. To accept, create an account at https://www.setmatch.es");
    }

    // ??
    res.success();
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