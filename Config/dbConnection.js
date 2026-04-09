const mongoose = require('mongoose')

const connectiondb = async ()=>{
  try {

    const conn = await mongoose.connect(process.env.MONGODB)
    console.log('MongoDB Connected : ' ,conn.connection.host)
  }catch(err){
    console.log('Error:',err.message)
    process.exit(1)
  }
}
module.exports = connectiondb