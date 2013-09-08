
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
	    res.redirect('/welcome');
	    /*res.render('match/welcome', {
	    	username: Parse.User.current().getEmail()
	    });*/
	  },
	  error: function(user, error) {
	    // Show the error message somewhere and let the user try again.
	    //res.send(500, "Error: " + error.code + " " + error.message);
	    var errorMessage = undefined;

	    switch (error.code) {
	    	case -1:
	    		errorMessage = "Please enter an email address and password";
    			break;
    		case 200:
    		case 204:
    			errorMessage = "Please enter an email address";
    			break;
    		case 201:
    			errorMessage = "Please enter a password";
    			break;
			default:
				errorMessage = "Oops! Something went wrong.";
	    }

	    res.render('match/index', {
	    	error: errorMessage,
	    	errorParseMessage: error.code + ' ' + error.message
	    });
	  }
	});
};

exports.login = function(req, res) {
	Parse.User.logIn(req.body.email, req.body.password).then(function() {
	    // Do stuff after successful login.
	    res.redirect('/welcome');
	    /*res.render('match/welcome', {
	    	username: Parse.User.current().getEmail()
	    });*/
	},
	function(error) {
	    // The login failed. Check error to see why.
	    var errorMessage = undefined;

	    switch (error.code) {
	    	case -1:
	    		errorMessage = "Please enter an email address and password";
    			break;
    		case 200:
    		case 204:
    			errorMessage = "Please enter an email address";
    			break;
    		case 201:
    			errorMessage = "Please enter a password";
    			break;
			default:
				errorMessage = "Oops! Something went wrong.";
	    }

	    res.render('match/index', {
	    	error: errorMessage,
	    	errorParseMessage: error.code + ' ' + error.message
	    });
	});
};

exports.logout = function(req, res) {
	Parse.User.logOut();

	res.render('match/index', {
	 	message: "You're logged out!"
	});
};

exports.welcome = function(req, res) {

	Parse.Cloud.run("checkUser", {}, {
		success: function(user) {
			res.render("match/welcome", { username: "Your username here: " + user });			
		},
		error: function(error) {
			res.redirect("/logout");
		}
	});

};