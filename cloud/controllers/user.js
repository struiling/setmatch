exports.login = function(req, res) {
	Parse.User.logIn(req.body.email, req.body.password).then(function() {
	    // Do stuff after successful login.
	    res.redirect('/');
	}, function(error) {
	    // The login failed. Check error to see why.
	    //var errorMessage = "Oops! Something went wrong.";

	    res.flash('message', 'Ruh roh! Something went wrong. ' + error.code + ' ' + error.message);

	    res.render('match/index');
	});
};

exports.logout = function(req, res) {
	Parse.User.logOut();

	res.redirect('/');
};

exports.new = function(req, res) {
	var user = new Parse.User();

	user.set("username", req.body.email);
	user.set("password", req.body.password);
	user.set("email", req.body.email);
	user.set("fname", req.body.fname);
	user.set("lname", req.body.lname);
	 
	// other fields can be set just like with Parse.Object
	// user.set("phone", "415-392-0202");
	 
	user.signUp(null, {
		success: function(user) {
	    // Hooray! Let them use the app now.
	    	res.flash('message', 'Thanks for signing up!');
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

exports.reset = function(req, res) {

	Parse.User.requestPasswordReset(req.body.email, {
		success: function() {
	    	res.redirect("/");
		},
		error: function(error) {
	    // Show the error message somewhere
			alert("Error: " + error.code + " " + error.message);
	  	}
	});

};

exports.fb = function(req, res) {
	Parse.FacebookUtils.logIn(null, {
	success: function(user) {
		if (!user.existed()) {
			alert("User signed up and logged in through Facebook!");
		} else {
			alert("User logged in through Facebook!");
		}
	},
	error: function(user, error) {
		alert("User cancelled the Facebook login or did not fully authorize.");
	}
});
}