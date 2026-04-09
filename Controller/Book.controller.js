const Book = require('../Models/Book.model')
const asyncHandler = require('express-async-handler')
const Status = require('../Utils/Status.enum')

const AddBook = asyncHandler(async(req,res)=>{
  const {title, author, category, totalPages, currentPage, notes } = req.body;
  if(!title || !author || !totalPages){
    res.status(400);
    throw new Error('Please Provide title, author and total pages')
  }

  const  book = await Book.create({
    user:req.user._id,
    title,
    author,category,totalPages,
    currentPage:currentPage|| 0,
    notes:notes || ''
  }) ;
  res.status(201).json(book);
})

const GetAllBooks = asyncHandler (async(req,res)=>{
  const  {status , category , rating} = req.query;

  const filter = {user:req.user._id};
  if(status){
    filter.status=status
  } 
  if(category){
    filter.category=category
  }
  if(rating){
    filter.rating=parseInt(rating)
  }

  const books = await Book.find(filter).sort('-createdAt')

  res.status(200).json({count:books.length,books})
})

const GetBookById= asyncHandler (async (req ,res)=>{

  const book = await Book.findById(req.params.id)
  if(!book){
    res.status(404)
    throw new Error('Book Not Found')
  }

  if(book.user.toString()!==req.user._id.toString()){
    res.status(401)
    throw new Error('Not Authorized to access this book')
  }
  res.json(book).status(200)
}) 

const UpdateBook = asyncHandler (async (req,res)=>{
  const book = await Book.findById(req.params.id)
  if(!book){
    res.status(404)
    throw new Error('Book Not Found')
  }
  if(book.user.toString()!==req.user._id.toString()){
    res.status(401)
    throw new Error('Not Authorized To Update This Book')
  }

  // Update book fields
  Object.keys(req.body).forEach(key => {
    if (req.body[key] !== undefined) {
      book[key] = req.body[key];
    }
  });

  // Save will trigger pre-save hook and validators
  const updateBook = await book.save();
  
  res.status(200).json(updateBook)
}) 

const DeleteBook = asyncHandler (async (req,res)=>{

  const book = await Book.findById(req.params.id)
  if(!book){
    res.status(404)
    throw new Error('Book Not  Found')
  }
  if(book.user.toString()!==req.user._id.toString()){
    res.status(401)
    throw new Error('Not Authorized To Delete This Book')
  }

  await book.deleteOne();

  res.json({msg:'Book Removed Successfully'})
})

const UpdateProgress = asyncHandler (async (req,res)=>{

  const {currentPage} = req.body;

  if(currentPage===undefined){
    res.status(400)
    throw new Error('Please Provide Current Page Number')
  }
  const book = await Book.findById(req.params.id)

  if(!book){
    res.status(404)
    throw new Error('Book Not Found')
  }
  if (book.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }
  book.currentPage=currentPage
  await book.save()
  res.json(book)

})

const RateBook = asyncHandler(async (req, res) => {
  const { rating } = req.body; 

  if (!rating || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Please Provide a Rating Between 1 and 5');
  }

  const book = await Book.findById(req.params.id);

  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  if (book.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  book.rating = rating; 

  await book.save();
  res.json(book);
});


const SearchBooks = asyncHandler (async (req,res)=>{
  const {q}=req.query
  if(!q){
    res.status(400)
    throw new Error('Please Provide a search query')
  }
  const books = await Book.find({
    user:req.user._id,
    $or:[
      {title : {$regex:q , $options: 'i'}},
      {author : {$regex:q , $options: 'i'}},
    ]
  }) 
  res.json({
    count:books.length,
    books
  })

})

const GetReadingStats = asyncHandler (async (req,res)=>{
  const books = await Book.find({user:req.user._id})

  const totalBooks = books.length;
  const  WantedToRead = books.filter(b=>b.status===Status.Want_to_read).length
  const  reading = books.filter(b=>b.status===Status.Reading).length
  const  finished = books.filter(b=>b.status===Status.Finished).length

  const totalPagesRead = books.reduce((sum,book)=>sum+book.currentPage,0)  

  // The Books That finished in This Month
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(),now.getMonth(),1)
  const finishedThisMonth = books.filter(b=>b.finishdate && new Date(b.finishdate) >= startOfMonth).length 

  // The Books That finished in This Year
  const startOfYear = new Date(now.getFullYear(),0,1)
  const finishedThisYear = books.filter(b=>b.finishdate && new Date(b.finishdate) >= startOfYear).length

  // Average Rating
  const ratedBooks = books.filter(b=>b.rating)
  const averageRating = ratedBooks.length > 0 
  ?(ratedBooks.reduce((sum,b)=> sum + b.rating ,0)/ratedBooks.length).toFixed(1)
  : 0 
  
  const categoryCount = {}
  books.forEach(book=>{
    categoryCount[book.category] = (categoryCount[book.category] || 0 ) + 1

  })
  res.json({
    totalBooks,
    byStatus:{
      WantedToRead,
      reading,
      finished
    },
    totalPagesRead,
    finishedThisMonth,
    finishedThisYear,
    averageRating:parseFloat(averageRating),
    categoryCount
  })

}
)

module.exports = {
  AddBook,
  GetAllBooks,
  GetBookById,
  UpdateBook,
  DeleteBook,
  UpdateProgress,
  RateBook,
  SearchBooks,
  GetReadingStats
}