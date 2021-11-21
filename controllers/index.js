const express = require('express')

const { User, Trip, Post } = require('../models/user')
const { cloudinary } = require('../cloudinary')
const passport = require('passport')
const https = require('https')
const ejs = require('ejs')
const util = require('util')
const { deleteProfileImage } = require('../middleware')
const { title } = require('process')

let date = new Date()

let dateOptions = { year: 'numeric', month: 'short', day: 'numeric' }

let bookingDate = date.toLocaleDateString('en-GB', dateOptions)

let djibLocal = bookingDate
let fullYear = date.getFullYear()

const homeRoute = (req, res) => {
  const url =
    'https://api.openweathermap.org/data/2.5/weather?q=Djibouti&appid=' +
    process.env.API_KEY +
    '&units=metric'
  https.get(url, function (response) {
    response.on('data', function (data) {
      const weatherData = JSON.parse(data)
      const weatherDiscription = weatherData.weather[0].description
      const temp = weatherData.main.temp
      const feelsLike = weatherData.main.feels_like
      const icon = weatherData.weather[0].icon
      const urlimage = 'http://openweathermap.org/img/wn/' + icon + '@2x.png'

      res.render('home', {
        message: req.flash('loggedout'),
        success: req.flash('success'),
        user: req.user,
        Temperature: temp,
        WeatherDescription: weatherDiscription,
        weatherIcon: urlimage,
        dateandtime: djibLocal,
        fullYear: fullYear,
      })
    })
  })
}

const getProfile = async (req, res) => {
  if (req.isAuthenticated()) {
    let user = await User.findById({ _id: req.user._id })

    res.render('profile', {
      image: user.image,
      user: user,
      fullYear,
      error: req.flash('error'),
      success: req.flash('success'),
    })
  } else {
    res.redirect('/login')
  }
}

const updateProfile = async (req, res, next) => {
  const { email, firstName, lastName, image } = req.body

  // any detail  update  if requested
  const { user } = res.locals

  if (email) user.email = email
  if (firstName) user.firstName = firstName
  if (lastName) user.lastName = lastName
  //image update if needed
  if (req.file) {
    if (user.image.filename)
      await cloudinary.uploader.destroy(user.image.filename)
    const { path, filename } = req.file
    user.image = { path, filename }
  }
  await user.save()
  const login = util.promisify(req.login.bind(req))
  await login(user)
  req.flash('success', 'You have update your profile')

  // req.session.success = 'Profile successfully updated!';
  res.redirect('/profile')
}

//-----------------------------------Blogs---------------------------------------------------

// Show a Post
const showApost = async (req, res) => {
  const id = req.params.id
  let Post = await User.find({ Post: { $elemMatch: { _id: id } } })
  Post.forEach(foundPost => {
    res.render('showApost', {
      foundPost: foundPost.Post,
      image: foundPost.image,
      user: req.user,
      fullYear: fullYear,
    })
  })
}

//show all blogs

const getPosts = async (req, res) => {
  const myCustomLabels = {
    nextPage: 'next',
    prevPage: 'prev',
  }
  const options = {
    page: req.query.page || 1,
    limit: 3,
    customLabels: myCustomLabels,
    sort: { 'Post._id': -1 },
  }

  let posts = await User.aggregate([
    { $project: { Post: 1 } },
    { $sort: { 'Post._id': -1 } },
  ])
  User.aggregatePaginate(posts, options)

    .then(function (results) {
      res.render('showBlogs', {
        showPosts: results,
        user: req.user,
        fullYear,
      })
    })
    .catch(function (err) {
      console.log(err)
    })
}

//usere create blogpage
const getRouteBlogPost = (req, res) => {
  if (req.isAuthenticated()) {
    res.render('blogForm')
  } else {
    res.redirect('/login')
  }
}

