exports.edit = function(req, res) {
	
	Parse.User.current().fetch().then(function(user) {
        res.render("profile-edit", { user: user });
    },
    function(error) {
    	// Render error page.
    	console.log("Problem retrieving user information");
    });
	
};

exports.save = function(req, res) {

	Parse.Cloud.run("checkUser", {}, {
		success: function(user) {
			for (var key in req.body) {
				user.set(key, req.body[key]);
			}
			user.set("username", req.body.email);
			user.save();

			res.redirect("profile/edit");
		},
		error: function(error) {
			res.redirect("/logout");
		}
	});

};

exports.view = function(req, res) {

	Parse.User.current().fetch().then(function(user) {
    	res.render("profile", { user: user });			
    },
    function(error) {
    	// Render error page.
    	console.log("Problem retrieving user information");
    });

};