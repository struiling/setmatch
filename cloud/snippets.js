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
