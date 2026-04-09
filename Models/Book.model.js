const mongoose = require('mongoose')
const Categories = require('../Utils/Categories.enum')
const Status = require('../Utils/Status.enum')
const BookSchema = new mongoose.Schema({

user:{
  type: mongoose.Schema.Types.ObjectId,
  required: true,
  ref: 'User'
},
title:{
    type: String,
    required: [true,'please add a book title'],
    trim: true
},
author:{
  type: String ,
  required: [true,'Please add an author name'],
  trim: true
},
category:{
  type:String,
  required: [true,'Please add a category'],
  enum : [Categories.History,Categories.Novels,Categories.Others,Categories.Scientific,Categories.SelfDevelopment,Categories.Technology],
  default: Categories.Others
},
totalPages:{
  type: Number,
  required : [true,'Please add total number of Pages'],
  min:1
},
currentPage:{
  type:Number,
  min : 0,
  validate:{
    validator:function(value){
      return value <= this.totalPages ;
    },
    message : 'Current page can\'t exceed total pages'
  }
},
status:{
  type: String,
  enum :[Status.Want_to_read,Status.Reading,Status.Finished],
  default: Status.Want_to_read
},
rating:{
  type:Number,
  min:1,
  max:5,
  default:null
},
notes:{
  type:String,
  default :''
},
startdate:{
  type:Date,
  default:null
},
finishdate:{
  type:Date,
  default:null
}
},
{
  timestamps:true
}
);
BookSchema.virtual('progressPercentage').get(function(){
  return this.totalPages > 0 ? Math.round((this.currentPage / this.totalPages) * 100) : 0;
})

BookSchema.pre('save',function(next){
  if(this.currentPage===0){
    this.status=Status.Want_to_read
    this.startdate = null
    this.finishdate = null
  }
  else if(this.currentPage >0 && this.currentPage<this.totalPages){
    this.status=Status.Reading
    if(!this.startdate){
      this.startdate = new Date();
    }
    this.finishdate=null
  }
  else if(this.currentPage >= this.totalPages){
    this.status = Status.Finished
    if(!this.finishdate){
      this.finishdate = new Date()
    }
  }
  next();
})

BookSchema.set('toJSON',{virtual:true})
BookSchema.set('toObject',{virtual:true})

module.exports= mongoose.model('book',BookSchema);