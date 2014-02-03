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
var traitsAPI = require('cloud/api/v1/traits.js');
var groupController = require('cloud/controllers/group.js');
var matchController = require('cloud/controllers/match.js');
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
// number in millseconds
app.use(parseExpressCookieSession({ cookie: { maxAge: 86400000 } }));

// Globals
app.locals._ = _;
app.locals.settings = require('cloud/settings');
app.locals.copyrightDate = function(){
    return moment().format("YYYY");
}

app.use(app.router);				// Explicitly user route handlers, even though Express would add it otherwise

/*app.use(function(req, res, next) {
res.locals.session = req.session;
next();
});
*/

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
// TODO: change this to redirect to /profile/:slug for current user's slug?
app.get('/profile', requireUser, function(req, res) {
   res.redirect('/profile/' + res.locals.basicUser.get("slug"));
});
app.get('/profile/:userSlug', requireUser, profileController.view);

// TODO: change to app.put('/profile') and change in profile-edit.ejs
app.post('/profile/save', requireUser, profileController.save);

// view group creation form
app.get('/group/new', requireUser, groupController.new);
// save new group (create)
app.post('/group/create', requireUser, groupController.create);
// save edits to group (is this being used?)
// app.post('/group/save', requireUser, groupController.save);

// view group info
app.get('/group/:groupSlug', requireUser, groupController.view);
// view group edit form
app.get('/group/:groupSlug/edit', requireUser, groupController.edit);
// save edits to group info

app.put('/group/:groupSlug', requireUser, groupController.save);
app.get('/group/:groupSlug/delete', requireUser, groupController.delete);
app.get('/group/:groupSlug/leave', requireUser, groupController.leave);

// invite another user to the group
app.post('/group/:groupSlug/invite', requireUser, groupController.invite);
// accept invitation to a group
app.get('/group/:groupSlug/join', requireUser, groupController.join);

// create new group trait (custom field)
app.post('/trait/create', requireUser, traitController.create);
// TODO: NOT SET UP YET
// save edits group trait (custom field) definition
app.put('/trait/:traitId', requireUser, traitController.save);
// TODO: NOT SET UP YET
app.get('/trait/:traitId/delete', requireUser, traitController.delete);

// view the landscape of values for a trait
app.get('/match/:traitId', requireUser, traitController.match);

//app.get('/match/group/:groupSlug', requireUser, groupController.match);

// traits passed in in the GET, e.g. ?KkuUBNivsq=Sarah
app.get('/match', requireUser, profileController.match);

// API OMG
app.get('/api/v1/traits/:traitId', requireUser, traitsAPI.match);

// TODO: change with below 404 function to keep the URL that's 404ing
app.get('/404', requireUser, function(req, res) {
   res.render('404');
});

app.use(function(req, res) {
    //console.log("status1: " + res.status);
    //res.status(404);
    //console.log("status2: " + res.status);
    // TODO: convert requireUser to something involving req.session
    if (req.accepts('html')) {
        console.log("accepts html");
        if (Parse.User.current()) {
            // TODO: this doesn't keep the URL
            res.redirect("/404");
        } else {
            res.render('404', { url: req.url });
            
        }

        return;
    }

    if (req.accepts('json')) {
        res.send({ title: '404: Page not found', error: '404: Page not found', url: req.url });
    }
});

/* other error cases
app.use( function(err, req, res, next) {
    // curl https://localhost:4000/error/403 -vk
    // curl https://localhost:4000/error/403 -vkH "Accept: application/json"
    var statusCode = err.status || 500;
    var statusText = '';
    var errorDetail = (process.env.NODE_ENV === 'production') ? 'Sorry about this error' : err.stack;

    switch (statusCode) {
    case 400:
      statusText = 'Bad Request';
      break;
    case 401:
      statusText = 'Unauthorized';
      break;
    case 403:
      statusText = 'Forbidden';
      break;
    case 500:
      statusText = 'Internal Server Error';
      break;
    }

    res.status(statusCode);

    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
      console.log(errorDetail);
    }

    if (req.accepts('html')) {
      res.render('error/500', { title: statusCode + ': ' + statusText, error: errorDetail, url: req.url });
      return;
    }

    if (req.accepts('json')) {
      res.send({ title: statusCode + ': ' + statusText, error: errorDetail, url: req.url });
    }
  });
*/

// Attach the Express app to Cloud Code.
app.listen();
