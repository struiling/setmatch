var settings = require('cloud/settings');
var gravatar = require('cloud/lib/gravatar');
var Profile = Parse.Object.extend("Profile");
var Invitation = Parse.Object.extend("Invitation");

exports.delete = function(req, res) {
	// TODO: create deactivate feature that makes user invisible and restricts their view of others 
    var user = Parse.User.current();
    // TODO: move to afterDelete
    var profile = new Profile();
    profile = user.get("profile");
    profile.destroy().then(
    	function() {
    		return user.destroy();
    	}
	).then(
		function() {
			Parse.User.logOut();
			res.flash('message', 'Your account has been deleted.');
		    res.redirect('/');		
		}
	);
};

exports.login = function(req, res) {
	Parse.User.logIn(req.body.email, req.body.password).then(
		function() {
		    // Do stuff after successful login.
		    res.redirect('/');
		}, 
		function(error) {
		    // The login failed. Check error to see why.

		    res.flash('message', 'Ruh roh! Something went wrong. ' + error.code + ' ' + error.message);
		    res.redirect('/');
		}
	);
};

exports.logout = function(req, res) {
	Parse.User.logOut();

	res.redirect('/');
};

exports.new = function(req, res) {
	/* TODO: add email verification? */

	var user = new Parse.User();
	user.set("username", req.body.email.toLowerCase());
	user.set("email", req.body.email.toLowerCase());
	user.set("password", req.body.password);
	user.set("gravatar", gravatar.url(req.body.email, {}, true) );
	
	user.signUp().then( 
		function() {
			console.log("in signup function! " + JSON.stringify(user));

			var query = new Parse.Query(Invitation);
			query.equalTo("email", req.body.email.toLowerCase());
			console.log("query.first(): " + JSON.stringify(query.first()));
			return query.first();

		}
	).then( 
		function(existingInvitation) {

			// TODO: convert to Cloud Code and set invitations with ACL
			if (existingInvitation) {
				// match up existing Invitation with new User
				console.log("invitation");
				user.set("invitation", existingInvitation);
			} else {
				// user has never been invited. Create new Invitation row and associate it
				var invitation = new Invitation();
				user.set("invitation", invitation);
				invitation.set("email", user.get("email"));
			}
			// add invite to Global group, which will be immediately fulfilled in afterSave
			invitation.addUnique("groups", {"__type":"Pointer","className":"Group","objectId":settings.global.group} );
			var profile = new Profile();
			// TODO: Add user to global group on signup
			profile.set(settings.global.fname, req.body.fname);
			profile.set(settings.global.lname, req.body.lname);

	    	user.set("profile", profile);
	    	return user.save();
		}
	).then(
		function(success) {
			res.flash('message', 'Thanks for signing up!');
	    	res.redirect('/');
		}, 
		function(error) {
			// Show the error message somewhere and let the user try again.
		    //res.send(500, "Error: " + error.code + " " + error.message);
		    res.flash("message", "Oops! Something went wrong." + error.message);
		    res.redirect("/");
		}
	);
};

exports.reset = function(req, res) {

	Parse.User.requestPasswordReset(req.body.email, {
		success: function() {
			res.flash("message", "Password reset email sent. Check your email!");
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
};