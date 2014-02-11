// Use this middleware to require that a user is logged in as an admin?

module.exports = function(req, res, next) {
var queryRole = new Parse.Query(Parse.Role);
queryRole.equalTo('name', 'Administrator');
queryRole.first({
    success: function(result) { // Role Object
        var role = result;
        var adminRelation = new Parse.Relation(role, 'users');
        var queryAdmins = adminRelation.query();
        queryAdmins.equalTo('objectId', Parse.User.current().id);
        queryAdmins.first({
            success: function(result) {    // User Object
                var user = result;
                user ? console.log('USER : ', user) : console.log('User not Administrator!');
            }
        });
    },
    error: function(error) {}
});
	
	req.params.slug
	var queryRole = new Parse.Query(Parse.Role);
	queryRole.equalTo("name", groupId + "_admin");
	queryRole.first({
	    success: function(role) { // Role Object
	    	console.log("role: " + JSON.stringify(role));
	    	console.log("groupId: " + groupId);
	    	if (role != null) {
	    		// check if current user is an admin
	    		var adminRelation = new Parse.Relation(role, 'users');
		        var queryAdmins = adminRelation.query();
		        queryAdmins.equalTo('objectId', Parse.User.current().id);
		        queryAdmins.first({
		            success: function(result) {    // User Object
		                var user = result;
		                user ? console.log('USER : ' + JSON.stringify(user)) : console.log('User not Administrator!');
		                if (group != null) {
							res.render('group-edit', {
						    	group: group
							});
						} else {
							res.flash("message", "You don't have permission to see this page.");
							res.redirect("/");	
						}
				    	
		            }
		        });
	    	} else {
	    		console.log("No role found");
	    	}
	        
	    },
	    error: function(error) {
	    	res.redirect(back);
	    }
	});
    }).then(function() {
		next();
    },
    function(error) {
    	// Render error page.
    	res.render('index', { message: "You don't have access to that page." });
    });

}