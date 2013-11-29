require('cloud/app.js');

Parse.Cloud.define("checkUser", function(req, res) {
    var user = req.user;
    if (user) {
    	res.success(user);	
    } else {
    	res.error("User not found");	
    }
});

var Group = Parse.Object.extend("Group");
Parse.Cloud.beforeSave("Group", function(req, res) {
    //TODO: strip spaces and bad characters from urlName (only alphanumeric and - and _)
    var urlName = req.object.get("urlName").toLowerCase();
	if (!req.object.get("urlName")) {
    	res.error("A URL is required.");
	} else {
	    var query = new Parse.Query(Group);

        // check if another group has this URL, and is not the one you're saving
	    query.equalTo("urlName", urlName);
	    console.log("req.object.id: "+req.object.id);

        query.first().then(function(object) {
        	//console.log("object.id: "+object.id);
      		if (object !== undefined &&
      			req.object.id !== object.id) {
                // duplicate group found
              console.log("dupliacte group found");
          		res.error("A group with this URL already exists.");
        	} else {
          		req.object.set("urlName", urlName);
                res.success();
        	}	    	
	    });
  	}
});

Parse.Cloud.beforeSave(Parse.User, function(req, res) {

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

Parse.Cloud.define("addUsersToGroup", function(req, res) {

    Parse.Cloud.useMasterKey();
    var userQuery = new Parse.Query(Parse.User);
    userQuery.containedIn("email", req.params.users);
    userQuery.find().then(function(userResults) {
        console.log("query results: " + JSON.stringify(userResults));
        // invite all found users to group

        // create temporary entry for nonexistent users with invites to group


        
    }).then(function() {
        res.success();
    });

    var groupQuery = new Parse.Query(Group);
    groupQuery.equalTo("urlName", req.params.groupUrl);
    groupQuery.find().then(function(groupResult) {
        var group = groupResult[0];
        console.log("Group to add members to: " + JSON.stringify(group));
        if (results[0] == null) {
            res.error("Group lookup failed.");
            return;
        }
        
        // TODO (Changes to the global database):
        // 
        // Add a field to the "User" object that is "OpenInvites", groups they've been invited to join.
        //
        // Create a new table "GroupInvitesForNewUsers", containing user email addresses (for users that don't exist)
        // and groups they've been invited to join.

        // TODO (In this function):
        //
        // Foreach user to be added to this group
        //    If the user exists
        //       Add this group to their list of OpenInvites
        //       Send them an email notification that they've received a group invitation.
        //
        //    If the user doesn't exist
        //       Add this invite (user email address + group name) to the GroupInvitesForNewUsers
        //       Send them an email inviting them to sign up, notifying them that they've been invited to join a group

        // TODO (On user account creation):
        //
        // If the new user has any listings in GroupInvitesForNewUsers that match their email address
        //    Move that invite from GroupInvitesForNewUsers to OpenInvites in their User object

        // go through list of newly added members
        for (var i in req.params.users) {
            var newUser = req.params.users[i];
            console.log("got new member: " + newUser);

            //save to DB

            // add members who already exists in system
            
                // generate group offer token associated with an email addy to store in the DB
                // on user welcome page, list groups they have been invited to join, with button to accept
                // send email with new group invite notification

            // add members who do not exist in system

                // same as above, but different email text to sign up and join group
        }


        

    }, function(error) {
        res.error("Group lookup failed.");
    });             

});


/* Not currently in use */
Parse.Cloud.define("addUsersToAdmin", function(req, res) {

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