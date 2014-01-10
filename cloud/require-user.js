var Profile = Parse.Object.extend("Profile");

// Use this middleware to require that a user is logged in

module.exports = function(req, res, next) {
	if (Parse.User.current()) {
		// actually get current user fields
		Parse.User.current().fetch().then(function(user) {
	        res.locals.basicUser = user;
	        var profile = new Profile();
			profile.id = user.get("profile").id;
			profile.fetch();
	        res.locals.basicProfile = profile;
	        console.log("profile: " + JSON.stringify(res.locals.basicProfile));
        }).then(function() {
			next();
        },
        function(error) {
        	// Render error page.
        	res.redirect("logout");
        });

	} else {
		res.render('index', { message: "You're not logged in." });
	}
}