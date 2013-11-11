// Use this middleware to require that a user is logged in

module.exports = function(req, res, next) {
	if (Parse.User.current()) {
		
		// actually get current user fields
		Parse.User.current().fetch().then(function(user) {
	        res.locals.basicUser = user;
        }).then(function() {
			next();
        },
        function(error) {
        	// Render error page.
        	
        });

	} else {
		res.render('index', { message: "You're not logged in." });
	}
}