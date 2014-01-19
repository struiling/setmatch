/* Relations */

var relation = user.relation("groups");
relation.add(group);
user.save();

/* Relations query */
var relation = user.relation("groups");
relation.query().find().then( function(results) {
	console.log("group relation: " + JSON.stringify(results));
	userGroups = results;

	if (user.get("invites")) {

		userInvites = Parse.Cloud.run("getInvites", { invites: user.get("invites") });
	}
	return userInvites;
});


/* Query for traits that have a pointer to a Group, in the "group" column */
var traitQuery = new Parse.Query("Trait");
traitQuery.include("group");
traitQuery.equalTo("group", group);
return traitQuery.find();


/* Check if requested by AJAX */
if ( req.headers["HTTP_X_REQUESTED_WITH"] === "XMLHttpRequest" ) {
  res.send(document);
} else {
  res.render(...);
}


/* Promises with saveAll() */
var promise = new Parse.Promise();
Parse.Object.saveAll(modifiedInvitationObjects, function (list, error) {
    if (list) {
        promise.resolve(list);
    } else {
        promise.reject(error);
    }
});

return promise;

/* for afterSave. check if object was newly created. Essentially afterCreate */

if (request.object.existed()) { 
    // it existed before 
} else { 
    // it is new 
}

/* shorthand for exporting out of a js file, like require-user.js or settings.js */
/* in module file */
exports.my_password = 'value'
/* in app.js or other */
settings.my_password // 'value'


/* chained/nested promises */
object.save().then(function (savedObject) {

	return someOtherObject.save().then(
		function (someOtherSavedObject) {
    		// do stuff
		}
	).then(
		function () {
	    	// do more stuff ?
		}
	);
}).then(function () { 
	// this here will not execute until the returned promise from the previous then completes including all its chained "then"s 
});

/* send json response (for API?) */
res.json({ msgId: msg.fileName })

/* loop through all traits when not specifying trait name */
<% _.each(_.keys(profile.attributes), function(key) { %>
	<% if (key == "gravatar") { %>
		<img src="<%= profile.get(key) %>?s=100&r=pg&d=identicon" />
	<% return;
	} %>

<%= key %>: <%= profile.get(key) %><br />

<% }) %>
