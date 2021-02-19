const express = require('express');
const router = express.Router();
const multer  = require('multer');
const {storage} = require('../cloudinary');
const upload = multer({ storage} );
const https= require("https");
const passport = require('passport');
const nodemailer = require("nodemailer");
const async = require('async');
const crypto = require('crypto');
const flash= require("express-flash"); 
const 	{asyncErrorHandler} = require('../middleware/index');
const {User, Trip, Post} =require('../models/user');


const {homeRoute,
      getPosts,
     getRouteBlogPost ,
      postRoutBlogPost,
       bookingRoute, 
      bookingUpdate,
       cancelBookingRoute,
       usersRoute,
       registerRoute,
       postRegisterRoute,
       deleteMyimages,
       updatePost,
       changeApost,
       editPost,
       postDelete,
       getProfile,
       updateProfile,
       myBlogs,
       getDashboard,
       getMoucha,
       
      
     
      
    } = require('../controllers/index');

    const {
      
      isLoggedIn,
      isValidPassword,
      changePassword
    } = require('../middleware');




const date = new Date();

const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };

const bookingDate=date.toLocaleDateString("ar-EG", dateOptions);

var djibLocal =bookingDate;
const fullYear= date.getFullYear();



router.get("/", function(req,res){

res.redirect('/home');
  
   
  });

  router.get('/home', homeRoute );

router.get('/profile', getProfile);
router.post('/updateProfile',
 isLoggedIn,
 upload.single("image"),
 asyncErrorHandler(isValidPassword),
 asyncErrorHandler(changePassword),
 asyncErrorHandler(updateProfile)
 );

 router.get('/dashboard', getDashboard );
router.get("/userspage", usersRoute);
   
   router.post("/userspage", bookingRoute );     
 
   router.get("/Register", registerRoute);
  
   //cancel booking
  router.post("/delete", cancelBookingRoute);
   
  // show all myblogs
  router.get('/show', function(req,res){
    res.render('show', {AdventurePlace:foundAdventure.Adventure, user:req.user, fullYear:fullYear});
  });
//////////////////// BOOKING AND ADVENTURES ///////////////////////////////////////////////////

  //Adventure get-Update 
 router.get("/Moucha",  getMoucha);
 
//Adventure Post-Update

//Booking Update GET-route
router.get("/update/:id/show", bookingUpdate);

// update booking POST-route
 router.post("/update/:id", async(req,res)=>{

 const id=req.params._id;
const userId=req.user._id;
  const trip =  new Trip({
    Trip:req.body.destination,
     Date:req.body.adventureDate,
     person:req.body.poeple
    });   
    trip.save();
      

  let foundUser = await User.findByIdAndUpdate({_id:userId, "Adventure._id":id},  { $set: { "Adventure.$[]": trip } }, () => {
    
     
       req.flash('message', 'You have successfully Updated', req.body.destination);
       res.redirect("/userspage");
     
    
    });
 
 });

//posts routs
// user blogs and forms to blog
router.get('/myblogs', myBlogs);
//  router.get('/showposts', asyncErrorHandler( getPosts));
 router.get('/getBlogForm', 	asyncErrorHandler( getRouteBlogPost) );
 router.post('/submitBlog', upload.array('images', 4), 	asyncErrorHandler (postRoutBlogPost) );

 //Delete Images
router.get('/deleteImages/:id', asyncErrorHandler(deleteMyimages));
 

// Delet/Update Post Get-Route
router.get("/postUpdate/:id/update", asyncErrorHandler(updatePost));

// changePost
router.post("/changePost/:id", asyncErrorHandler(changeApost));
// edit post
router.post("/editPost/:id",  asyncErrorHandler(editPost));

// Delete POST Post-Route
router.post('/deletPost/:id', asyncErrorHandler(postDelete));


 
  // Login Get-Route
     router.get("/Login", function(req,res) {
      res.render("Login", {user:req.user, error:req.flash("error"), fullYear});
      
      
    });
 
    // Logout Get-Route
  router.get('/logout', function(req, res){
   req.logout();
   req.flash("loggedout", "you have successfully logged out");
   res.redirect("/");
 });
 

 router.post('/login',
  passport.authenticate('local',  {successFlash: 'Welcome!' , successRedirect: '/dashboard' ,
                                   failureRedirect: '/login',
                                   failureFlash: true })
                                  
);
 
 //forgot Get-Route
 router.get('/forgot', function(req, res) {
  res.render('forgot', {
    user: req.user,
    error:req.flash("error"),
    info:req.flash("info")
  });
});

//forgot Post-Route
router.post('/forgot', function(req, res, next) {
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

//Reset Get-Route
router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
  
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {user:req.user,  token: req.params.token});
  });
});

// Reset Post-Route
router.post('/reset/:token', function(req, res) {
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
 
 
 

 module.exports = router;