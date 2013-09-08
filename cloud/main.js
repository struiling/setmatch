require('cloud/app.js');


// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
});

Parse.Cloud.define("checkUser", function(request, response) {
    var user = request.user;
    if (user) {
    	response.success(user.get("username"));	
    } else {
    	response.error("User not found");	
    }
});