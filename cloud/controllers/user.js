
exports.new = function(req, res) {
	var user = new Parse.User();

	user.set("username", req.body.email);
	user.set("password", req.body.password);
	user.set("email", req.body.email);
	 
	// other fields can be set just like with Parse.Object
	// user.set("phone", "415-392-0202");
	 
	user.signUp(null, {
	  success: function(user) {
	    // Hooray! Let them use the app now.
	    res.send(200, "OK");
	  },
	  error: function(user, error) {
	    // Show the error message somewhere and let the user try again.
	    res.send(500, "Error: " + error.code + " " + error.message);
	  }
	});
}
