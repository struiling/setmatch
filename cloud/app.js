/* Parse + some npm modules */
var express = require('express');
var expressLayouts = require('cloud/lib/express-layouts');
var flashify = require('cloud/lib/flashify');
var parseExpressHttpsRedirect = require('parse-express-https-redirect');
var parseExpressCookieSession = require('parse-express-cookie-session');
var Image = require("parse-image");
var moment = require('moment');
var _ = require('underscore');

/* stuff I wrote */
var requireUser = require('cloud/require-user');
var groupController = require('cloud/controllers/group.js');
var profileController = require('cloud/controllers/profile.js');
var traitController = require('cloud/controllers/trait.js');
var userController = require('cloud/controllers/user.js');


// Required for initializing Express app in Cloud Code.
var app = express();

// Global app configuration section
app.set('views', 'cloud/views');   // Specify the folder to find templates
app.set('view engine', 'ejs');     // Set the template engine
app.use(parseExpressHttpsRedirect());  // Require user to be on HTTPS.
app.use(expressLayouts);

app.use(express.bodyParser());     // Middleware for reading request body
app.use(express.methodOverride()); // Allow HTML forms to do other RESTful calls besides PUT and GET
app.use(express.cookieParser('YOUR_SIGNING_SECRET')); /* TODO: change this */
app.use(express.cookieSession());
app.use(flashify);
app.use(parseExpressCookieSession({ cookie: { maxAge: 36000000 } }));

app.locals._ = _;
app.locals.copyrightDate = function(){
    return moment().format("YYYY");
}

app.use(app.router);				// Explicitly user route handlers, even though Express would add it otherwise

/* if this can be used, it should be converted to a cloud code module. Currently not doing anything */
/*
function checkAuth(req, res, next) {
  Parse.Cloud.run("checkUser", {}, {
		success: function(user) {
			next();
		},
		error: function(error) {
			res.redirect("/");
		}
	});
}
*/


// Routes routes routes
app.get('/', requireUser, function(req, res) {
    var user = Parse.User.current();
    var userGroups;
    var userProfile;
    var userInvites;
    //user.fetch();

    var query = new Parse.Query(Parse.User);
    query.include("groups");
    query.include("profile");
    query.get(user.id);
    query.first().then( function(result) {
        userGroups = result.get("groups");
        userProfile = result.get("profile");
        userInvites = Parse.Cloud.run("getInvites", { invites: user.get("invites") });
        
    }).then( function() {
        console.log("userProfile: "+ JSON.stringify(userProfile));
        res.render("profile", { user: user, groups: userGroups, invites: userInvites, profile: userProfile }); 
    }, function(error) {
        res.redirect("logout");
    });
});

app.get('/login', function(req, res) {
    res.redirect('/');
});
app.post('/login', userController.login);

app.get('/signup', function(req, res) {
    res.redirect('/');
});
app.post('/signup', userController.new);
app.get('/forgot', function(req, res) {
    // view forgot password form
    res.render("forgot");
});
app.get('/delete', requireUser, userController.delete);

// app.get('/fb', userController.fb);
app.post('/reset', userController.reset);

app.get('/logout', userController.logout);

app.get('/profile/edit', requireUser, profileController.edit);
app.get('/profile', requireUser, profileController.view);

app.get('/profile/save', requireUser, profileController.view);
app.post('/profile/save', requireUser, profileController.save);

// view group creation form
app.get('/group/new', requireUser, groupController.new);
// save new group (create)
app.post('/group/create', requireUser, groupController.create);
// save edits to group (is this being used?)
// app.post('/group/save', requireUser, groupController.save);

// view group info
app.get('/group/:urlName', requireUser, groupController.view);
// view group edit form
app.get('/group/:urlName/edit', requireUser, groupController.edit);
// save edits to group info
app.put('/group/:urlName', requireUser, groupController.save);

// invite another user to the group
app.post('/group/:urlName/invite', requireUser, groupController.invite);
// accept invitation to a group
app.get('/group/:urlName/join', requireUser, groupController.join);

// create new group trait (custom field)
app.post('/group/:urlName/trait', requireUser, traitController.create);
// save edits group trait (custom field) definition
app.put('/group/:urlName/trait', requireUser, traitController.save);


// // Example reading from the request query string of an HTTP get request.
// app.get('/test', function(req, res) {
//   // GET http://example.parseapp.com/test?message=hello
//   res.send(req.query.message);
// });

// // Example reading from the request body of an HTTP post request.
// app.post('/test', function(req, res) {
//   // POST http://example.parseapp.com/test (with request body "message=hello")
//   res.send(req.body.message);
// });

// Attach the Express app to Cloud Code.
app.listen();
