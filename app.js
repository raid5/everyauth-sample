var HTTPServer = require('http');
var Express = require('express');
var Everyauth = require('everyauth');
var Path = require('path');
var Util = require('util');
var _= require('underscore');

var app = Express.createServer();
app.use(Express.logger());
app.use(Express.bodyParser());

app.use(Express.errorHandler({ dumpExceptions: true, showStack: true }));
app.use(Express.cookieParser());
app.use(Express.session({secret: 'a1b2c3d4e5f60000000000000'}));

//--- Service
// Setup view rendering
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(Express.static(__dirname + '/public'));

// everyauth setup

Everyauth.everymodule
  .findUserById( function (userId, callback) {
    console.log('Z Z Z');
    console.log('findUserById - userId: ' + userId);
    console.log('Z Z Z');
  
    callback(null, { userId: userId });
  });

// username/password
Everyauth
  .password
    .loginWith('login')
    .getLoginPath('/login')
    .postLoginPath('/login')
    .loginView('login.jade')
    .authenticate( function (login, password) {
      // Sync checks
      var errors = [];
      if (!login) errors.push('Missing login');
      if (!password) errors.push('Missing password');
      if (errors.length) return errors;
      
      var promise = this.Promise();
      
      setTimeout( function () {
        promise.fulfill({ id: 3, login: login, password: password });
      }, 2000);
      
      return promise;
    })
    .loginSuccessRedirect('/hello')

    .getRegisterPath('/register')
    .postRegisterPath('/register')
    .registerView('register.jade')
    .extractExtraRegistrationParams( function (req) {
      return {
        'password_confirmation': req.body.password_confirmation
      };
    })
    .registerUser( function (newUserAttrs) {
      var login = newUserAttrs[this.loginKey()];
      var password = newUserAttrs.password;
      
      // remove confirmation
      delete newUserAttrs.password_confirmation;
      
      // hash password and store
      var shasum = crypto.createHash('sha1');
      shasum.update(password + login);
      newUserAttrs.password = shasum.digest('hex');
      
      var promise = this.Promise();
      
      setTimeout( function () {
        promise.fulfill({ id: 3, login: newUserAttrs.login, password: newUserAttrs.password });
      }, 2000);
      
      return promise;
    })
    .registerSuccessRedirect('/hello');
    
// logout
Everyauth.everymodule.logoutRedirectPath('/hello');

// everyauth middleware and view helpers
app.use(Everyauth.middleware());
Everyauth.helpExpress(app);
//--- Service

app.get('/',function (request,response){
	response.send("<p>Server</p>\n");
});

app.get('/hello', function(req, res) {
  console.log('get /hello, req.user: ' + Util.inspect(req.user));
  res.render('index', { title: 'Hello' });
});

app.listen(8080, '127.0.0.1');
console.log(" Server listening on http://127.0.0.1:8080/");
