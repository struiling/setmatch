/* stuff provided by Parse */
var express = require('express');
var expressLayouts = require('cloud/lib/express-layouts');
var parseExpressHttpsRedirect = require('parse-express-https-redirect');
var parseExpressCookieSession = require('parse-express-cookie-session');
var moment = require('moment');
var _ = require('underscore');

/* stuff I wrote */
var userController = require('cloud/controllers/user.js');
var profileController = require('cloud/controllers/profile.js');


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
app.use(parseExpressCookieSession({ cookie: { maxAge: 36000000 } }));

app.use(app.router);				// Explicitly user route handlers, even though Express would add it otherwise

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


// Routes routes routes
app.get('/', function(req, res) {
	if (Parse.User.current()) {		
	    res.render('match/index', { message: "Think you're logged in." });
	} else {
		res.render('index', { message: "Perhaps you'd like to sign up." });
	}
});

app.get('/login', function(req, res) {
  res.redirect('/');
});
app.post('/login', userController.login);
app.get('/signup', function(req, res) {
  res.redirect('/');
});
app.post('/signup', userController.new);

app.get('/logout', userController.logout);
/*app.get('/welcome', userController.welcome);*/

app.get('/profile/edit', profileController.edit);
app.post('/profile/edit', profileController.edit);

app.get('/profile', profileController.view);
app.get('/profile/save', profileController.view);
app.post('/profile/save', profileController.save);


app.get('/welcome', function(req, res) {
    // Display the user profile if user is logged in.
    if (Parse.User.current()) {
        // We need to fetch because we need to show fields on the user object.
        Parse.User.current().fetch().then(function(user) {
        // Render the user profile information (e.g. email, phone, etc).
		res.render('profile', { message: user.get("username") });
        // to try 
        //user.get("username")
        },
        function(error) {
            // Render error page.
        });
    } else {
        // User not logged in, redirect to login form.
        res.redirect('/');
    }
});

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
