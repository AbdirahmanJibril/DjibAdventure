const {User} =require('../models/user');
const passport = require('passport');
const {cloudinary} =  require('../cloudinary');


const middleware = {
	asyncErrorHandler: (fn) =>
		(req, res, next) => {
			Promise.resolve(fn(req, res, next))
						 .catch(next);
		},
	isLoggedIn: (req, res, next) => {
		if (req.isAuthenticated()) return next();
		req.flash("error",'You need to be logged in to do that!');
		res.redirect('/login');
	},

	isValidPassword: async (req, res, next) => {
		const { user } = await User.authenticate()(req.user.email, req.body.currentPassword);
		if (user) {
			
			// add user to res.locals
			res.locals.user = user;
			next();
		} else {
			middleware.deleteProfileImage(req);
			req.flash('error', 'Incorrect current password!');
			
			return res.redirect('/profile');
		}
	},

	changePassword: async (req, res, next) => {
		const {
			newPassword,
			passwordConfirmation
		} = req.body;
			
		if (newPassword && !passwordConfirmation) {
			middleware.deleteProfileImage(req);
			req.flash('error', 'Passwords must Match');
			return res.redirect('/profile');
		} else if (newPassword && passwordConfirmation) {
			const { user } = res.locals;
			if (newPassword === passwordConfirmation) {
				await user.setPassword(newPassword);
				req.flash('success',  'Password successfully changeg');
				next();
			} else {
				middleware.deleteProfileImage(req);
				req.flash('error', 'Profile not Updated!');
				// req.session.error = 'New passwords must match!';
				return res.redirect('/profile');
			}
		} else {
			next();
		}
	},

	deleteProfileImage: async req =>{
	 if(req.file) await cloudinary.uploader.destroy(req.file.filename);
	}	
};


module.exports=middleware;

