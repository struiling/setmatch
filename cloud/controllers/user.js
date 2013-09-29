exports.login = function(req, res) {
	Parse.User.logIn(req.body.email, req.body.password).then(function() {
	    // Do stuff after successful login.
	    res.redirect('/');
	}, function(error) {
	    // The login failed. Check error to see why.
	    var errorMessage = "Oops! Something went wrong.";

	    res.render('match/index', {
	    	error: errorMessage,
	    	errorParseMessage: error.code + ' ' + error.message
	    });
	});
};

exports.logout = function(req, res) {
	Parse.User.logOut();

	res.redirect('/');
};

exports.new = function(req, res) {
	var user = new Parse.User();

	user.set("username", req.body.username);
	user.set("password", req.body.password);
	user.set("email", req.body.email);
	 
	// other fields can be set just like with Parse.Object
	// user.set("phone", "415-392-0202");
	 
	user.signUp(null, {
		success: function(user) {
	    // Hooray! Let them use the app now.
	    	res.redirect('/');
		},
		error: function(user, error) {
	    // Show the error message somewhere and let the user try again.
	    //res.send(500, "Error: " + error.code + " " + error.message);
		    var errorMessage = undefined;
		    errorMessage = "Oops! Something went wrong.";

		    res.render('match/index', {
		    	error: errorMessage,
		    	errorParseMessage: error.code + ' ' + error.message
		    });
		}
	});
};

exports.welcome = function(req, res) {

	Parse.Cloud.run("checkUser", {}, {
		success: function(user) {
			res.render("welcome", { username: "Your username here: " + user });			
		},
		error: function(error) {
			res.redirect("/logout");
		}
	});

};