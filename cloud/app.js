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

// Globals in EJS templates
app.locals._ = _;
app.locals.copyrightDate = function(){
    return moment().format("YYYY");
}
app.locals.settings = require('cloud/settings');

app.use(app.router);				// Explicitly user route handlers, even though Express would add it otherwise

// Routes routes routes
app.get('/', requireUser, profileController.view);

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
app.get('/group/:slug', requireUser, groupController.view);
// view group edit form
app.get('/group/:slug/edit', requireUser, groupController.edit);
// save edits to group info

app.put('/group/:slug', requireUser, groupController.save);
app.get('/group/:slug/delete', requireUser, groupController.delete);
app.get('/group/:slug/leave', requireUser, groupController.leave);

// invite another user to the group
app.post('/group/:slug/invite', requireUser, groupController.invite);
// accept invitation to a group
app.get('/group/:slug/join', requireUser, groupController.join);

// create new group trait (custom field)
app.post('/group/:slug/trait', requireUser, traitController.create);
// save edits group trait (custom field) definition
app.put('/group/:slug/trait', requireUser, traitController.save);

app.get('/trait/:traitId/delete', requireUser, traitController.save);


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
