const express = require('express')
const router = express.Router();
const {
  AddBook,
  GetAllBooks,
  GetBookById,
  UpdateBook,
  DeleteBook,
  UpdateProgress,
  RateBook,
  SearchBooks,
  GetReadingStats
} = require('../Controller/Book.controller')
const  {protect} = require('../Middlewares/Auth.middleware')


router.use(protect)

router.get('/states',GetReadingStats)
router.get('/search',SearchBooks)

router.route('/')
      .get(GetAllBooks)
      .post(AddBook)

router.route('/:id')
      .get(GetBookById)
      .put(UpdateBook)
      .delete(DeleteBook)

router.patch('/:id/progress',UpdateProgress)
router.patch('/:id/rate',RateBook)

module.exports = router