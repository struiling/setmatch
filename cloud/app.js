var express = require('express');
var expressLayouts = require('cloud/express-layouts');
var moment = require('moment');
var _ = require('underscore');

var userController = require('cloud/controllers/user.js');


// Required for initializing Express app in Cloud Code.
var app = express();

// Global app configuration section
app.set('views', 'cloud/views');   // Specify the folder to find templates
app.set('view engine', 'ejs');     // Set the template engine
app.use(expressLayouts);
app.use(express.bodyParser());     // Middleware for reading request body
app.use(express.methodOverride()); // Allow HTML forms to do other RESTful calls besides PUT and GET
app.use(app.router);				// Explicitly user route handlers, even though Express would add it otherwise

// Routes routes routes
app.get('/', function(req, res) {
  res.render('match/index', { message: 'Congrats, you just set up your app!' });
});

app.post('/create', userController.new);


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
