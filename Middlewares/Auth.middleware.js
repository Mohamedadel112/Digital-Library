const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')
const User = require('../Models/User.model')

const protect = asyncHandler (async (req,res,next)=>{
  let token ;

  if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
    try{
      token = req.headers.authorization.split(' ')[1]
      console.log("TOKEN:", token);

      const decoded = jwt.verify(token,process.env.JWT_SECRET)
      console.log("DECODED:", decoded);

      req.user = await User.findById(decoded.id).select('-password')
      return next();

    }catch(err){
      console.log(err)
      res.status(401)
      throw new Error('Not Authorized , token Failed')
    }
  }
  if(!token){
    res.status(401)
    throw new Error('Not Authorized , No Token')
  }
})

module.exports = {protect}