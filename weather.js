const https= require("https");
var express = require('express');


const url = "https://api.openweathermap.org/data/2.5/weather?q=Djibouti&appid=e835986abd7f4dba2391067cbad3b1cf&units=metric";

 function weatherApp (req, res) {
  
  https.get(url, function(response){
    response.on("data", function(data){
    const weatherData =  JSON.parse(data);
    const weatherDiscription = weatherData.weather[0].description;
    const temp = weatherData.main.temp;
    const feelsLike = weatherData.main.feels_like;
    const icon = weatherData.weather[0].icon;
    const urlimage = "http://openweathermap.org/img/wn/" + icon + "@2x.png";
  
  
    });
  
   });
  
    return weatherApp;


}





module.exports = weatherApp;
