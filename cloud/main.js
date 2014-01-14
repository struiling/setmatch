require('cloud/app.js');
var _ = require('underscore');
var Group = Parse.Object.extend("Group");
var Profile = Parse.Object.extend("Profile");
var Invitation = Parse.Object.extend("Invitation");

Parse.Cloud.define("checkUser", function(req, res) {
    var user = req.user;
    if (user) {
    	res.success(user);	
    } else {
    	res.error("User not found");	
    }
});
/*
Parse.Cloud.beforeSave("Group", function(req, res) {
    Parse.Cloud.useMasterKey();

    //TODO: strip spaces and bad characters from urlName (only alphanumeric and - and _)
    console.log('req.object.get("urlName"): ' + req.object.get("urlName"));
    console.log('req.object: ' + JSON.stringify(req.object));
	if (!req.object.get("urlName") && req.object.isNew()) {
    	res.error("A URL is required.");
	} else {
        var urlName = req.object.get("urlName").toLowerCase();
	    var query = new Parse.Query(Group);

        // check if another group has this URL, and is not the one you're saving
	    query.equalTo("urlName", urlName);
	    console.log("req.object.id: "+req.object.id);

        query.first().then(function(object) {
        	//console.log("object.id: "+object.id);
      		if (object !== undefined &&
      			req.object.id !== object.id) {
                // duplicate group found
              console.log("duplicate group found");
          		res.error("A group with this URL already exists.");
        	} else {
          		req.object.set("urlName", urlName);
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

Parse.Cloud.define("getInvites", function(req, res) {
    Parse.Cloud.useMasterKey();
    var user = req.user;

    // query for groups where the group objectId matches the invite the user is accepting
    var query = new Parse.Query(Group);
    query.containedIn("objectId", user.get("invites"));
    query.find().then( function(results) {
        var groupsInvited = results;
        console.log("group results: " + JSON.stringify(groupsInvited));
        res.success(groupsInvited);
        
    })
});

Parse.Cloud.define("addUserToGroup", function(req, res) {
    Parse.Cloud.useMasterKey();

    var user = req.user;
    var groupName;

    var addUserToRole = function(user, roleName) {
        var roleQuery = new Parse.Query(Parse.Role);
        roleQuery.equalTo("name", roleName);
        console.log("addUserToRole(" + JSON.stringify(user) + "," + roleName + ")");
        roleQuery.find().then(function(role) {
            console.log("role query response: " + JSON.stringify(role));
            role[0].getUsers().add(user);      
            role[0].save();
        });
    };
    //addUserToRole(user, "orrmOKjjUW_member");


    var groupQuery = new Parse.Query(Group);
    groupQuery.equalTo("urlName", req.params.group);
    groupQuery.first().then(function(group) {
        var groupId = group.id;
        groupName = group.get("name");
        // check if an invite exists for this group
        var inviteMatch = _.find(user.get("invites"), function(invite) {
            return invite == groupId;
        });
        if (inviteMatch != undefined) {
            
            // TODO: check if user is already a member of the group
            
            user.addUnique("groups", {"__type":"Pointer","className":"Group","objectId":groupId});
            user.remove("invites", groupId);
            user.save();

            var roleQuery = new Parse.Query(Parse.Role);
            roleQuery.equalTo("name", group.id + "_member");
            
            return roleQuery.first();

        } else {
            return Parse.Promise.error("You haven't been invited to this group.");
        }
    }).then( function(role) {
        role.getUsers().add(user);      
        role.save();
        
    }).then( function() {
        res.success("You've joined " + groupName);
    }, function(error) {
        res.success(error);
    });
});

Parse.Cloud.define("addInviteToUser", function(req, res) {

    Parse.Cloud.useMasterKey();
    var existingUsers = [];
    var newUsers = [];
    var existingInvitations = [];
    var newInvitations = [];

    var group = new Group();
    group.id = req.params.group;
    group.fetch();

    // This functionality is a bit inconsistent. Fix promises.

    var userQuery = new Parse.Query(Parse.User);
    userQuery.containedIn("email", req.params.users);
    userQuery.select("email", "groups", "invites");
    userQuery.find().then(
        function(userResults) {
            if (userResults.length > 0) {

                // invite users who already exist in the system
                for (var i in userResults) {
                    var user = userResults[i];
                    existingUsers.push(user.getEmail());

                    // Add an invite to this user's existing invites.
                    user.addUnique("invites", group.id);
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
            // people who were invited who aren't already users on the site
            newUsers = _.difference(req.params.users, existingUsers);

            // See who's been invited before
            
            //Parse.Cloud.run("addInviteToInvitation", { users: newUsers, group: group },
            // { success: function() {} });

            var invitationQuery = new Parse.Query(Invitation);
            invitationQuery.containedIn("email", newUsers);
            invitationQuery.select("email", "invites");

            console.log("starting Invitation query");
            return invitationQuery.find();
        }
    ).then(
        function(invitationResults) {
            if (invitationResults.length > 0) {
                var modifiedInvitationObjects = [];
                // email address that have previously been invited

                console.log("Got invitation results: " + JSON.stringify(invitationResults));

                for (var i in invitationResults) {
                    var invite = invitationResults[i];
                    existingInvitations.push(invite.get("email"));
                    modifiedInvitationObjects.push(invite);

                    // Add an invite to this user's existing invites.
                    invite.addUnique("invites", req.params.group);
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
                invitation.set("invites", [req.params.group]);
                newInvitationObjects.push(invitation);

                console.log("Post save: " + JSON.stringify(invitation));
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
            return Parse.Cloud.run("emailInvites", { existingUsers: existingUsers, newUsers: newUsers, group: group.get("name") });
        }
    ).then(
        function() {
            console.log("Success! Finished invite cloud function");
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
                    console.log(httpResponse);
                    //response.success("Email sent!");
                },
                error: function(httpResponse) {
                    console.error(httpResponse);
                    //response.error("Uh oh, something went wrong");
                }
            }
        );
    }
    if (req.params.existingUsers.length > 0) {
        var existingUsers = [];
        for (var i in req.params.existingUsers) {
            existingUsers.push( { 'email': req.params.existingUsers[i] } );
        }
        console.log("existingUsers: " + JSON.stringify(existingUsers));
        sendEmail(existingUsers, "You've been invited to join a SetMatch group!", 
            "Woohoo, you've been invited to the " + req.params.group +
            'group. To accept, log in at <a href="https://www.setmatch.es">https://www.setmatch.es</a>');
    }
    if (req.params.newUsers.length > 0) {
        var newUsers = [];
        for (var i in req.params.newUsers) {
            newUsers.push( { 'email': req.params.newUsers[i] } );
        }
        sendEmail(newUsers, "You've been invited to SetMatch!", 
            "Hey! You've been invited to the " + req.params.group +
            " group on SetMatch. To accept, create an account at https://www.setmatch.es");
    }

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