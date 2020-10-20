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
const userSchema = new mongoose.Schema({
  email: String,
  password:String,
  name:String
  
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

    Temperature:temp,
    WeatherDescription:weatherDiscription,
    weatherIcon: urlimage,
    dateandtime:djibLocal
}));

  });

 });

 
});

app.get("/home", function(req,res){
  res.render("home");
});

app.get("/userspage", function(req,res){
const name=req.user.name;
 if (req.isAuthenticated()){
   res.render("userspage", ({Greetings:name}));
  
  
 }else{
    res.redirect("/login");
  }
 });

app.get("/Register", function(req,res) {
 

    res.render("Register");
    
});

app.get("/Login", function(req,res) {
 
  res.render("Login");

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

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});



app.listen(port,function(){
  console.log("server is up and running");
});
