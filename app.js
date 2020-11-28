require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const https= require("https");
var moment = require("moment");
const mongoose = require('mongoose');
const ejs = require("ejs");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const nodemailer = require("nodemailer");
const async = require('async');
const crypto = require('crypto');
const flash= require("express-flash"); 




// const { match } = require('assert');
const cloudinary = require('cloudinary').v2;




const port=3000;
const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));


const date = new Date();

const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };

const bookingDate=date.toLocaleDateString("ar-EG", dateOptions);

var djibLocal =bookingDate;

app.use(session({
  secret: process.env.APP_SECRET,
  resave: false,
  saveUninitialized: false
  
}));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());



mongoose.connect('mongodb://localhost:27017/UserData', {useNewUrlParser: true, useUnifiedTopology: true});

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);


const tripSchema = new mongoose.Schema({
  Trip:String,
  Date:String,
  person:Number
  
});

const  Trip = mongoose.model("Trip",tripSchema);

const userSchema = new mongoose.Schema({
  firstName:String,
  lastName:String,
  password:String,
  email:String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  Adventure:[tripSchema]
          
 });

 let options = {
  errorMessages: {
      MissingPasswordError: 'No password was given',
      AttemptTooSoonError: 'Account is currently locked. Try again later',
      TooManyAttemptsError: 'Account locked due to too many failed login attempts',
      NoSaltValueStoredError: 'Authentication not possible. No salt value stored',
      IncorrectPasswordError: 'Password or username are incorrect',
      IncorrectUsernameError: 'Password or username are incorrect',
      MissingUsernameError: 'No username was given',
      UserExistsError: 'A user with the given username is already registered'
  }
};

userSchema.plugin(passportLocalMongoose,{ usernameField : 'email',  IncorrectUsernameError: 'Password or username are incorrect' });

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());
 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req,res){

  
const url = "https://api.openweathermap.org/data/2.5/weather?q=Djibouti&appid=" + process.env.API_KEY + "&units=metric";
https.get(url, function(response){
  response.on("data", function(data){
  const weatherData =  JSON.parse(data);
  const weatherDiscription = weatherData.weather[0].description;
  const temp = weatherData.main.temp;
  const feelsLike = weatherData.main.feels_like;
  const icon = weatherData.weather[0].icon;
  const urlimage = "http://openweathermap.org/img/wn/" + icon + "@2x.png";

  res.render('home', ({
    message:req.flash("loggedout"),
    success:req.flash("success"),
    user:req.user,
    Temperature:temp,
    WeatherDescription:weatherDiscription,
    weatherIcon: urlimage,
    dateandtime:djibLocal

}));

  });

 });

 
});


app.get("/home", function(req,res){
 
  res.render("home",{user:req.user});
  
});



app.get("/userspage", function(req,res){
 
 
   if (req.isAuthenticated()){
     
    User.findById({_id:req.user._id}, function(err, foundUser){
      if (err){
        console.log(err);
      }else{
      res.render("userspage", {user:foundUser.firstName, id:foundUser._id,  Booking:foundUser,  message:req.flash("message") });
      }
     });
    
    }else{
     res.redirect("/login");
    }
   });
  
  app.post("/userspage", function(req, res){
 
     const trip =  new Trip({
       Trip:req.body.destination,
        Date:req.body.adventureDate,
        person:req.body.poeple
       });   
       trip.save();
     
       
        
     User.findById({_id:req.user._id},  function(err, foundUser){
      
       if(err){
         console.log(err);
       }else{
        foundUser.Adventure.push(trip);
        foundUser.save();
       }
       req.flash('message', 'You have successfully Booked', req.body.destination);
       res.redirect("/userspage");
       });
     });     

  app.get("/Register", function(req,res) {
  
  res.render("Register",{user:req.user, message:req.flash("message")});
   
 });
 
 app.post("/delete", function(req, res){
const id=req.body.toDelete;
const userId=req.user._id;

User.findOneAndUpdate({_id:userId}, {$pull:{Adventure:{_id:id}}},
  {new:true},
  function(err, updateAdventure){
  if (!err){
   
   req.flash("message", "You have Successfully Cancelled your Adventure")
   res.redirect("/userspage")

  }else{
    console.log("not found");
    res.redirect("/userspage")
  }
  
});
   
});
  
app.get("/update/:id", function(req,res){
  const toUpdate= req.params.id;

  console.log(toUpdate);
});
app.post("/update/:id",function(req,res){
  console.log(req.params.id);
});

  
 

 

 
    app.get("/Login", function(req,res) {
     res.render("Login", {user:req.user, error:req.flash("error")});
     
     
   });

 app.get('/logout', function(req, res){
  req.logout();
  req.flash("loggedout", "you have successfully logged out");
  res.redirect("/");
});


app.post("/Register", function (req,res) {
  
  const newUser = new User({
    firstName:req.body.firstName,
    lastName:req.body.lastName,
    email:req.body.email,
    confirm:req.body.confirm
    
  });

  if(req.body.password===req.body.confirm){

    User.register(newUser, req.body.password, function(err, user) {
   
      if (err) { 
        
          res.redirect("/Register");
      }
       
            passport.authenticate("local")(req,res, function(){
             req.flash("message", "Welcome you have successfully registered");
              res.redirect("/userspage");
            });
          
               
      });
    } else {
      req.flash("message", "Passwords dont match!")
      res.redirect("/Register");
     ;
      
     }
    });

app.post("/Login",function (req,res) {

    
  const user  = new User({
     email: req.body.email,
    password: req.body.password
       
  });
   
  User.findOne({email:req.body.email}, function(err, user){
      if(user){
        req.login(user,function(err){
          if(err){
              console.log(err);    
           } 
           passport.authenticate("local")(req,res,function(){
            //  User.findById(req.user._id,function(err,foundUser){
                                               
            res.redirect("/userspage");
                            
            //  });
            }); 
          });
      
      }else{
       req.flash("error", "Incorrect login details");
       res.redirect("/Login");
      }
  });
 
     
});



app.get('/forgot', function(req, res) {
  res.render('forgot', {
    user: req.user,
    error:req.flash("error"),
    info:req.flash("info")
  });
});
app.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport( {
        service: 'Gmail',
        auth: {
          user: 'djibtechnology@gmail.com',
          pass: process.env.EMAIL_PASSW
        }
     
      });
      var mailOptions = {
        to: user.email,
        from: 'djibtechnology@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);

    res.redirect('/forgot');
  });
});

app.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
  
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

app.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }

        user.setPassword (req.body.password, function(err){
          
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;
          
          user.save(function(err) {
            req.logIn(user, function(err) {
              done(err, user);
            });
          });
       
        });
             
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'djibtechnology@gmail.com',
          pass: process.env.EMAIL_PASSW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'djibtechnology@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/');
  });
});
app.listen(port,function(){
  console.log("server is up and running");
});
