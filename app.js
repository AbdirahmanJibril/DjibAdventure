//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const https= require("https");
var moment = require("moment");
const mongoose = require('mongoose');
const encrypt = require("mongoose-encryption");
const ejs = require("ejs");


const port=3000;
const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect('mongodb://localhost:27017/UserData', {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
  email: String,
  password:String
});


userSchema.plugin(encrypt, { secret: process.env.SECRET,  encryptedFields: ['password'] });
const User = mongoose.model('User', userSchema);

moment.locale("fr");

var djibLocal = moment().format("LL");

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

app.get("/Register", function(req,res) {
    res.render("Register");
    
});

app.get("/Login", function(req,res) {
  res.render("Login");
});


app.post("/Register", function (req,res) {
  
  const newUser= new User({
    email:req.body.uname,
    password:req.body.psw
  });
  newUser.save(function(err){
    if(err){
      console.log(err);
    }else{
      res.render("Login");
    }
  });
});

app.post("/Login",function (req,res) {
  const username=req.body.uname;
  const password=req.body.psw;

  User.findOne({email:username}, function(err,foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        if (foundUser.password===password){
          res.render("Members");
        }
      }
    }
  });
});




app.listen(port,function(){
  console.log("server is up and running");

});
