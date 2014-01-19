var _ = require('underscore');
var Profile = Parse.Object.extend("Profile");
var Group = Parse.Object.extend("Group");

// Use this middleware to require that a user is logged in

module.exports = function(req, res, next) {
	var user = Parse.User.current();
	if (user) {
		// actually get current user fields
		user.fetch().then(
				function(result) {
			        var profile = new Profile();
					profile.id = user.get("profile").id;
					return profile.fetch();
				}
			).then(
	        	function(profile) {
			        res.locals.basicProfile = profile;

			        var group = new Group();
			        var promise = Parse.Promise.as();
			        //var groups = []
			        _.each(user.get("groups"), function(group) {
				        promise = promise.then(function() {
	    					// Return a promise that will be resolved when the group is fetched
	    					return group.fetch();
	  					});
					});
  					return promise;

			        console.log("basicProfile: " + JSON.stringify(res.locals.basicProfile));
			        console.log("basicUser: " + JSON.stringify(res.locals.basicUser));
		        }
	        ).then(
	        	function(groups) {
					res.locals.basicUser = user;
			        res.locals.basicGroups = groups;
			        console.log("basicGroups: " + JSON.stringify(res.locals.basicGroups));
					next();
		        },
		        function(error) {
		        	// Render error page.
		        	res.flash("message", "Please log in and try again.");
		        	res.redirect("logout");
		        }
	        );

	} else {
		res.render('index');
	}
}