//blog post submit route
const postRoutBlogPost = async (req, res) => {
  req.body.images = []
  for (const file of req.files) {
    req.body.images.push({
      path: file.path,
      filename: file.filename,
    })
  }
  const post = new Post({
    title: req.body.title,
    place: req.body.place,
    description: req.body.description,
    images: req.body.images,
  })
  post.save()

  await User.findById(req.user._id, function (err, foundUser) {
    if (err) {
      console.log(err)
    } else {
      foundUser.Post.push(post)
      foundUser.save(function () {
        //  req.flash('message', 'You have successfully posted your blog');

        res.redirect('/myblogs')
      })
    }
  })
}
//---------------------------Adventures & Booking Routes----------------------------

const getMoucha = (req, res) => {
  res.render('Moucha', { user: req.user, fullYear })
}

const getAmbado = (req, res) => {
  res.render('Ambado', { user: req.user, fullYear })
}
// booking route
const bookingRoute = (req, res) => {
  const trip = new Trip({
    Trip: req.body.destination,
    Date: req.body.adventureDate,
    person: req.body.poeple,
  })
  trip.save()

  User.findById(req.user._id, function (err, foundUser) {
    if (err) {
      console.log(err)
    } else {
      foundUser.Adventure.push(trip)
      foundUser.save(function () {
        req.flash(
          'message',
          'You have successfully Booked',
          req.body.destination
        )
        res.redirect('/userspage')
      })
    }
  })
}

// cancel booking route
const cancelBookingRoute = async (req, res) => {
  const id = req.body.toDelete
  const userId = req.user._id

  await User.findOneAndUpdate(
    { _id: userId },
    { $pull: { Adventure: { _id: id } } },
    { new: true }
  )

  req.flash('message', 'You have Successfully Cancelled your Adventure')
  res.redirect('/userspage')
}

//updte booking  Get-Route

const bookingUpdate = async (req, res) => {
  userId = req.user._id
  const id = req.params.id

  let foundAdventure = await User.findById(
    { _id: userId },
    { Adventure: { $elemMatch: { _id: id } } }
  )

  res.render('show', {
    AdventurePlace: foundAdventure.Adventure,
    foundImages: foundAdventure,
    fullYear: fullYear,
    user: req.user,
  })
}

// update booking POST-route
const changeBooking = async (req, res) => {
  let Booking = await User.findOneAndUpdate(
    { _id: req.user._id, 'Adventure._id': req.params.id },
    {
      $set: {
        'Adventure.$.Trip': req.body.Trip,
        'Adventure.$.Date': req.body.Date,
        'Adventure.$.person': req.body.person,
      },
    },
    { new: true }
  )

  Booking.save()

  req.flash('message', 'You have successfully Updated', req.body.Trip)
  res.redirect('/userspage')
}

//Delete images from  post

const deleteMyimages = async (req, res) => {
  console.log(req.body._id)
  //   const userId=req.user._id;

  //   const user = await User.findById({_id:userId});
  //   user.Post.forEach((foundPost)=>{
  //     foundPost.images.forEach(  (foundImages)=>{
  //       foundImages.images.forEach(  (foundImage)=>{
  //         await cloudinary.uploader.destroy(foundImage.filename);
  //       });
  //   });
  // });
}

//--------------------------------User Dash Board --------------------------------------

//Blog Post-delete handler
const postDelete = async (req, res) => {
  const id = req.params.id
  const userId = req.user._id

  const user = await User.findById({ _id: userId })
  user.Post.forEach(foundImages => {
    foundImages.images.forEach(async foundImage => {
      await cloudinary.uploader.destroy(foundImage.filename)
    })
  })
  await User.findOneAndUpdate(
    { _id: userId },
    { $pull: { Post: { _id: id } } },
    { new: true }
  )

  req.flash('message', 'You have Successfully deleted a Post')
  res.redirect('/myblogs')
}

