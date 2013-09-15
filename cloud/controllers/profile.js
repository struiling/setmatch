exports.edit = function(req, res) {
	
	Parse.Cloud.run("checkUser", {}, {
		success: function(user) {
			res.render("profile-edit", { user: user });
		},
		error: function(error) {
			res.redirect("/logout");
		}
	});

};

exports.save = function(req, res) {

	Parse.Cloud.run("checkUser", {}, {
		success: function(user) {

			user.set("fname", req.body.fname); 
			user.set("lname", req.body.lname);
			user.save();

			res.redirect("profile/edit");
		},
		error: function(error) {
			res.redirect("/logout");
		}
	});

};

exports.view = function(req, res) {

	Parse.Cloud.run("checkUser", {}, {
		success: function(user) {
			res.render("profile", { user: user });			
		},
		error: function(error) {
			// res.redirect("/logout");
		}
	});

};