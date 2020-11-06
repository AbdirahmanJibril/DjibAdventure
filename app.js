
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



const port=3000;
const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));


moment.locale("fr");
var djibLocal = moment().format("LL");

app.use(session({
  secret: 'myDjibHolidaySite',
  resave: false,
  saveUninitialized: false
  
}));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect('mongodb://localhost:27017/UserData', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true)

const tripSchema = new mongoose.Schema({
  Trip:String,
  Date:Date,
  person:Number
  
});

const  Trip = mongoose.model("Trip",tripSchema);

const userSchema = new mongoose.Schema({
  firstName:String,
  lastName:String,
  username:String,
  password:String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  Adventure:[tripSchema]
          
 });

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());
 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req,res){

 
const url = "https://api.openweathermap.org/data/2.5/weather?q=Djibouti&appid=e835986abd7f4dba2391067cbad3b1cf&units=metric";
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

// app.get('/', function(req, res){
//   res.render('index', { message: req.flash('info') });
// });

// app.get('/flash', function(req, res){
//   req.flash('info', 'Hi there!')
//   res.redirect('/');
// });

app.get("/userspage", function(req,res){
  
   if (req.isAuthenticated()){
     
    User.findById(req.user._id, function(err, foundUser){
      if (err){
        console.log(err);
      }else{
      
      
      res.render("userspage", {user:foundUser.firstName,  Booking:foundUser, message:req.flash("info") });
     
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
     
     User.findById(req.user._id,  function(err, foundUser){
       if(err){
         console.log(err);
       }else{
        foundUser.Adventure.push(trip);
        foundUser.save();
       }
       
       req.flash('info', 'You have successfully Booked!');
       res.redirect("/userspage");
     });
            
    
    });     

 app.get("/Register", function(req,res) {
  

 
     res.render("Register",{user:req.user, message:req.flash("error")});
     
 });
 
 app.get("/Login", function(req,res) {
     res.render("Login", {user:req.user});
     
  });

 app.get('/logout', function(req, res){
  req.logout();
  req.flash("loggedout", "you have successfully logged out");
  res.redirect("/");
});

// app.get('/forgot', function(req, res) {
//   res.render('forgot', {
//     user: req.user
//   });
// });


// app.post('/forgot', function(req, res, next) {
//   async.waterfall([
//     function(done) {
//       crypto.randomBytes(20, function(err, buf) {
//         var token = buf.toString('hex');
//         done(err, token);
//       });
//     },
//     function(token, done) {
//       User.findOne({ email: req.body.email }, function(err, user) {
//         if (!user) {
//           req.flash('error', 'No account with that email address exists.');
//           return res.redirect('/forgot');
//         }

//         user.resetPasswordToken = token;
//         user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

//         user.save(function(err) {
//           done(err, token, user);
//         });
//       });
//     },
//     function(token, user, done) {
//       var smtpTransport = nodemailer.createTransport('SMTP', {
//         service: 'SendGrid',
//         auth: {
//           user: '!!! YOUR SENDGRID USERNAME !!!',
//           pass: '!!! YOUR SENDGRID PASSWORD !!!'
//         }
//       });
//       var mailOptions = {
//         to: user.email,
//         from: 'passwordreset@demo.com',
//         subject: 'Node.js Password Reset',
//         text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
//           'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
//           'http://' + req.headers.host + '/reset/' + token + '\n\n' +
//           'If you did not request this, please ignore this email and your password will remain unchanged.\n'
//       };
//       smtpTransport.sendMail(mailOptions, function(err) {
//         req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
//         done(err, 'done');
//       });
//     }
//   ], function(err) {
//     if (err) return next(err);
//     res.redirect('/forgot');
//   });
// });

app.post("/Register", function (req,res) {
  
  const newUser = new User({
    firstName:req.body.firstName,
    lastName:req.body.lastName,
    username: req.body.username,
    confirmpassowrd:req.body.confirmpassword
    
  });

  User.register(newUser, req.body.password, function(err, user) {
   
    if (err) { 
      console.log(err);
     
      res.redirect("/Register");
   
    }else{
      
        if(req.body.password===req.body.confirmpassword) {
          passport.authenticate("local")(req,res, function(){
           req.flash("message", "Welcome you have successfully registered");
            res.redirect("/userspage");
          });
        
         }else{
         
          req.flash("error", "Passwords dont match!");
          res.redirect("/Register");
         }
        }
       
      });
   });

app.post("/Login",function (req,res) {
  
  const user  = new User({
    
    username: req.body.username,
    password: req.body.password
    
    
  });
   
  req.login(user,function(err){
     if(err){
      console.log(err);
    }else{
       passport.authenticate("local")(req,res,function(){
        User.findById(req.user._id,function(err,foundUser){
          
          res.redirect("/userspage");
        });
      
      });
    }
  });
  
});

app.listen(port,function(){
  console.log("server is up and running");
});
