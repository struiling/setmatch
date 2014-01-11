var Profile = Parse.Object.extend("Profile");
var Group = Parse.Object.extend("Group");

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

	        var group = new Group();
	        var groups = []
	        for (var i in user.get("groups")) {
	        	group = user.get("groups")[i];
	        	group.fetch();
				groups.push(group);
			}

	        res.locals.basicGroups = groups;
	        console.log("basicGroups: " + JSON.stringify(res.locals.basicGroups));
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