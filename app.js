//jshint esversion:6
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
  name: String,
  password:String,
  username:String,
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
  res.render("home", {user:req.user});
  
});


app.get("/userspage", function(req,res){

   if (req.isAuthenticated()){
     
    User.findById(req.user._id, function(err, foundUser){
      if (err){
        console.log(err);
      }else{
        // console.log(foundUser.Adventure);
      
      res.render("userspage", {user:req.user,  Booking:foundUser});
      
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
       res.redirect("/userspage");
     });
            
    
    });     
      
     
 
 app.get("/Register", function(req,res) {
  
 
     res.render("Register", {user:req.user});
     
 });
 
 app.get("/Login", function(req,res) {
     res.render("Login",{user:req.user});
     
  });

 app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.post("/Register", function (req,res) {
  
  User.register({username: req.body.username}, req.body.password, function(err, user) {
   
    if (err) { 
      console.log(err);
      res.redirect("/Register");
     
    }else {
      const user = new User({
        username: req.body.username,
        password: req.body.password,
        name:req.body.name
      });
         
    
         
      passport.authenticate("local")(req,res, function(){
        res.redirect("/userspage");
      });
      
    }  
    
});

 
});

app.post("/Login",function (req,res) {
  
  const user  = new User({
    username: req.body.username,
    password: req.body.password,
    name:req.body.name
    
  });
   
  req.login(user,function(err){
     if(err){
      console.log(err);
    }else{
       passport.authenticate("local")(req,res,function(){
       res.redirect("/userspage");
      });
    }
  });
  
});

app.listen(port,function(){
  console.log("server is up and running");
});
