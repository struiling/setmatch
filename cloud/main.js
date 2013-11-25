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

        // check if another group has this URL, and is not the one you're saving
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