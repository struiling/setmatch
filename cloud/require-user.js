var _ = require('underscore');
var settings = require('cloud/settings');
var Profile = Parse.Object.extend("Profile");
var Group = Parse.Object.extend("Group");

// Use this middleware to require that a user is logged in

module.exports = function(req, res, next) {
	var user = Parse.User.current();
	var basicProfile;
	var basicGroups = [];

	if (user) {
		// actually get current user fields
		user.fetch().then(
				function(result) {
					res.locals.basicUser = user;
			        console.log("basicUser: " + JSON.stringify(res.locals.basicUser));

			        var profile = new Profile();
					profile.id = user.get("profile").id;
					return profile.fetch();
				}
			).then(
	        	function(profile) {
			        res.locals.basicProfile = profile;
			        console.log("basicProfile: " + JSON.stringify(res.locals.basicProfile));

			        var promises = [];
			        var groups = [];
					customGroups = _.filter(user.get("groups"), function(group) {
		                return group.id !== settings.global.groupId;
		            });
			        _.each(customGroups, function(group) {
			        	basicGroups.push(group);
			        	promises.push(group.fetch());
					});
					// Return a promise that will be resolved when each of the groups has finished fetching
  					return Parse.Promise.when(promises);
		        }
	        ).then(
	        	function() {
			        res.locals.basicGroups = basicGroups;
				    var group = new Group();
					var groupQuery = new Parse.Query(Group);
					groupQuery.get(settings.global.groupId);
					groupQuery.include("traits");
					return groupQuery.first();
			    }
	        ).then(	      
	        // TODO: move this to app.locals?
    		    function(globalGroup) {
		            console.log("require-user globalGroup: " + JSON.stringify(globalGroup));
		            res.locals.globalGroup = globalGroup;
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