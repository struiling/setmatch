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
Parse.Cloud.beforeSave("Group", function(request, response) {
	if (!request.object.get("urlName")) {
    	response.error("A URL is required.");
	} else {
	    var query = new Parse.Query(Group);
	    query.equalTo("urlName", request.object.get("urlName"));
	    console.log("request.object.id: "+request.object.id);

	    query.first({
	        success: function(object) {
	        	console.log("object.id: "+object.id);
	      		if (object.id !== request.object.id) {
	          		response.error("A group with this URL already exists.");
	        	} else {
	          		response.success();
	        	}
	      	},
	      	error: function(error) {
	        	response.error("Could not validate uniqueness for this group URL.");
	      	}
	    });
  	}
});

