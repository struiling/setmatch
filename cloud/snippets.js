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
