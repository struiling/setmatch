require('cloud/app.js');


// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
});

Parse.Cloud.define("checkUser", function(request, response) {
    var user = request.user;
    if (user) {
    	response.success(user);	
    } else {
    	response.error("User not found");	
    }
});

var Group = Parse.Object.extend("Group");
Parse.Cloud.beforeSave("Group", function(req, res) {
	if (!req.object.get("urlName")) {
    	res.error("A URL is required.");
	} else {
	    var query = new Parse.Query(Group);

        // check if another group has this URL, and is not the one you're saving
	    query.equalTo("urlName", req.object.get("urlName"));
	    //console.log("req.object.id: "+req.object.id);

        query.first({
	      	error: function(error) {
	        	res.error("Could not validate uniqueness for this group URL.");
	      	}
	    }).then(function(object) {
        	//console.log("object.id: "+object.id);
      		if (object !== undefined &&
      			req.object.id !== object.id) {
                // duplicate group found
          		res.error("A group with this URL already exists.");
        	} else {
          		res.success();
        	}	    	
	    });
  	}
});

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