const express = require('express');
const router = express.Router();
const {User, Trip} =require('../models/user');
const  bookingUpdate= ('../controller/index');




router.get("/update/:id", bookingUpdate);
 