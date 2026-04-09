const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../Models/User.model');


const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};


const register = asyncHandler(async (req, res) => {
  const { user, email, password } = req.body;

  
  if (!user || !email || !password) {
    res.status(400);
    throw new Error('Please provide all fields');
  }

  
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }


  const user1 = await User.create({
    user,
    email,
    password
  });

  if (user) {
    res.status(201).json({
      _id: user1._id,
      user: user1.user,
      email: user1.email,
      token: generateToken(user1._id)
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});


const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body



  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

 
  const user1 = await User.findOne({ email }).select('+password');

  if (user1 && (await user1.matchPassword(password))) {
    res.json({
      _id: user1._id,
      user: user1.user,
      email: user1.email,
      token: generateToken(user1._id)
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});


const getMe = asyncHandler(async (req, res) => {
  res.json({
    _id: req.user._id,
    user: req.user.user,
    email: req.user.email
  });
});

module.exports = {
  register,
  login,
  getMe
};