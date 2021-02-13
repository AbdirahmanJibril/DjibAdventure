const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const passport = require('passport');
const findOrCreate = require('mongoose-findorcreate');


const Schema = mongoose.Schema;


const PostSchema = new Schema({
	title: String,
	place: String,
	description: String,
	images: [ {path:String, filename:String} ],
	location: String,
	lat: Number,
  lng: Number,

	author: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	},
	reviews: [
		{
			type: Schema.Types.ObjectId,
			ref: 'Review'
		}
	]
});

const  Post = mongoose.model("Post",PostSchema);

const tripSchema = new mongoose.Schema({
  Trip:String,
  Date:String,
  person:Number
  
});

const  Trip = mongoose.model("Trip",tripSchema);

const userSchema = new mongoose.Schema({
     email:{type:String, unique:true, required:true},
     firstName: {type: String, required:true },
    lastName:{type:String, required:true},
    password:String,
    image:{
     path:{type:String, default:"/images/profilepic.png"},
      filename:String
    },
    googleId:String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    Adventure:[tripSchema],
    Post:[PostSchema]
            
   });
   
  
 
   
  userSchema.plugin(passportLocalMongoose, {usernameField:'email'});
  userSchema.plugin(findOrCreate);
 const User =  mongoose.model('User', userSchema);

  module.exports = {
    User, Trip,Post
  }