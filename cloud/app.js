var express = require('express');
var expressLayouts = require('cloud/lib/express-layouts');
var parseExpressHttpsRedirect = require('parse-express-https-redirect');
var parseExpressCookieSession = require('parse-express-cookie-session');
var moment = require('moment');
var _ = require('underscore');

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
app.use(express.cookieParser('YOUR_SIGNING_SECRET'));
app.use(parseExpressCookieSession({ cookie: { maxAge: 3600000 } }));

app.use(app.router);				// Explicitly user route handlers, even though Express would add it otherwise

// Routes routes routes
app.get('/', function(req, res) {
  res.render('match/index', { message: 'Congrats, you just set up your app!' });
});

app.get('/login', function(req, res) {
  res.render('match/index', { message: "You're not logged in!" });
});
app.get('/logout', userController.logout);
app.get('/welcome', userController.welcome);

app.post('/create', userController.new);
app.post('/login', userController.login);


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
