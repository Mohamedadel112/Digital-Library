const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const path = require('path')
const connectiondb = require('./Config/dbConnection') 
const {errorHandler} =  require('./Middlewares/AsyncHandler.middleware')
dotenv.config()
connectiondb()
const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:false}))

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'Public')));

// Serve HTML files from Views folder
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Views', 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Views', 'index.html'));
});

app.get('/Register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Views', 'Register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'Views', 'Dashboard.html'));
});


app.use('/api/auth',require('./Routes/Auth.route'))
app.use('/api/books',require('./Routes/Book.route'))


// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});