//Post update/delete Get Route
const updatePost = async (req, res) => {
  const id = req.params.id
  let user = await User.findById(
    { _id: req.user._id },
    { Post: { $elemMatch: { _id: id } } },
    { multiple: true }
  )

  res.render('update', {
    foundPost: user.Post,
    foundAdventure: user.Adventure,
    fullYear: fullYear,
    user: req.user,
  })
}

const editPost = async (req, res) => {
  const id = req.params.id

  let user = await User.findOneAndUpdate(
    { _id: req.user._id, 'Post._id': id },
    {
      $set: {
        'Post.$.title': req.body.title,
        'Post.$.place': req.body.place,
        'Post.$.description': req.body.description,
      },
    },
    { new: true }
  )

  user.save()
  res.redirect('/myblogs')
}

const getDashboard = (req, res) => {
  if (req.isAuthenticated()) {
    User.findById(req.user._id, function (err, foundUser) {
      if (err) {
        console.log(err)
      } else {
        res.render('dashboard', {
          user: foundUser.firstName,
          image: foundUser.image,
          Booking: foundUser,
          foundPost: foundUser.Post,
          fullYear: fullYear,
          message: req.flash('message'),
        })
      }
    })
  } else {
    res.redirect('/login')
  }
}
const myBlogs = (req, res) => {
  if (req.isAuthenticated()) {
    User.findById(req.user._id, function (err, foundUser) {
      if (err) {
        console.log(err)
      } else {
        res.render('myblogs', {
          user: foundUser.firstName,
          foundPost: foundUser.Post,
          fullYear: fullYear,
          message: req.flash('message'),
        })
      }
    })
  } else {
    res.redirect('/login')
  }
}

//--------------------------------User Register / login /  passwor  reset routes---------

const usersRoute = (req, res) => {
  if (req.isAuthenticated()) {
    User.findById(req.user._id, function (err, foundUser) {
      if (err) {
        console.log(err)
      } else {
        res.render('userspage', {
          user: foundUser.firstName,
          Booking: foundUser,
          foundPost: foundUser.Post,
          fullYear: fullYear,
          message: req.flash('message'),
        })
      }
    })
  } else {
    res.redirect('/login')
  }
}

//user registeration route
const registerRoute = (req, res) => {
  res.render('Register', {
    user: req.user,
    message: req.flash('message'),
    error: req.flash('error'),
  })
}

const postRegisterRoute = async (req, res) => {
  if (req.file) {
    const { path, filename } = req.file
    req.body.image = { path, filename }
    console.log(req.file)
  }
  let user = await User.findOne({ email: req.body.email })

  //check if email exist and delete profile image if email in use
  if (user) {
    req.flash('error', ' account with that email address exist.')
    return res.redirect('/Register')
  }

  if (req.body.password === req.body.confirm) {
    const newUser = new User({
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      confirm: req.body.confirm,
      image: req.body.image,
    })

    const user = await User.register(newUser, req.body.password)
    req.login(user, function (err) {
      if (err) {
        deleteProfileImage(req)
        req.flash('error', 'An Error occurred while registering')
        res.redirect('/Register')
      } else res.redirect('/dashboard')
    })

    // req.authenticate("local")(req,res, () =>  {
    //   req.flash("message", "Welcome you have successfully registered");
    //    res.redirect("/dashboard");
    //   });

    // }
    //  //save uploaded profile  picture if  user exist
    //  else {
    //   req.flash("error", "Passwords dont match!")
    //   deleteProfileImage(req);
    //   res.redirect("/Register");
  }
}
module.exports = {
  homeRoute,
  getPosts,
  getRouteBlogPost,
  postRoutBlogPost,
  bookingRoute,
  usersRoute,
  cancelBookingRoute,
  bookingUpdate,
  changeBooking,
  registerRoute,
  postRegisterRoute,
  deleteMyimages,
  updatePost,
  postDelete,
  editPost,
  getProfile,
  updateProfile,
  myBlogs,
  getDashboard,
  showApost,
  getMoucha,
  getAmbado,
}
