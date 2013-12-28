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

    // This functionality is a bit inconsistent. Fix promises.
    // TODO: eliminate this group query because we actually have the group ID we can pass in directly
    var groupQuery = new Parse.Query(Group);
    groupQuery.equalTo("urlName", req.params.group);
    groupQuery.find().then(function(groupResult) {
        var group = groupResult[0];
        if (group == null) {
            res.error("Group lookup failed.");
            return;
        }
        console.log("Group to add members to: " + JSON.stringify(group));

        var userQuery = new Parse.Query(Parse.User);
        userQuery.containedIn("email", req.params.users);
        userQuery.select("email", "groups", "invites");
        userQuery.find().then(function(userResults) {

            // invite users who already exist in the system
            var existingUsers = [];

            for (var i in userResults) {
                var user = userResults[i];

                existingUsers.push(user.getEmail());

                // Add an invite to this user's existing invites.
                user.addUnique("invites", group.id);
                
                user.save();
            }

            // create Invitation entry for nonexistent users with invites to this group
            var newUsers = _.difference(req.params.users, existingUsers);
            Parse.Cloud.run("addInviteToInvitation", { users: newUsers, group: group.id },
             { success: function() {} });

        }).then(function() {
            res.success();
        });
   
        // TODO (In this function):
        //
        // Foreach user to be added to this group
        //    If the user exists
        //       Send them an email notification that they've received a group invitation.
        //
        //    If the user doesn't exist
        //       Send them an email inviting them to sign up, notifying them that they've been invited to join a group

    }, function(error) {
        res.error("Group lookup failed.");
    });  

});

Parse.Cloud.define("addInviteToInvitation", function(req, res) {

    var group = new Group();
    group.id = req.params.group;

    var invitationQuery = new Parse.Query(Invitation);
    invitationQuery.containedIn("email", req.params.users);
    invitationQuery.select("email", "invites");

    console.log("starting Invitation query");
    invitationQuery.find().then(function(invitationResults) {

        // user has previously been invited

        console.log("Got invitation results: " + JSON.stringify(invitationResults));
        var existingInvitations = [];

        for (var i in invitationResults) {
            var invite = invitationResults[i];

            existingInvitations.push(invite.get("email"));

            // Add an invite to this user's existing invites.
            invite.addUnique("invites", req.params.group);
            invite.save();
        }

        // create Invitation entry for nonexistent users with invites to this group
        var newInvitations = _.difference(req.params.users, existingInvitations);
        console.log("New invitations array: " + newInvitations);

        for (var i in newInvitations) {
            var invite = newInvitations[i];

            var invitation = new Invitation();
            invitation.set("email", invite);
            invitation.set("invites", [req.params.group]);
            invitation.save();
            console.log("Post save: " + JSON.stringify(invitation));
        }    

     

    }).then( function() {
       res.success();
    }, function(error) {
        console.log("Invitation query failed: " + error);
    });
           
});


/* for afterSave

check if object was newly created. Essentially afterCreate

if (request.object.existed()) { 
    // it existed before 
} else { 
    // it is new 
}

*/

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